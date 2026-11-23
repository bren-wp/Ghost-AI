// Ghost AI by Brendigo
use crate::llm;
use crate::llm::StreamChunkType;
use crate::llm::agent_builder::{
    AgentConfig, build_user_message, create_provider_agent, stream_chat_with_agent,
};
pub use crate::llm::models::ModelInfo;
use serde::Serialize;
use tokio_util::sync::CancellationToken;
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};

const MODEL_DISCOVERY_FAILED: &str =
    "Unable to load models. Verify the provider URL, API key and network connection.";
const MODEL_TEST_FAILED: &str =
    "Connection failed. Verify the model ID, provider URL, API key and network connection.";

/// Never expose provider HTTP response bodies or transport errors to the
/// webview: providers can echo secret-bearing URLs, headers or prompts.
fn public_model_error(error: anyhow::Error) -> String {
    let detail = error.to_string();
    if let Some(code) = detail.split("[HTTP ").nth(1)
        .and_then(|tail| tail.get(..3))
        .filter(|code| code.bytes().all(|byte| byte.is_ascii_digit()))
        .and_then(|code| code.parse::<u16>().ok())
        .filter(|code| (100..600).contains(code))
    {
        return match code {
            401 | 403 => "Model discovery denied (HTTP 401/403). Verify the API key and model permissions.".to_string(),
            404 => "Model endpoint not found (HTTP 404). Verify the provider base URL.".to_string(),
            429 => "Provider rate limit reached (HTTP 429). Retry after the provider cooldown.".to_string(),
            _ => format!("Model discovery failed (HTTP {code}). Verify the provider configuration."),
        };
    }
    MODEL_DISCOVERY_FAILED.to_string()
}

#[tauri::command]
pub async fn fetch_openai_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<ModelInfo>, String> {
    llm::models::fetch_openai_models(api_key, base_url)
        .await
        .map_err(public_model_error)
}

#[tauri::command]
pub async fn fetch_openrouter_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<ModelInfo>, String> {
    llm::models::fetch_openrouter_models(api_key, base_url)
        .await
        .map_err(public_model_error)
}

#[tauri::command]
pub async fn fetch_ollama_models(base_url: String) -> Result<Vec<ModelInfo>, String> {
    llm::models::fetch_ollama_models(base_url)
        .await
        .map_err(public_model_error)
}

/// Model fetch for Anthropic and custom Anthropic-compatible providers.
#[tauri::command]
pub async fn fetch_anthropic_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<ModelInfo>, String> {
    llm::models::fetch_anthropic_models(api_key, base_url)
        .await
        .map_err(public_model_error)
}

/// Generic model fetch for providers with OpenAI-compatible /models endpoint.
/// Supports: deepseek, groq, together, xai, moonshot, perplexity, hyperbolic, mistral, mira,
/// galadriel, cohere
#[tauri::command]
pub async fn fetch_provider_models(
    provider_type: String,
    api_key: String,
    base_url: String,
) -> Result<Vec<ModelInfo>, String> {
    llm::models::fetch_openai_compatible_models(api_key, base_url, &provider_type)
        .await
        .map_err(public_model_error)
}

#[derive(Debug, Serialize)]
pub struct CheckApiResult {
    pub success: bool,
    pub latency_ms: u64,
    pub error: Option<String>,
}

/// Check provider API connectivity by sending a minimal request.
/// Sends "hi" to the model, aborts on first successful chunk to minimize token usage.
#[tauri::command]
pub async fn check_provider_api(
    provider_type: String,
    model_id: String,
    api_key: Option<String>,
    base_url: Option<String>,
    api_style: Option<String>,
) -> Result<CheckApiResult, String> {
    let start = std::time::Instant::now();

    let config = AgentConfig::new().with_system_prompt("You are a helpful assistant.".to_string());

    let agent = create_provider_agent(
        &provider_type,
        &model_id,
        api_key.as_deref(),
        base_url.as_deref(),
        api_style.as_deref(),
        &config,
    )
    .map_err(|_| MODEL_TEST_FAILED.to_string())?;

    let prompt = build_user_message("hi", &[], &[]);
    let cancel_token = CancellationToken::new();
    let cancel_clone = cancel_token.clone();
    let saw_text = Arc::new(AtomicBool::new(false));
    let saw_text_in_callback = Arc::clone(&saw_text);

    let result = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        stream_chat_with_agent(
            agent,
            prompt,
            vec![],
            cancel_token,
            move |chunk, chunk_type| {
                // Reasoning-only streams do not prove the model can answer a user.
                if matches!(chunk_type, StreamChunkType::Text) && !chunk.trim().is_empty() {
                    saw_text_in_callback.store(true, Ordering::SeqCst);
                    cancel_clone.cancel();
                }
                true
            },
            "check-api",
        ),
    )
    .await;

    let latency_ms = start.elapsed().as_millis() as u64;

    match result {
        Ok(Ok(reply)) => {
            let answered = saw_text.load(Ordering::SeqCst) || !reply.content.trim().is_empty();
            Ok(CheckApiResult {
                success: answered,
                latency_ms,
                error: if answered { None } else { Some(MODEL_TEST_FAILED.to_string()) },
            })
        },
        Ok(Err(e)) => {
            // Successful first-chunk cancellation is an expected outcome;
            // all other native errors must stay inside the Rust boundary.
            let err_str = e.to_string();
            if saw_text.load(Ordering::SeqCst)
                && (err_str.contains("cancelled") || err_str.contains("canceled"))
            {
                Ok(CheckApiResult {
                    success: true,
                    latency_ms,
                    error: None,
                })
            } else {
                Ok(CheckApiResult {
                    success: false,
                    latency_ms,
                    error: Some(MODEL_TEST_FAILED.to_string()),
                })
            }
        }
        Err(_) => Ok(CheckApiResult {
            success: false,
            latency_ms,
            error: Some("Connection timed out (30s)".to_string()),
        }),
    }
}

#[cfg(test)]
mod security_tests {
    use super::*;

    #[test]
    fn does_not_leak_provider_echoed_credentials_or_response_bodies() {
        let secret = "sk-model-secret";
        let err = public_model_error(anyhow::anyhow!(
            "provider returned [HTTP 401] with body: {{\"token\":\"{secret}\"}}"
        ));
        assert!(!err.contains(secret));
        assert!(err.contains("401/403"));
        let generic = public_model_error(anyhow::anyhow!(
            "connection refused: https://api.example.com/v1?api_key={secret}"
        ));
        assert_eq!(generic, MODEL_DISCOVERY_FAILED);
    }

    #[test]
    fn maps_known_http_status_to_actionable_non_secret_errors() {
        for (code, expected) in [(404, "base URL"), (429, "rate limit"), (500, "HTTP 500")] {
            let err = public_model_error(anyhow::anyhow!("[HTTP {code}] bearer SECRET"));
            assert!(err.contains(expected), "got: {err}");
            assert!(!err.contains("SECRET"));
        }
    }
}
