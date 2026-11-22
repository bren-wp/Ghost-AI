// Ghost AI by Brendigo
use super::AppState;
use crate::models::{CreateProviderRequest, Provider};
use tauri::State;

// The Tauri command boundary must not return native database/keyring errors,
// which may include paths, SQL or accidental credential strings.
fn public_provider_error(_: anyhow::Error) -> String {
    tracing::error!("[providers] A database provider operation failed");
    "Unable to complete provider operation. Please retry.".to_string()
}

#[tauri::command]
pub async fn create_provider(
    state: State<'_, AppState>,
    req: CreateProviderRequest,
) -> Result<Provider, String> {
    state
        .db
        .create_provider(req)
        .await
        .map_err(public_provider_error)
}

#[tauri::command]
pub async fn get_provider(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Provider>, String> {
    state.db.get_provider(&id).await.map_err(public_provider_error)
}

#[tauri::command]
pub async fn list_providers(state: State<'_, AppState>) -> Result<Vec<Provider>, String> {
    state.db.list_providers().await.map_err(public_provider_error)
}

#[tauri::command]
pub async fn update_provider(
    state: State<'_, AppState>,
    id: String,
    req: CreateProviderRequest,
) -> Result<Provider, String> {
    state
        .db
        .update_provider(&id, req)
        .await
        .map_err(public_provider_error)
}

#[tauri::command]
pub async fn delete_provider(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .db
        .delete_provider(&id)
        .await
        .map_err(public_provider_error)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn does_not_reveal_native_database_errors_to_frontend() {
        let secret = "sk-secret-from-native-layer";
        let err = public_provider_error(anyhow::anyhow!("SQLite error: {secret}"));
        assert!(!err.contains(secret));
        assert_eq!(err, "Unable to complete provider operation. Please retry.");
    }
}
