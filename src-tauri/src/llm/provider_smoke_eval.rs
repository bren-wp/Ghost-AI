// Ghost AI by Brendigo
//! Provider smoke eval: prove the non-streaming provider chain (`call_provider`
//! and the vision seam) against a live HTTP endpoint — either the local
//! httpcan mock or a real provider.
//!
//! Test-only; excluded from normal runs. Zero-config run against a local
//! httpcan (https://github.com/seedvector/httpcan) container on port 18080:
//!
//! ```sh
//! cargo test --lib provider_smoke -- --ignored --nocapture
//! ```
//!
//! Real-provider run — set ANY of the variables below and ALL of
//! PROVIDER/MODEL/BASE_URL become required (no accidental localhost defaults):
//!
//! ```sh
//! GHOST_AI_SMOKE_PROVIDER=openai \
//! GHOST_AI_SMOKE_MODEL=gpt-4o-mini \
//! GHOST_AI_SMOKE_BASE_URL=https://api.openai.com/v1 \
//! GHOST_AI_SMOKE_API_KEY=sk-... \
//! cargo test --lib provider_smoke -- --ignored --nocapture
//! ```
//!
//! Both OpenAI wires against httpcan — `custom_openai` + `API_STYLE` picks
//! the wire (`chat_completions` hits `{base}/chat/completions`, anything
//! else hits `{base}/responses`); zero-config defaults are the first row:
//!
//! ```sh
//! # Chat Completions wire
//! GHOST_AI_SMOKE_PROVIDER=custom_openai \
//! GHOST_AI_SMOKE_BASE_URL=http://127.0.0.1:18080/llm/v1 \
//! cargo test --lib provider_smoke -- --ignored --nocapture
//!
//! # Responses wire
//! GHOST_AI_SMOKE_PROVIDER=custom_openai \
//! GHOST_AI_SMOKE_BASE_URL=http://127.0.0.1:18080/llm/v1 \
//! GHOST_AI_SMOKE_API_STYLE=responses \
//! cargo test --lib provider_smoke -- --ignored --nocapture
//! ```
//!
//! Gateways without a Responses implementation answer POST {base}/responses
//! with 404/405; the responses-wire test skips on that signature. A decode
//! error on a live stream stays a hard failure. Known rig 0.42 limitation
//! (not worked around): on tool-free Responses requests some gateways reply
//! `"tools": null` in response.created, which rig's non-Option `Vec` cannot
//! decode (OpenAI omits the field). With tools attached the response carries
//! a tools array and the stream decodes — verified end to end by the agent
//! tool loop below.
//!
//! Full agent tool loop (the model must issue a bash tool call that really
//! executes, then read the result back). The wire follows the provider
//! routing above, so all three wires are covered by three runs:
//!
//! ```sh
//! # Anthropic wire
//! GHOST_AI_SMOKE_PROVIDER=custom_anthropic \
//! GHOST_AI_SMOKE_BASE_URL=https://<gateway>/anthropic \
//! GHOST_AI_SMOKE_API_KEY=... cargo test --lib provider_smoke_agent_tool_loop -- --ignored --nocapture
//!
//! # OpenAI Chat Completions wire
//! GHOST_AI_SMOKE_PROVIDER=custom_openai \
//! GHOST_AI_SMOKE_API_STYLE=chat_completions \
//! GHOST_AI_SMOKE_BASE_URL=https://<gateway>/v1 \
//! GHOST_AI_SMOKE_API_KEY=... cargo test --lib provider_smoke_agent_tool_loop -- --ignored --nocapture
//!
//! # OpenAI Responses wire
//! GHOST_AI_SMOKE_PROVIDER=custom_openai \
//! GHOST_AI_SMOKE_API_STYLE=responses \
//! GHOST_AI_SMOKE_BASE_URL=https://<gateway>/v1 \
//! GHOST_AI_SMOKE_API_KEY=... cargo test --lib provider_smoke_agent_tool_loop -- --ignored --nocapture
//! ```
//!
//! The loop needs a model that actually issues tool calls, so the zero-config
//! httpcan default skips it; run it against a real provider.
//!
//! Env contract:
//! - `GHOST_AI_SMOKE_PROVIDER`   provider_type string (default `custom_openai`)
//! - `GHOST_AI_SMOKE_MODEL`      model id (default `httpcan-smoke-model`)
//! - `GHOST_AI_SMOKE_BASE_URL`   endpoint base URL (default local httpcan mock)
//! - `GHOST_AI_SMOKE_API_KEY`    optional; default `smoke-key` for the mock
//! - `GHOST_AI_SMOKE_API_STYLE`  optional; default `chat_completions`

