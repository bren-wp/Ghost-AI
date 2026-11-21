# Deploy Ghost AI static website

Upload the contents of this directory to `https://brendigo.com/ghost-ai/` via HTTPS. No MySQL, PHP backend, cron, user accounts or database are required for the release pages and static update manifests.

1. Mirror verified release packages to `downloads/` and versioned signed updater artifacts to `updates/`.
2. Replace example manifest with the generated `updates/latest.json` file only after signature verification.
3. Update download links to packages that actually exist; remove placeholders for unsupported systems.
4. Publish current `legal/` documents as static HTML; keep mandatory OSS notices alongside downloads.
5. Serve JSON as `application/json` with HTTPS, strong caching for immutable versioned artifacts and short TTL for `latest.json`.
6. Set strict Content-Security-Policy and `X-Content-Type-Options: nosniff` headers; do not allow updates over insecure HTTP.
7. Publish checksums for downloaded binaries and verify upload integrity.

Public update keys are embedded in released clients. Private keys **must not** be uploaded to web space or committed to Git.

**Nothing here deploys files to brendigo.com automatically.** Site deployment requires hosting credentials and tested binaries.
