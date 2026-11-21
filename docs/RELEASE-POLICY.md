# Ghost AI release and distribution policy

The first release line starts at **v0.1.0**. Subsequent builds use semantic versions and only publish when tests, packaging, malware checks and required signature validation succeed.

## Expected deliverables

| Platform | Installer | Portable | Update |
|---|---|---|---|
| Windows x64 | Ghost-AI-vX.Y.Z-Setup.exe | Ghost-AI-vX.Y.Z-Portable.exe and ZIP with required resources | Signed Tauri updater for installed build; standalone Update.exe only if it can validate the publisher signature |
| Linux x86_64 | AppImage and .deb | AppImage | Signed AppImage update |
| macOS | .dmg | App bundle archive | Signed/notarized app updates |

A portable Windows executable can require companion resources, model catalogs or the system WebView runtime. A one-file EXE is *not* a promise of full portability unless confirmed on clean Windows test machines.

## Static site without database

Publish release binaries to a static HTTPS directory on **brendigo.com**. The latest manifest is a plain JSON file, for example `https://brendigo.com/ghost-ai/updates/latest.json`. Files can be served by an ordinary static PHP/Apache/Nginx host without SQL or background jobs.

A Tauri-compatible manifest needs per-platform versions, HTTPS download URLs and cryptographic signatures. Never publish private updater signing keys. A bad or missing signature must block installation.

## Security gates

- All dependencies scanned and locked before release.
- Tests and linting pass on each target architecture.
- Strict permissions, no broad shell access by default.
- EULA display in installer, required third-party notices bundled.
- Installer and update paths checked for rollback and tamper resistance.
- Windows signing certificate and macOS signing/notarization are needed for trusted production distribution.
- Product and screenshot claims must be verified against the built binary.

No published build should be called production-ready until these checks pass.