use anyhow::{Result, anyhow};

use super::tools::VisionQuestionResponder;
use super::{ChatMessage, call_provider};
use ghost_ai_agent_core::tools::ImageQuestionResponder as _;
use ghost_ai_agent_core::tools::image_question::ImageInput;

/// Validate explicit smoke targets without revealing the endpoint in logs.
fn smoke_endpoint(base_url: &str) -> Result<bool> {
    let url = url::Url::parse(base_url).map_err(|_| anyhow!("Invalid smoke endpoint"))?;
    if !matches!(url.scheme(), "http" | "https")
        || url.host().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(anyhow!("Smoke endpoint must be an HTTP(S) base URL without credentials, query or fragment"));
    }
    let local = match url.host() {
        Some(url::Host::Domain(host)) => host.eq_ignore_ascii_case("localhost"),
        Some(url::Host::Ipv4(ip)) => ip.is_loopback(),
        Some(url::Host::Ipv6(ip)) => ip.is_loopback(),
        None => false,
    };
    if !local && url.scheme() != "https" {
        return Err(anyhow!("Non-loopback smoke endpoints must use HTTPS"));
    }
    Ok(local)
}

#[test]
fn smoke_endpoint_validation() {
    for url in ["http://localhost:18080/v1", "http://127.0.0.1:18080/v1", "http://[::1]:18080/v1"] {
        assert!(smoke_endpoint(url).unwrap());
    }
    assert!(!smoke_endpoint("https://api.example.com/v1").unwrap());
    assert!(!smoke_endpoint("https://localhost.example.com/v1").unwrap());
    for url in [
        "http://localhost.example.com/v1",
        "http://127.0.0.1.example.com/v1",
        "https://user:secret@api.example.com/v1",
        "https://api.example.com/v1?key=secret",
        "file:///tmp/test",
    ] {
        assert!(smoke_endpoint(url).is_err());
    }
}

struct SmokeConfig {
    provider: String,
    model: String,
    base_url: String,
    api_key: String,
    api_style: Option<String>,
    mock_target: bool,
}

impl SmokeConfig {
    fn from_env() -> Result<Self> {
        let provider = std::env::var("GHOST_AI_SMOKE_PROVIDER").ok();
        let model = std::env::var("GHOST_AI_SMOKE_MODEL").ok();
        let base_url = std::env::var("GHOST_AI_SMOKE_BASE_URL").ok();

        // All-unset => local httpcan defaults, announced so a keyless run is
        // never mistaken for a real-provider one. Any explicit override
        // switches to strict mode so a real run can never silently hit
        // localhost.
        let mock_target = provider.is_none() && model.is_none() && base_url.is_none();
        let (provider, model, base_url) =
            if mock_target {
                println!(
                    "no GHOST_AI_SMOKE_* variables detected — targeting the local httpcan \
                     mock; export GHOST_AI_SMOKE_PROVIDER/MODEL/BASE_URL/API_KEY to hit a \
                     real provider"
                );
                (
                    "custom_openai".to_string(),
                    "httpcan-smoke-model".to_string(),
                    "http://127.0.0.1:18080/llm/v1".to_string(),
                )
            } else {
                let provider =
                    provider.ok_or_else(|| anyhow!("GHOST_AI_SMOKE_PROVIDER is required"))?;
                let model = model.ok_or_else(|| anyhow!("GHOST_AI_SMOKE_MODEL is required"))?;
                let base_url =
                    base_url.ok_or_else(|| anyhow!("GHOST_AI_SMOKE_BASE_URL is required"))?;
                (provider, model, base_url)
            };

        let local = smoke_endpoint(&base_url)?;
        let api_key = match std::env::var("GHOST_AI_SMOKE_API_KEY") {
            Ok(key) if !key.trim().is_empty() => key,
            _ if local => {
                "smoke-key".to_string()
            }
            // The placeholder once leaked to a real provider and cost a
            // confusing 401; refuse instead of sending it off-box.
            _ => {
                return Err(anyhow!(
                    "GHOST_AI_SMOKE_API_KEY is required for non-local base URLs (refusing to send the placeholder 'smoke-key')"
                ));
            }
        };

        Ok(Self {
            provider,
            model,
            base_url,
            api_key,
            mock_target,
            api_style: std::env::var("GHOST_AI_SMOKE_API_STYLE")
                .ok()
                .or_else(|| Some("chat_completions".to_string())),
        })
    }
}

