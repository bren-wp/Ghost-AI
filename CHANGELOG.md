# Ghost AI by Brendigo — release history

## v0.1.4 — Provider workspace and connection reliability

- Redesigned provider settings with searchable cloud/local/custom navigation, responsive model cards and consistent Ghost AI dialogs.
- Aligned 43 built-in provider routes and discovery capabilities, including ZenMux, Z.ai and Tencent TokenHub.
- Expanded OpenAI discovery to reasoning and fine-tuned conversation models.
- Normalized Ollama native and OpenAI-compatible URLs across discovery and conversation.
- Added optional credentials for protected LM Studio, GPUStack and OVMS servers and model-specific connection testing.
- Normalized API keys on save as well as discovery and connection checks; reject duplicate or empty active model IDs before mutation.
- Fixed hidden model filters when a configured list shrinks and reset filters when changing providers.
- Preserved safe provider errors, regression coverage, compatible dependency updates and independent security scans. Routine Dependabot version PRs are disabled.
- Release packages are published only after matching source, platform builds and mandatory quality gates pass. Cloud account-specific live model availability is not guaranteed.

## v0.1.3 — CI hardening and dependency consolidation

- Consolidates pending dependency upgrades, reverting incompatible rand/rig API bumps until full migration is available.
- Hardens MCP OAuth server discovery against issuer mismatches and remote HTTP, and bounds untrusted WebView HTML delivery size/queue.
- Adds full static frontend/Rust dead-code candidate reports and first-party security review coverage.
- Distributes Windows Setup/Portable/Update, Linux DEB/AppImage and macOS DMG/portable app ZIP after passing required cross-platform tests.
- Consolidates pending dependency upgrades into one auditable change set; compatibility must be confirmed by the final CI runs.
- Restores frozen pnpm/Cargo lockfile consistency and retains audited package overrides.
- Runs quality checks on merged `main`, executes all Windows Rust library tests and requires complete viewport screenshot evidence.
- Strengthens release blocking tests for JavaScript and Rust dependency security findings.
- Requires actual build, startup, installer, update and packaging evidence before release. The published v0.1.3 remains a preview; see its release assets and verification results.

## v0.1.2 — Windows launch and recovery

- Prevents the updater component from initializing before the required trusted updater key is available, addressing the confirmed Windows launch regression in v0.1.1.
- Keeps automatic software updates disabled unless the signed update channel is correctly provisioned.
- Captures an early startup failure report locally to help diagnose initialization and data-storage errors.
- Displays helpful failure messages in the portable launcher and installed-app updater instead of terminating silently.
- Requires Windows release builds to pass actual startup, installation and updater checks before publication.
- Adds repeatable diagnostics and preserves the user’s existing application data during troubleshooting.

Windows, Linux and macOS packages should be regarded as verified **only after** their matching build and startup checks pass. New releases do not remove the need for operating-system signing and notarization where applicable.

## v0.1.1 — initial unified distribution

- Introduced the Ghost AI by Brendigo visual identity, first-run license terms, responsive interface, packaged application builds and optional signed update infrastructure.
- A Windows startup regression was discovered after publication. Do not treat this release as a known-good Windows build.
