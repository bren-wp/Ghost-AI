// Ghost AI by Brendigo
fn main() {
    // The Tauri Windows app embeds a Common-Controls v6 manifest, but Cargo's
    // lib unit-test harness does not inherit its resource manifest. Without it
    // Windows loads legacy comctl32 v5, which lacks TaskDialogIndirect, and
    // `cargo test` exits before running tests (STATUS_ENTRYPOINT_NOT_FOUND).
    //
    // On Windows/MSVC, let the linker embed the equivalent Common-Controls v6
    // dependency in *both* the production binary and the test harness. Disable
    // Tauri's resource manifest there to avoid duplicate RT_MANIFEST resources.
    // All other targets retain Tauri's normal build behavior.
    let windows_msvc = std::env::var("CARGO_CFG_TARGET_OS").ok().as_deref() == Some("windows")
        && std::env::var("CARGO_CFG_TARGET_ENV").ok().as_deref() == Some("msvc");

    let mut attributes = tauri_build::Attributes::new();
    if windows_msvc {
        const COMMON_CONTROLS_V6: &str = "type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'";
        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg=/MANIFESTDEPENDENCY:{COMMON_CONTROLS_V6}");

        attributes = attributes
            .windows_attributes(tauri_build::WindowsAttributes::new_without_app_manifest());
    }

    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