fn user_message(content: &str) -> ChatMessage {
    ChatMessage {
        role: "user".to_string(),
        content: content.to_string(),
        images: vec![],
        files: vec![],
        tool_calls: vec![],
        tool_call_id: None,
        tool_result_call_id: None,
        reasoning_content: None,
    }
}

fn system_message(content: &str) -> ChatMessage {
    ChatMessage {
        role: "system".to_string(),
        content: content.to_string(),
        images: vec![],
        files: vec![],
        tool_calls: vec![],
        tool_call_id: None,
        tool_result_call_id: None,
        reasoning_content: None,
    }
}

/// A real 8x8 red PNG so the vision payload carries valid image bytes.
fn tiny_red_png() -> Vec<u8> {
    let img = image::RgbImage::from_pixel(8, 8, image::Rgb([200, 30, 30]));
    let mut buf = std::io::Cursor::new(Vec::new());
    image::DynamicImage::ImageRgb8(img)
        .write_to(&mut buf, image::ImageFormat::Png)
        .expect("encode test png");
    buf.into_inner()
}

#[tokio::test]
#[ignore = "network smoke: targets local httpcan by default or a real provider via GHOST_AI_SMOKE_* env vars"]
async fn provider_smoke_text_roundtrip() {
    let config = SmokeConfig::from_env().expect("smoke config");
    println!(
        "smoke target: provider={} model={}",
        config.provider, config.model
    );

    let response = call_provider(
        &config.provider,
        config.model.clone(),
        vec![
            system_message("You are a smoke test assistant."),
            user_message("Reply with any non-empty sentence."),
        ],
        Some(config.api_key.clone()),
        Some(config.base_url.clone()),
        config.api_style.clone(),
    )
    .await
    .unwrap_or_else(|_| panic!("Text smoke failed; verify configuration, model permissions and network"));

    let content = response.content;
    println!("Text reply received: {} bytes", content.len());
    assert!(!content.trim().is_empty(), "reply must be non-empty");
}

#[tokio::test]
#[ignore = "network smoke: targets local httpcan by default or a real provider via GHOST_AI_SMOKE_* env vars"]
async fn provider_smoke_vision_question() {
    let config = SmokeConfig::from_env().expect("smoke config");
    println!(
        "smoke target: provider={} model={}",
        config.provider, config.model
    );

    let responder = VisionQuestionResponder::new(
        config.provider.clone(),
        config.model.clone(),
        Some(config.api_key.clone()),
        Some(config.base_url.clone()),
        config.api_style.clone(),
    );

    let answer = responder
        .answer(
            ImageInput {
                bytes: tiny_red_png(),
                mime_type: "image/png".to_string(),
            },
            "What color is this image?".to_string(),
        )
        .await
        .unwrap_or_else(|_| panic!("Vision smoke failed; verify image capability and configuration"));

    println!("Vision reply received: {} bytes", answer.len());
    assert!(!answer.trim().is_empty(), "answer must be non-empty");
}

