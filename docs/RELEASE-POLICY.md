# Ghost AI release and distribution policy

The first release line starts at **v0.1.0**. Subsequent builds use semantic versions. GitHub releases remain **prereleases** until clean-machine launch, package integrity, platform signing and security checks have been independently verified. A successful build is not evidence that the application launches correctly.

## Expected deliverables

| Platform | Installer | Portable | Update |
|---|---|---|---|
| Windows x64 | Ghost-AI-vX.Y.Z-Setup.exe | Ghost-AI-vX.Y.Z-Portable.exe and ZIP with required resources | Signed Tauri updater for installed build; standalone Update.exe only if it can validate the publisher signature |
| Linux x86_64 | AppImage and .deb | AppImage | Signed AppImage update |
| macOS | .dmg | App bundle archive | Signed/notarized app updates |

A portable Windows executable can require companion resources, model catalogs or the system WebView runtime. A one-file EXE is *not* a promise of full portability unless confirmed on clean Windows test machines.

## CI checks and current limits

- Every pull request compiles and opens a production Windows executable staged with its packaged resources. The smoke check fails if the process exits, no main window becomes visible, or the window disappears immediately.
- Windows release jobs check installed, portable and update packages, and save diagnostics even when a check fails.
- Linux and macOS release jobs currently build their packages, but do **not** yet prove a visible application window or operation on a clean user device. Their build failures must block publication rather than silently omit an artifact.
- A release requires all expected platform files and a regenerated SHA-256 list covering the actual uploaded packages.
- GitHub CI does not by itself establish antivirus cleanliness, Authenticode signing, macOS notarization, functional AI provider coverage, or accessibility compliance. Record these independently before promoting any build from prerelease to stable.

## Static site without database

Publish release binaries to a static HTTPS directory on **brendigo.com**. The latest manifest is a plain JSON file, for example `https://brendigo.com/ghost-ai/updates/latest.json`. Files can be served by an ordinary static PHP/Apache/Nginx host without SQL or background jobs.

A Tauri-compatible manifest needs per-platform versions, HTTPS download URLs and cryptographic signatures. Never publish private updater signing keys. A bad or missing signature must block installation.

## Security gates

- All dependencies scanned and locked before release.
- Tests and linting pass on each target architecture.
- Strict permissions, no broad shell access by default.
- No separate EULA acceptance screen in the desktop app or installer. The EULA, commercial terms, privacy policy and required third-party notices remain bundled and available in Settings > About. Removal of click-through acceptance requires legal review before commercial distribution.
- Installer and update paths checked for rollback and tamper resistance.
- Windows signing certificate and macOS signing/notarization are needed for trusted production distribution.
- Product and screenshot claims must be verified against the built binary.

No published build should be called production-ready until these checks pass.
