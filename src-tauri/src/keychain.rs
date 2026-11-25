// Ghost AI by Brendigo
use anyhow::{Result, anyhow};
use keyring::Entry;
use std::collections::HashMap;
use std::sync::RwLock;
use zeroize::Zeroizing;

/// Environment variable that opts every public function in this module into
/// the in-process mock keychain backend in debug builds or unit tests.
/// Use it only in isolated development and test environments where touching
/// the real OS keychain would be wrong.
///
/// Unit tests install it automatically via `cfg!(test)`; the env var remains
/// as an escape hatch for debug-profile external runners that link this crate.
/// Release binaries ignore it even if inherited from the process environment.
#[cfg(any(test, debug_assertions))]
const MOCK_KEYRING_ENV: &str = "GHOST_AI_TEST_MOCK_KEYRING";

/// Service name for keychain entries
const SERVICE_NAME: &str = "app.ghost_ai.desktop";

/// In-memory cache for secrets read from the OS keychain.
/// Avoids repeated keychain access which triggers macOS authorization dialogs,
/// especially during development where the binary signature changes on rebuild.
/// Hold the write guard across keychain I/O and cache updates to prevent a
/// concurrent cache miss from reintroducing a rotated or deleted credential.
/// Cached values are zeroized on removal or replacement. The public API still
/// returns owned Strings; their consumers must manage those lifetimes separately.
type SecretCache = HashMap<String, Zeroizing<String>>;
static SECRET_CACHE: std::sync::OnceLock<RwLock<SecretCache>> = std::sync::OnceLock::new();

fn cache() -> &'static RwLock<SecretCache> {
    SECRET_CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

/// One-shot guard that swaps in the in-process mock credential builder.
#[cfg(any(test, debug_assertions))]
static MOCK_KEYRING_INSTALL: std::sync::Once = std::sync::Once::new();

/// Installs the in-process mock credential builder so subsequent
/// `keyring::Entry` calls hit an in-memory store instead of the real OS
/// keychain (macOS SecKeychain, Windows Credential Manager, Linux Secret
/// Service).
///
/// The install is process-global and idempotent; later calls are no-ops.
/// Production builds never reach this function (the
/// [`install_mock_keyring_if_needed`] gate below guards every public
/// entry point), so the real keychain backend remains the default in
/// shipped builds.
pub fn install_mock_keyring() {
    // The mock implementation is not compiled into a production binary.
    #[cfg(any(test, debug_assertions))]
    MOCK_KEYRING_INSTALL.call_once(|| {
        let builder = keyring::mock::default_credential_builder();
        keyring::set_default_credential_builder(builder);
    });
}

/// Installs the mock credential builder iff [`MOCK_KEYRING_ENV`] is set in
/// the process environment. Cheap to call from every public function entry
/// point — it short-circuits when the env var is unset, and when it is set
/// the inner [`std::sync::Once`] collapses repeated calls to a single
/// install.
#[inline]
fn install_mock_keyring_if_needed() {
    // Unit tests (`cargo test` on this crate) compile with cfg(test), so the
    // mock installs automatically. The env var remains as an escape hatch for
    // external runners that link this crate without cfg(test). It MUST NOT be
    // exported via .cargo/config.toml [env]: that table applies to every
    // cargo invocation, including `tauri dev`, where the mock would silently
    // replace the real keychain and break decryption of persisted secrets.
    #[cfg(any(test, debug_assertions))]
    if cfg!(test) || std::env::var_os(MOCK_KEYRING_ENV).is_some() {
        install_mock_keyring();
    }
}

/// Store a secret in the OS keychain and update the in-memory cache.
pub fn set_secret(key: &str, secret: &str) -> Result<()> {
    install_mock_keyring_if_needed();

    let mut c = cache()
        .write()
        .map_err(|_| anyhow!("Keychain cache lock poisoned"))?;
    let entry = Entry::new(SERVICE_NAME, key)
        .map_err(|e| anyhow!("Failed to create keyring entry: {}", e))?;

    // An OS backend can report a write error after attempting a mutation.
    // Invalidate the old cache entry before I/O so an error cannot leave
    // an apparently authoritative stale credential in memory.
    c.remove(key);
    entry
        .set_password(secret)
        .map_err(|e| anyhow!("Failed to store secret: {}", e))?;

    c.insert(key.to_string(), Zeroizing::new(secret.to_owned()));

    tracing::info!("[keychain] Stored secret");
    Ok(())
}

/// Retrieve a secret, returning the in-memory cached value when available
/// to avoid triggering the macOS keychain authorization dialog repeatedly.
pub fn get_secret(key: &str) -> Result<Option<String>> {
    install_mock_keyring_if_needed();
    get_secret_with(key, || {
        let entry = Entry::new(SERVICE_NAME, key)
            .map_err(|e| anyhow!("Failed to create keyring entry: {}", e))?;
        read_password(&entry)
    })
}

// The loader runs only on a cache miss, under the same exclusive guard
// used for rotation and deletion. Tests can retain a single mock Entry
// because keyring's mock backend stores passwords per Entry instance.
fn get_secret_with(
    key: &str,
    load: impl FnOnce() -> Result<Option<String>>,
) -> Result<Option<String>> {
    {
        let c = cache()
            .read()
            .map_err(|_| anyhow!("Keychain cache lock poisoned"))?;
        if let Some(v) = c.get(key) {
            return Ok(Some(v.as_str().to_owned()));
        }
    }

    // Upgrade by dropping the read guard first, then recheck: another
    // operation may have populated or invalidated the entry in between.
    let mut c = cache()
        .write()
        .map_err(|_| anyhow!("Keychain cache lock poisoned"))?;
    if let Some(v) = c.get(key) {
        return Ok(Some(v.as_str().to_owned()));
    }

    match load()? {
        Some(password) => {
            let password = Zeroizing::new(password);
            let result = password.as_str().to_owned();
            c.insert(key.to_string(), password);
            Ok(Some(result))
        }
        None => Ok(None),
    }
}