#[tokio::test]
#[ignore = "network smoke: targets local httpcan by default or a real provider via GHOST_AI_SMOKE_* env vars"]
async fn provider_smoke_openai_responses_wire() {
    let config = SmokeConfig::from_env().expect("smoke config");
    if !matches!(config.provider.as_str(), "openai" | "custom_openai") {
        panic!("Select an OpenAI Responses-compatible provider for this test");
    }
    println!(
        "smoke target: provider={} model={} (responses wire)",
        config.provider, config.model
    );

    // api_style None steers custom_openai away from chat_completions onto the
    // rig-native OpenAI Responses client.
    let result = call_provider(
        &config.provider,
        config.model.clone(),
        vec![
            system_message("You are a smoke test assistant."),
            user_message("Reply with any non-empty sentence."),
        ],
        Some(config.api_key.clone()),
        Some(config.base_url.clone()),
        None,
    )
    .await;

    let response = match result {
        Ok(response) => response,
        Err(error) => {
            let message = error.to_string();
            // A missing Responses endpoint is not a successful smoke test.
            // Never print raw provider responses, which can contain credentials.
            let _ = message;
            panic!("Responses smoke failed; verify protocol support and configuration");
        }
    };

    println!("Responses reply received: {} bytes", response.content.len());
    assert!(
        !response.content.trim().is_empty(),
        "reply must be non-empty"
    );
}

#[tokio::test]
#[ignore = "network smoke: the full agent tool loop needs a real tool-calling model; the local mock cannot drive it"]
async fn provider_smoke_agent_tool_loop() {
    use futures::StreamExt;
    use rig::agent::MultiTurnStreamItem;
    use rig::message::UserContent;
    use rig::prelude::StreamingChat;
    use rig::streaming::StreamedAssistantContent;

    use super::agent_builder::{AgentConfig, create_provider_agent};

    let config = SmokeConfig::from_env().expect("smoke config");
    if config.mock_target {
        panic!("Agent-loop smoke requires an explicitly configured tool-capable model");
    }
    // The test executes a model-generated shell tool call. Never run it on
    // a routine CI host with real credentials or without explicit consent.
    assert_eq!(
        std::env::var("GHOST_AI_SMOKE_ALLOW_TOOL_EXECUTION").ok().as_deref(),
        Some("1"),
        "Run only in an isolated disposable environment with explicit tool execution opt-in"
    );
    let wire = match (config.provider.as_str(), config.api_style.as_deref()) {
        ("custom_anthropic", _) => "anthropic",
        ("openai" | "custom_openai", Some("chat_completions")) => "openai-chat-completions",
        ("openai" | "custom_openai", _) => "openai-responses",
        (provider, _) => provider,
    };
    println!(
        "smoke target: provider={} model={} wire={wire} (agent tool loop)",
        config.provider, config.model
    );

    // The model must drive bash to drop a marker file whose content it has
    // never seen, then read the value back from the tool result — proving
    // the whole loop: model -> tool call -> real execution -> result -> model.
    let workdir = tempfile::tempdir().unwrap();
    let token = format!("ghost_ai-e2e-{:016x}", rand::random::<u64>());
    let marker = workdir.path().join("marker.txt");

    let agent_config = AgentConfig::new()
        .with_bash()
        .with_bash_working_directory(workdir.path().to_string_lossy().to_string());
    let agent = create_provider_agent(
        &config.provider,
        &config.model,
        Some(config.api_key.as_str()),
        Some(config.base_url.as_str()),
        config.api_style.as_deref(),
        &agent_config,
    )
    .expect("agent construction must succeed");

    let prompt = rig::completion::Message::User {
        content: vec![UserContent::text(format!(
            "Use the bash tool to run exactly this command: echo {token} > marker.txt. \
             After it succeeds, reply with just the token and nothing else."
        ))],
    };

    let mut text = String::new();
    let mut stream = agent
        .stream_chat(prompt, Vec::<rig::completion::Message>::new())
        .max_turns(20)
        .await;
    tokio::time::timeout(std::time::Duration::from_secs(180), async {
        while let Some(item) = stream.next().await {
            match item {
                Ok(MultiTurnStreamItem::StreamAssistantItem(StreamedAssistantContent::Text(
                    delta,
                ))) => text.push_str(&delta.text),
                Ok(_) => {}
                Err(_) => panic!("Agent-loop stream failed"),
            }
        }
    })
    .await
    .expect("agent loop must finish within the timeout");

    println!("Agent final reply received: {} bytes", text.len());
    let marker_content = std::fs::read_to_string(&marker).unwrap_or_default();
    assert_eq!(
        marker_content.trim(),
        token,
        "the bash tool must have really executed"
    );
    assert!(
        text.contains(&token),
        "the model must have read the tool result back"
    );
}
