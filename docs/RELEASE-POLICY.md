# Ghost AI release and distribution policy

The first release line starts at **v0.1.0**. Subsequent builds use semantic versions. Completed, functionally verified releases are published as **Stable** (`prerelease: false`, `draft: false`). Missing platform signatures or notarization alone do not prevent stable manual distribution. Disclose unsigned packages and potential OS warnings. A successful build is not evidence that the application launches correctly.

## Expected deliverables

| Platform | Installer | Portable | Update |
|---|---|---|---|
| Windows x64 | Ghost-AI-vX.Y.Z-Setup.exe | Ghost-AI-vX.Y.Z-Portable.exe and ZIP with required resources | Signed Tauri updater when provisioned; standalone Update.exe is a tested manual maintenance package, not an authenticated automatic updater |
| Linux x86_64 | .deb installer | .AppImage standalone portable package | Signed AppImage update when configured |
| macOS | .dmg installer | .app wrapped in a verified .zip portable archive | Signed/notarized app updates when provisioned |

A portable Windows executable can require companion resources, model catalogs or the system WebView runtime. A one-file EXE is *not* a promise of full portability unless confirmed on clean Windows test machines.

## Mandatory release on each completed iteration

Continue changes in the currently open PR until merged. Each **completed and verified** development iteration increments the application version and triggers a versioned `release/vX.Y.Z` pipeline with all supported platform packages. If any mandatory build, security, startup or packaging check fails, **keep the candidate unannounced and fix it; do not publish incomplete assets or bypass checks**. A release candidate is not a published release. 

## CI checks and current limits

- Every pull request compiles and opens a production Windows executable staged with its packaged resources. The smoke check fails if the process exits, no main window becomes visible, or the window disappears immediately.

- Windows starts its Tauri window hidden and reveals the branded dark content after React replaces the static splash. A native watchdog restores visibility after a timeout if the frontend fails; neither mechanism alone proves the absence of flashes on a real graphics stack.
- CI attempts real main-window and Settings screenshots at 820×580, 940×640, 1160×760 and 1440×900. The screenshot artifact includes `coverage-report.txt`, which distinguishes captured images from virtual desktop sizes and dialog interactions that were **not verified**. A reviewer must examine image content; changed pixels are not definitive proof of a correct Settings dialog.
- Pixel-perfect claims additionally require comparison with the reference images and interactive checks across all Settings sections, model-selection dialogs, accessibility/scaling modes, and actual hardware. Unit tests and screenshot files alone are insufficient.

- Windows release jobs check installed, portable and update packages, and save diagnostics even when a check fails.
- Linux and macOS release jobs currently build their packages, but do **not** yet prove a visible application window or operation on a clean user device. Their build failures must block publication rather than silently omit an artifact.
- A release requires all expected platform files and a regenerated SHA-256 list covering the actual uploaded packages.
- GitHub CI does not by itself establish antivirus cleanliness, Authenticode signing, macOS notarization, functional AI provider coverage, or accessibility compliance. Disclose these limits independently; absence of platform signing or notarization does not by itself block verified stable manual packages.

## Static site without database

Publish release binaries to a static HTTPS directory on **brendigo.com**. The latest manifest is a plain JSON file, for example `https://brendigo.com/ghost-ai/updates/latest.json`. Files can be served by an ordinary static PHP/Apache/Nginx host without SQL or background jobs.

A Tauri-compatible manifest needs per-platform versions, HTTPS download URLs and cryptographic signatures. Never publish private updater signing keys. A bad or missing signature must block installation.

## Security gates

- All dependencies scanned and locked before release.
- Tests and linting pass on each target architecture.
- Strict permissions, no broad shell access by default.
- No separate EULA acceptance screen in the desktop app or installer. The EULA, commercial terms, privacy policy and required third-party notices remain bundled and available in Settings > About. Removal of click-through acceptance requires legal review before commercial distribution.
- Installer and update paths checked for rollback and tamper resistance.
- Windows signing and macOS signing/notarization are recommended for OS publisher trust. Automatic updating remains disabled without trusted signing keys; never bypass signature, integrity, manifest or downgrade checks.
- Product and screenshot claims must be verified against the built binary.

Release publication starts from `release/vX.Y.Z`; a tag push does not start a second release build. Manual dispatch must target that release branch. The release requires successful same-SHA Quality Gates, matching versions, all platform assets and checksums. Existing published versions and conflicting tags must not be overwritten. No published build should be called production-ready until mandatory functional and security checks pass.

Publication uses a non-public, commit-owned staging draft; the final public release is Stable, never a draft. Uploaded asset sizes and SHA-256 digests must match the generated inventory before promotion. Rerunning the publication job can resume an owned draft with identical assets; unexpected or mismatched assets require explicit review and are never silently overwritten. A previously published identical release is an idempotent no-op. Missing digest metadata fails closed.
