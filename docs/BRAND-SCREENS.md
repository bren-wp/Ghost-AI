# Ghost AI visual implementation

## Identity

**Ghost AI** is the only product identity in dialogs, application chrome, launcher, notifications, onboarding, settings, legal panel and installers. **Brendigo** is the credited product publisher and official support site is **https://brendigo.com**.

## Design tokens

| Token | Color |
|---|---|
| Background | `#080F1A` |
| Sidebar | `#0B1425` |
| Surface | `#111827` |
| Primary | `#00E5FF` |
| Accent | `#874CFF` |
| Foreground | `#E5E7EB` |
| Muted foreground | `#A8B3C8` |
| Border | `#324057` |

## Component spec

- Startup: centered Ghost AI symbol and label with reduced-motion support.
- Main window: 1220 × 790 initial dimensions; not maximized; minimum 800 × 560.
- Sidebar: responsive conversation and tools navigation; no clipped controls at 800 × 560.
- Settings: scrollable main area and mobile-width section selector; keyboard operable.
- AI providers: clear service names where needed to select compatible models; not confused with product publisher.
- Files and analysis: explicit permission prompts before accessing local documents.
- Update center: never claim signed updates work until public-key provisioning.
- About: Ghost AI, version, Brendigo, official website, legal and update details.
- Dialogs: consistent dark surface, spacing, contrast and visible keyboard focus.

## Acceptance matrix

Test all screens and states at 800 × 560, 1024 × 768, 1366 × 768, 1920 × 1080 and 2560 × 1440, including 125%, 150% and 200% scaling; verify keyboard focus, assistive technologies and high-contrast modes.

**Pixel-perfect comparison remains pending.** The design concept is not evidence of a matching compiled application. Provide screen captures from real builds and compare before calling UI work complete.
