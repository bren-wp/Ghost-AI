# Ghost AI by Brendigo — interface reference

**Publisher:** Brendigo · https://brendigo.com

These six editable SVGs are **design concepts**, not captured application screenshots. They establish layout, palette and component hierarchy for implementation and screenshot comparison.

| Surface | Reference |
| --- | --- |
| New workspace | [Home](screens/ghost-ai-home-concept.svg) |
| Conversation | [Conversations](screens/ghost-ai-conversations-concept.svg) |
| Tool permissions and agents | [Agents](screens/ghost-ai-agents-concept.svg) |
| Document analysis | [Documents](screens/ghost-ai-documents-concept.svg) |
| Cloud and local AI configuration | [Providers](screens/ghost-ai-providers-concept.svg) |
| App preferences and signed updates | [Settings](screens/ghost-ai-settings-concept.svg) |

## Visual foundation

- Background `#080F1A`, surfaces `#111827` and `#172338`.
- Accent cyan `#00E5FF`, highlight violet `#874CFF`.
- Text `#E5E7EB`; secondary `#A8B3C8`; border `#30415D`.
- Windows and panels use 12–20 px radii and 4–8 px spacing units.
- A 1440×900 concept canvas is for visual comparison only, not a fixed-size window.
- Application startup must be centered, resizable and **not** maximized.
- On smaller windows, navigation must collapse into one compact accessible selector; never clip the primary action, dialogs, or OS controls.
- Update, permission and destructive operations must present clear loading, failure and success states.

## Acceptance criteria

1. Capture **real screenshots** for Windows 100%, 125%, 150%, 175% and 200% scale, plus supported Linux and macOS.
2. Compare every state against approved references: default, empty, loading, errors, focus, dialogs, narrow windows and localization.
3. Verify keyboard-only navigation, screen readers, focus outlines, contrast and text scaling.
4. Validate chat, files, providers, agents, settings, account-free first run, EULA, installers, updates, and restart behavior.
5. No copied mockups should be described as real screenshots in public marketing or the README.
6. Preserve mandatory upstream license notices while keeping product-facing branding exclusively Ghost AI by Brendigo.

A screen may be marked pixel-matched only after measured comparison with an approved reference on the target display scale.