fn read_password(entry: &Entry) -> Result<Option<String>> {
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(anyhow!("Failed to retrieve secret: {}", e)),
    }
}

/// Delete a secret from the OS keychain and the in-memory cache.
#[allow(dead_code)]
pub fn delete_secret(key: &str) -> Result<()> {
    install_mock_keyring_if_needed();

    let mut c = cache()
        .write()
        .map_err(|_| anyhow!("Keychain cache lock poisoned"))?;
    // Invalidate even on a backend error; do not return a stale cached
    // credential after an unsuccessful delete attempt.
    c.remove(key);

    let entry = Entry::new(SERVICE_NAME, key)
        .map_err(|e| anyhow!("Failed to create keyring entry: {}", e))?;

    match entry.delete_credential() {
        Ok(()) => {
            tracing::info!("[keychain] Deleted secret");
            Ok(())
        }
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(anyhow!("Failed to delete secret: {}", e)),
    }
}

/// Check if the OS keychain is available
#[allow(dead_code)]
pub fn is_keychain_available() -> bool {
    install_mock_keyring_if_needed();
    Entry::new(SERVICE_NAME, "availability_check").is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_and_get_secret() {
        let test_key = "test_secret_key_manual";
        let test_value = "test_secret_value";

        // Clean up any existing entry
        let _ = delete_secret(test_key);

        // Set the secret
        set_secret(test_key, test_value).expect("Failed to set secret");

        // Get the secret
        let retrieved = get_secret(test_key)
            .expect("Failed to get secret")
            .expect("Secret not found");

        assert_eq!(retrieved, test_value);

        // Clean up
        delete_secret(test_key).expect("Failed to delete secret");
    }

    #[test]
    fn test_rotation_and_deletion_invalidate_cached_credentials() {
        let key = "test_keychain_rotation_cache";
        let other = "test_keychain_rotation_unrelated";
        delete_secret(key).unwrap();
        delete_secret(other).unwrap();

        set_secret(key, "old").unwrap();
        set_secret(other, "unrelated").unwrap();
        assert_eq!(get_secret(key).unwrap().as_deref(), Some("old"));

        set_secret(key, "new").unwrap();
        assert_eq!(get_secret(key).unwrap().as_deref(), Some("new"));
        delete_secret(key).unwrap();
        assert!(!cache().read().unwrap().contains_key(key));
        assert_eq!(get_secret(key).unwrap(), None);
        assert_eq!(get_secret(other).unwrap().as_deref(), Some("unrelated"));

        delete_secret(key).unwrap();
        delete_secret(other).unwrap();
    }

    #[test]
    fn test_cache_eviction_and_rotation_with_zeroizing_values() {
        let key = "test_zeroizing_cache_lifecycle";
        delete_secret(key).unwrap();
        set_secret(key, "first").unwrap();
        {
            let guard = cache().read().unwrap();
            let value: &Zeroizing<String> = guard.get(key).unwrap();
            assert_eq!(value.as_str(), "first");
        }
        set_secret(key, "second").unwrap();
        assert_eq!(get_secret(key).unwrap().as_deref(), Some("second"));
        // keyring::mock is per Entry, not a persistent OS keychain.
        // Retain a seeded mock entry and exercise the actual cache-miss
        // loader and password decoding instead of relying on persistence
        // between independent mock instances.
        let backend = Entry::new(SERVICE_NAME, key).unwrap();
        backend.set_password("second").unwrap();
        cache().write().unwrap().remove(key);
        assert_eq!(
            get_secret_with(key, || read_password(&backend)).unwrap().as_deref(),
            Some("second")
        );
        {
            let guard = cache().read().unwrap();
            let value: &Zeroizing<String> = guard.get(key).unwrap();
            assert_eq!(value.as_str(), "second");
        }
        assert_eq!(
            get_secret_with(key, || panic!("cache hit must not invoke backend"))
                .unwrap().as_deref(),
            Some("second")
        );
        backend.delete_credential().unwrap();
        delete_secret(key).unwrap();
        assert!(!cache().read().unwrap().contains_key(key));
        assert_eq!(get_secret(key).unwrap(), None);
    }

    #[test]
    fn test_cache_miss_does_not_store_absent_or_failed_reads() {
        let key = "test_zeroizing_cache_miss_error";
        delete_secret(key).unwrap();
        assert_eq!(get_secret_with(key, || Ok(None)).unwrap(), None);
        assert!(get_secret_with(key, || Err(anyhow!("synthetic backend error"))).is_err());
        assert!(!cache().read().unwrap().contains_key(key));
        assert_eq!(
            get_secret_with(key, || Ok(Some("recovered".to_owned())))
                .unwrap().as_deref(),
            Some("recovered")
        );
        delete_secret(key).unwrap();
    }

    #[test]
    fn test_entry_creation() {
        // Just verify that Entry creation works (doesn't require keychain access)
        let result = Entry::new(SERVICE_NAME, "test_key");
        assert!(result.is_ok(), "Failed to create keyring entry");
    }
}
