# Ghost AI visual acceptance register — 2026-11-24

Baseline: `360424889d74686a68fd7880b27801824eb02e09` (audit branch based on main `39c11d28cd87555cfe4d082e6a89324d2a38b406`). All six checked-in concept SVG files are source references, not application captures. Do not replace or alter references to make a comparison pass.

Evidence: [Windows eight-shot artifact](https://github.com/bren-wp/Ghost-AI/actions/runs/45286815596/artifacts/14871654495). Reviewed actual 820x580, 940x640, 1160x760 and 1440x900 images of no-model startup and settings/provider configuration. This is not all-screen acceptance. Matched-state comparison and clean target-platform display access remain required.

## Reference inventory and acceptance
| Reference | Concept text and visual anchors | Actual evidence | Result |
| --- | --- | --- | --- |
| [ghost-ai-agents-concept.svg](../brand/screens/ghost-ai-agents-concept.svg) | Agents; Ghost AI; Agents &amp;amp; workflows; Choose the right assistant and approve actions before they run.; Research agent; Explore sources and summarize findings; Coding agent; Analyze code and suggest improvements; Document agent; Extract insights from documents; Custom agent; Define a focused role and tool access | No matched screenshot | NIJE TESTIRANO (pixel comparison) |
| [ghost-ai-conversations-concept.svg](../brand/screens/ghost-ai-conversations-concept.svg) | Conversations; Ghost AI; Conversation; Ghost AI; How can I help you with your project today?; Project notes; Here is a structured plan with clear next steps.; Ask Ghost AI…; Send | No matched screenshot | NIJE TESTIRANO (pixel comparison) |
| [ghost-ai-documents-concept.svg](../brand/screens/ghost-ai-documents-concept.svg) | Documents; Ghost AI; Document workspace; Review files without losing context.; Your files; Drag files here or choose from your computer; Document summary; Key points and facts; Follow-up questions; Explore what matters next | No matched screenshot | NIJE TESTIRANO (pixel comparison) |
| [ghost-ai-home-concept.svg](../brand/screens/ghost-ai-home-concept.svg) | Home; Ghost AI; Your workspace. Your ideas.; Choose a starting point to get more done with your preferred AI.; Start a conversation; Ideas, writing, research and answers; Analyze a document; Understand files and organize insights; Run an agent; Specialized tasks with clear permissions; Your AI providers; Connect compatible cloud or local models | No-model empty chat; not equivalent to dashboard concept | NIJE TESTIRANO (pixel comparison) |
| [ghost-ai-providers-concept.svg](../brand/screens/ghost-ai-providers-concept.svg) | Providers; Ghost AI; Connect your AI; Manage supported cloud providers and local runtimes.; Cloud providers; Credentials stored with care; Local models; Run compatible models on your computer; Connection settings; Endpoints, models and permission controls | Embedded provider settings only; not a matched provider workspace screenshot | NIJE TESTIRANO (pixel comparison) |
| [ghost-ai-settings-concept.svg](../brand/screens/ghost-ai-settings-concept.svg) | Settings; Ghost AI; Settings; A focused place for your choices.; Appearance; Dark theme and display scale; Security; Permissions and local data; Updates; Signed packages from brendigo.com; About Ghost AI; Brendigo · official information | Settings dialog, provider tab only; full settings concept not matched | NIJE TESTIRANO (pixel comparison) |

## Confirmed discrepancies and regression requirements
| ID | Severity | Evidence | Root cause / consequence | Correction | Regression | Status |
| --- | --- | --- | --- | --- | --- | --- |
| UI-003A | P2 | 820x580 settings screenshot: bottom About item clipped; settings-dialog.tsx:1520-1566; ui/sidebar.tsx:119-153,352-364 | Sidebar percentage height has no definite-height containing wrapper; items-start prevents stretching. Overflow hidden on dialog can clip navigation. | Definite bounded flex height on wrapper, h-full/min-h-0 on nav/content, no global sidebar behavior change | Source contract test plus actual 820x580 keyboard/scroll screenshot and reachability | Confirmed visible clipping; runtime correction verification pending |
| UI-003B | P2 | 820x580 settings provider capture; llm-provider-settings.tsx:112-210 | Tall fixed header/padding above connection form reduce usable area at short heights | Preserve functionality, use short-height spacing and bounded scroll, keep save action available | Real provider form access, save and model management on minimum viewport | Candidate; do not claim fixed by layout inspection |
| UI-006 | P1 | home/settings concepts vs real captures | Concepts show expanded branded navigation and dashboard/card hierarchy; live capture is icon rail and modal. Different states require explicit mapping; no pixel-equality claim | Map actual accessible functional states to approved reference surfaces and compare; never add fake buttons or placeholders | Same-state captures and approved reference comparison per platform | Blocked |
| UI-007 | P2 | brand/SCREEN_DESIGN.md:29-36, docs/BRAND-SCREENS.md:32-36 | CI captures only two surfaces; missing DPI, keyboard, localization, accessibility, Linux/macOS | Expand scenario inventory and evidence | All mandatory real-state scenarios pass | Blocked |

## Dialog and overlay source inventory
These are 35 filename-based candidates for review, not proof that every file is a standalone window. Each must be mapped to actual state, reference, route/trigger and test. Includes shared primitives and barrel exports deliberately; no deletion or fake reference coverage.

- [ ] `src/components/assistant-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/assistant-list-item/delete-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/ContextCountDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/McpServersDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/ModelParametersDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/PromptSelectDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/SkillsDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/SystemPromptDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/UserPromptQuickSelectDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-input/WebPageDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-view/AskUserDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-view/McpElicitationDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/chat-view/PermissionApprovalDialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/mcp-server-config-modal.tsx` — NIJE TESTIRANO
- [ ] `src/components/message-list-item/delete-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/message-list-item/rename-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/model-list-item/delete-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/onboarding-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/preset-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/prompt-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/prompt-list-item/delete-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/provider-settings-dialog/add-model-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/provider-settings-dialog/edit-model-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/provider-settings-dialog/fetch-models-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/provider-settings-dialog/provider-settings-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/search/search-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/settings-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/sidebar/translation-history-popover.tsx` — NIJE TESTIRANO
- [ ] `src/components/skill-edit-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/sync/sync-onboarding-card.tsx` — NIJE TESTIRANO
- [ ] `src/components/sync/sync-onboarding-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/ui/alert-dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/ui/dialog.tsx` — NIJE TESTIRANO
- [ ] `src/components/ui/popover.tsx` — NIJE TESTIRANO
- [ ] `src/components/ui/sheet.tsx` — NIJE TESTIRANO

## Remaining required visual cases
Startup/loading/error, empty and configured home, conversation/message states (streaming, tool calls, failures, attachments), agents/permissions (denied/approved), documents (empty/import/results/errors), provider configuration (cloud/local/custom, missing credentials, model selection, save errors), all fourteen settings sections and nested dialogs, onboarding, language selector, notifications, menus, charts, update and legal panels, install/maintenance and portable launchers. Preserve real native window controls and platform conventions; compare app content at matching state and scale rather than stretching a concept image over the app.

Required viewport matrix: 800x560, 1024x768, 1366x768, 1920x1080, 2560x1440 per design document; current production min is 820x580 and must be reconciled before testing 800x560. Existing 940x640, 1160x760 and 1440x900 cases remain mandatory. Actual DPI 100/125/150/200%, keyboard access, focus visibility, screen readers and EN/HR/DE layout required. Only mark PROŠLO after inspecting actual evidence from matching commit and state. Do not weaken existing CI.

## Iteration 2 — proposed Home and production keyring correction
Home is now a functional surface using the four reference action cards, real navigation, logo, wordmark and responsive card grid. Conversation and document cards open the existing draft workflow; the document card prefills only a new draft and never sends. Agents selects the existing assistant tab; provider/settings buttons open real configuration. Existing conversations, contacts, library, translations and artifacts remain available. HR/DE text for this surface is added; this does not complete whole-app localization. The reference remains unchanged. **Pixel comparison and interactive acceptance: NIJE TESTIRANO.** SEC-009: production compilation excludes mock backend installation and inherited test environment switch, while unit/debug tests retain their mock. Static regression added; real OS keychain and release behavior remain unverified. No stable release or merge authorized.

## Iteration 3 — functional reference workspace surfaces
Agents, Documents, Providers and Settings now have separate branded entry surfaces using the existing assistant store, assistant editor/profile, document conversation workflow, provider editor and settings dialog. No generated assistants, fictional document results, or simulated provider connections are displayed. Documents is a workflow entry, not a standalone file manager; attachment selection and analysis still happen in the real composer. The updates card opens the real About/update controls rather than claiming signing is active. Other existing navigation is retained. Permission, MCP elicitation and ask-user dialogs move to the application shell so they stay available when the chat view is not mounted; existing dialog behavior remains unchanged. New tests cover callback routing and source wiring. Pixel comparison, actual cross-platform interaction, complete translations and full security audit remain NIJE TESTIRANO. Original reference SVGs unchanged.

Previous CI 45483575368 (db361fb) reported 1 failed / 1749 passed: Home button query was ambiguous because the document description also said 'Start a conversation'. Card accessible title/description are now separated; exact name and description assertions preserve the regression check. Latest execution pending.

## Iteration 4 — document session and privacy
Documents now enters a real conversation within the Documents route, reusing the existing native picker, attachments, preview, model selection, send/stop and actual streamed transcript. An explicit summary action prefills only empty input; no auto-send. No separate duplicate document store. The current session is tracked by conversation ID during this app session; a persistent document library/index is not implemented. Generic dialog close label now uses localization. Removed message text, raw provider URL and selected absolute paths from the reviewed frontend info logs; other log sites and backend commands remain subject to audit. Runtime and pixel acceptance pending.

## Iteration 7 — real six-surface capture
Added stable accessibility IDs to existing navigation, optional real Windows UI Automation navigation in the native capture script, and an additional six-surface 1160×760 CI evidence gate after existing Rust tests. Every route needs its actual visible content text and a nonblank real app image; missing UI Automation support or unexpected app state fails explicitly and retains available evidence. No fallback synthetic screenshot, no change to previous eight screenshot gates. This checks route/paint, not pixel equality. The new Windows capture path itself remains untested; reference comparison, other viewports, configured states, dialogs, Linux/macOS and multilingual layout acceptance remain open.

## Iteration 8 — screenshot evidence and RTL foundation
Windows CI 45491890701 artifact 14966333384 contains eight actual Home/Settings screenshots. Manual contact-sheet inspection confirms branded Home is visible at 820×580, 940×640, 1160×760 and 1440×900; navigation and provider form need scrolling at smaller sizes, and native frame edges include desktop pixels on some captures. No pixel-equivalence pass. The new RTL root and common controls preserve LTR credentials/code; Arabic acceptance still pending. All 35 dialog surfaces remain open.
