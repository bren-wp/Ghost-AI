# Ghost AI — Website distribution without a database

**Official host:** https://brendigo.com  
**Application:** Ghost AI · **Publisher:** Brendigo

## Site layout

- `/ghost-ai/index.html`: static product and download landing page
- `/ghost-ai/download/`: signed release packages and platform installers
- `/ghost-ai/updates/latest.json`: static signed update manifest
- `/ghost-ai/legal/`: EULA, privacy and commercial licensing terms

This distribution does **not** require SQL, PHP, cron, authentication or a background process. A plain HTTPS web server or CDN can host the files.

## Signed updater

The Tauri 2 updater verifies each update package with the public key embedded in the compiled application. Never replace the signing key silently between releases. Configure the following repository secrets before creating a signed update build:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (only if the key is protected)
- `GHOST_AI_UPDATER_PUBLIC_KEY` (not sensitive, but must match the private key)

Generate and store the **private** key on a trusted Brendigo-controlled system; never commit it. Do not generate an updater feed without a valid signature. A release without signing keys may still supply manual installers, but in-app updates cannot be enabled safely.

Configure the app's signed-update endpoint as `https://brendigo.com/ghost-ai/updates/latest.json`. The website must host the exact signed artifacts referenced by that file over HTTPS. Do not use GitHub download endpoints in application-facing URLs.

Upload the generated `site/ghost-ai/` artifact from CI to `brendigo.com`, preserving its directories. Publish the static manifest **last** after every platform artifact it references is fully uploaded and verified. Use atomic replacement of `latest.json` to prevent clients from seeing incomplete releases. Set `Cache-Control: no-store` or a short cache lifetime on `latest.json`, and allow longer immutable caching for versioned binaries.

## Windows packages

- `Ghost-AI-vX.Y.Z-Setup.exe`: interactive installer with license and Brendigo graphics.
- `Ghost-AI-vX.Y.Z-Update.exe`: installer upgrade package for existing installs, generated from the same verified NSIS installer; not an independent download client.
- `Ghost-AI-vX.Y.Z-Portable.exe`: self-extracting launcher. It runs without installation and unpacks its bundled files to a temporary directory, and keeps user data under the normal application profile. Full USB self-contained data portability needs separate implementation and testing.
- `Ghost-AI-vX.Y.Z-Portable.zip`: unpacked distribution for users who prefer a folder.

Unsigned Windows executables can trigger SmartScreen. Public code signing requires a separate certificate.

## Linux and macOS

Linux AppImage and Debian package builds and macOS DMG builds are platform-dependent. macOS signing/notarization needs Apple credentials, and Linux packages must be tested across supported distributions. Only publish successfully built, validated artifacts.

## Operational checks

1. Verify EULA and privacy pages are available without login.
2. Verify version and downloads match the signed manifest.
3. Verify downloaded package signature and SHA-256 checksums.
4. Test in-place update and rollback protection on clean machines.
5. Test a new-user install and uninstall; preserve user data unless the user chooses otherwise.
6. Test local model setup and cloud model permissions.

**No domain deployment is performed solely by committing these templates.**