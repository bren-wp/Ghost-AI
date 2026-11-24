// Ghost AI by Brendigo
//! Opt-in native credential-store smoke test. Never run against production keys.
//! The example is built in release mode so the mock backend cannot be installed.

#[path = "../src/keychain.rs"]
mod keychain;

use anyhow::{bail, ensure, Context, Result};
use std::process::Command;
use std::sync::Barrier;
use std::time::{Duration, Instant};

const PREFIX: &str = "ghost-ai-native-smoke-";
const INITIAL: &str = "synthetic-initial-value";
const ROTATED: &str = "synthetic-rotated-value";

fn valid_key(key: &str) -> bool {
    key.strip_prefix(PREFIX)
        .and_then(|suffix| uuid::Uuid::parse_str(suffix).ok())
        .is_some()
}

fn check_value(key: &str, phase: &str) -> Result<()> {
    ensure!(valid_key(key), "Invalid synthetic credential identifier");
    let expected = match phase {
        "initial" => Some(INITIAL),
        "rotated" => Some(ROTATED),
        "deleted" => None,
        _ => bail!("Unknown verification phase"),
    };
    let actual = keychain::get_secret(key).map_err(|_| anyhow::anyhow!("Native read failed"))?;
    ensure!(actual.as_deref() == expected, "Native credential state mismatch");
    Ok(())
}

fn fresh_process(key: &str, phase: &str) -> Result<()> {
    let mut child = Command::new(std::env::current_exe()?)
        .args(["--verify", key, phase])
        .spawn()
        .context("Unable to start independent credential reader")?;
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                ensure!(status.success(), "Independent native credential verification failed");
                return Ok(());
            }
            Ok(None) if Instant::now() < deadline => {
                std::thread::sleep(Duration::from_millis(25));
            }
            result => {
                let _ = child.kill();
                child.wait().context("Unable to reap credential reader")?;
                match result {
                    Err(_) => bail!("Unable to inspect credential reader"),
                    _ => bail!("Independent credential verification timed out"),
                }
            }
        }
    }
}

// Exercise overlapping reads and rotations of the same synthetic credential.
// Final verification uses a new process, not just the shared cache.
fn concurrent_rotation(key: &str) -> Result<()> {
    const READERS: usize = 4;
    const READS: usize = 32;
    const ROTATIONS: usize = 8;
    let barrier = Barrier::new(READERS + 1);
    std::thread::scope(|scope| -> Result<()> {
        let mut readers = Vec::with_capacity(READERS);
        for _ in 0..READERS {
            let barrier = &barrier;
            readers.push(scope.spawn(move || -> Result<()> {
                barrier.wait();
                for _ in 0..READS {
                    let value = keychain::get_secret(key)
                        .map_err(|_| anyhow::anyhow!("Concurrent native read failed"))?;
                    ensure!(
                        matches!(value.as_deref(), Some(INITIAL) | Some(ROTATED)),
                        "Unexpected credential during rotation"
                    );
                    std::thread::yield_now();
                }
                Ok(())
            }));
        }
        barrier.wait();
        for index in 0..ROTATIONS {
            let value = if index % 2 == 0 { INITIAL } else { ROTATED };
            keychain::set_secret(key, value)
                .map_err(|_| anyhow::anyhow!("Concurrent native rotation failed"))?;
            std::thread::yield_now();
        }
        for reader in readers {
            reader.join().map_err(|_| anyhow::anyhow!("Credential reader panicked"))??;
        }
        Ok(())
    })?;
    check_value(key, "rotated")?;
    fresh_process(key, "rotated")
}

fn smoke(key: &str) -> Result<()> {
    check_value(key, "deleted")?;
    keychain::set_secret(key, INITIAL).map_err(|_| anyhow::anyhow!("Native write failed"))?;
    check_value(key, "initial")?;
    fresh_process(key, "initial")?;

    keychain::set_secret(key, ROTATED).map_err(|_| anyhow::anyhow!("Native rotation failed"))?;
    check_value(key, "rotated")?;
    fresh_process(key, "rotated")?;
    concurrent_rotation(key)?;

    keychain::delete_secret(key).map_err(|_| anyhow::anyhow!("Native delete failed"))?;
    check_value(key, "deleted")?;
    fresh_process(key, "deleted")?;
    Ok(())
}

fn main() -> Result<()> {
    ensure!(!cfg!(debug_assertions), "Native smoke requires a release-profile build");
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.as_slice() {
        [mode, key, phase] if mode == "--verify" => check_value(key, phase),
        [mode] if mode == "--run" => {
            let key = format!("{PREFIX}{}", uuid::Uuid::now_v7());
            let result = smoke(&key);
            // Attempt cleanup even if an assertion or subprocess failed.
            let cleanup = keychain::delete_secret(&key)
                .map_err(|_| anyhow::anyhow!("Synthetic native credential cleanup failed"));
            if cleanup.is_err() {
                eprintln!("Synthetic credential cleanup failed");
            }
            result?;
            cleanup?;
            println!("Native credential write, cross-process read, concurrent rotation and deletion passed");
            Ok(())
        }
        _ => bail!("Explicit --run opt-in required"),
    }
}
