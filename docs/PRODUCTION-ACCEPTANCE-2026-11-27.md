# Ghost AI — production acceptance register

Scope: Master Development Prompt 3.0, single PR #69, candidate v0.1.5. This register is not certification. A code change is not a verified native result.

| Phase | Current evidence and change | Remaining acceptance |
|---|---|---|
| 1 — Release Recovery | Release branch trigger, exact-SHA gates, version checks, staged SHA-256 asset verification and stable promotion implemented in PR #69. | New CI, merged main, release branch, all eight binaries, public release verification, partial upload E2E and hosting manifest. |
| 2 — Security | Previous keychain cache coherence and release-profile native Windows smoke; this iteration zeroizes ephemeral fallback cache entries on removal/replacement. | Native Linux/macOS credentials, TTL/bounds, caller-owned secret copies, network/redirect/DNS policy, IPC and MCP audit; retain justified GLib exception until fixed. |
| 3 — UI/UX | Six reference route capture gate exists; production window dimensions and acceptance matrix now documented consistently. | Actual matched-state pixel comparison, 35 dialog candidates, nine viewports, five DPI values, real platform and accessibility acceptance. No reference images changed. |
| 4 — Providers | Existing provider catalog and prior alignment tests; no new provider changes in this iteration. | Capability-by-capability tests and authorized real-provider E2E; no paid API requests made. |
| 5 — Agents & MCP | Existing vendored agent core and MCP permission paths reviewed in prior audit register. | Permission isolation, injection resistance, tool approvals, recovery/budget tests and actual platform sandbox evidence. |
| 6 — Documents | Existing composer and document workflow; backend bounds file and image decoding independently of frontend. | Actual MIME/container checks, archive limits, explicit send permissions, persistent workspace/index and format-specific tests. |
| 7 — Storage | Literal SQLite filename connection and path regression added; prior sync/local database split retained. | Backup, restore, migrations from v0.1.4, interrupted upgrades, corruption and concurrent recovery tests. |
| 8 — Localization | Existing 36 selectable locales and automated missing-key/placeholder inventory. | Full namespace translations, linguistic review, RTL and native UI checks. Fallback is not complete translation. |
| 9 — Audits & performance | Existing independent static, dead-code, semantic clone and dependency inventories. | Resolve candidates with evidence, license/security review and measured before/after performance. |
| 10 — Native acceptance | Existing Windows launch, first-paint and screenshot gates; Linux/macOS builds and unit tests. | Clean-device GUI, installer/portable/update/uninstall, data preservation, DPI and platform-specific verification. |

The full release and runtime status is pending CI. See the existing security and visual audit registers for individual findings. Do not claim pixel equality, complete localization, production hosting or stable publication without evidence.
