// Ghost AI by Brendigo
use std::fs;
use std::panic;
use std::path::{Path, PathBuf};

pub fn log_path(root: &Path) -> PathBuf {
    root.join("com.brendigo.ghostai")
        .join("logs")
        .join("ghost-ai-startup.log")
}

pub fn record_startup_failure(reason: &str) {
    let root = dirs::data_local_dir().unwrap_or_else(std::env::temp_dir);
    let path = log_path(&root);
    let Some(parent) = path.parent() else {
        return;
    };
    if fs::create_dir_all(parent).is_err() {
        return;
    }
    let truncated: String = reason.chars().take(4096).collect();
    let data = format!(
        "Ghost AI by Brendigo\nTime (UTC): {}\nStartup error: {}\n",
        chrono::Utc::now().to_rfc3339(),
        truncated
    );
    let _ = fs::write(path, data);
}

pub fn install_panic_reporter() {
    let previous = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        record_startup_failure(&info.to_string());
        previous(info);
    }));
}

#[cfg(test)]
mod tests {
    use super::log_path;
    use std::path::Path;

    #[test]
    fn startup_report_uses_a_branded_local_path() {
        let path = log_path(Path::new("base"));
        assert!(path.ends_with("com.brendigo.ghostai/logs/ghost-ai-startup.log"));
    }
}
