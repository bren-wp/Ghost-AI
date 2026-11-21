# Deploy Ghost AI static website

Upload the contents of this directory to `https://brendigo.com/ghost-ai/` via HTTPS. No MySQL, PHP backend, cron, user accounts or database are required for the release pages and static update manifests.

1. Mirror verified release packages to `downloads/` and versioned signed updater artifacts to `updates/`.
2. Replace example manifest with the generated `updates/latest.json` file only after signature verification.
3. Keep `downloads/files.json` empty until packages are verified. After placing real files in `downloads/`, run `python3 scripts/ghost_download_manifest.py --downloads website/ghost-ai/downloads` from the repository root. The page exposes only manifest-listed packages and their SHA-256 hashes; unsupported files remain hidden.
4. Publish current `legal/` documents as static HTML; keep mandatory OSS notices alongside downloads.
5. Serve JSON as `application/json` with HTTPS, strong caching for immutable versioned artifacts and short TTL for `latest.json`.
6. Set strict Content-Security-Policy and `X-Content-Type-Options: nosniff` headers; do not allow updates over insecure HTTP.
7. Publish checksums for downloaded binaries and verify upload integrity.

Public update keys are embedded in released clients. Private keys **must not** be uploaded to web space or committed to Git.

**Nothing here deploys files to brendigo.com automatically.** Site deployment requires hosting credentials and tested binaries.

**Update.exe** is a separate launcher that checks for an existing installation of Ghost AI, rather than a second name for the setup program. The setup program remains the source of files and license prompts. The portable launcher extracts its packaged application without writing installers, shortcuts or registry keys; it may still use the operating system's application-data directory for settings.
