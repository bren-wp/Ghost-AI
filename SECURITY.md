# Ghost AI — Security & responsible disclosure

**Product:** Ghost AI by Brendigo  
**Official website:** https://brendigo.com

Please report vulnerabilities privately through the contact channel provided on Brendigo's official website. Do not publish API keys, user data, exploit details or private configuration in public reports.

## Supported releases

Security fixes target the newest supported release. Manual downloads can be obtained through the official website when published; automated upgrades require a configured signed channel. No unsupported release should claim to update securely.

## Security scope

- Agent permissions, shell execution and filesystem access.
- API credentials, local data and secrets in logs.
- Cloud provider integrations and document transfers.
- Digitally signed update packages and release provenance.
- Open-source dependencies and third-party components.

## Release acceptance

Automated checks, dependency review, clean-install testing, upgrades from the last published version and platform-specific security verification must pass before an edition is called production-ready.

## Known upstream GTK3 dependency advisory (23 November 2026)

**RUSTSEC-2024-0429 / GHSA-wrw7-89jp-8q8g — `glib 0.18.5` (Linux only).**
The Tauri 2.x GTK3/WebKitGTK backend requires the `gtk-rs 0.18` generation,
which includes an unsound implementation of `glib::VariantStrIter`. RustSec
lists `glib >=0.20` as patched, but that version is incompatible with the
current GTK3 dependency graph. A forced major-version upgrade is not safe.

The desktop RustSec audit permits **only this specifically identified,
upstream-constrained advisory** as a temporary, reviewed risk exception.
`scripts/ghost-ai-rustsec-gtk3-exception.py` fails closed if the locked GLib
or GTK dependency generation, Tauri version or first-party Rust API usage
changes. The CI also uploads **unfiltered advisory JSON** so the exception
remains visible, while **all other RustSec advisories remain release-blocking**.
The shared AI agent lockfile is audited without this exception.

The app does not directly call `VariantStrIter`; this is **not** proof that
a transitive Linux library cannot reach the affected function. The exception
does not fix GLib's undefined behavior or eliminate residual Linux risk.
Re-evaluate before publishing a Linux release and remove the exception once
Tauri ships a compatible GTK4/GLib >=0.20 stack or a validated GTK3 backport
becomes available.

## Source licenses

Mandatory open-source copyright notices and license obligations must remain intact. These notices do not imply third-party endorsement of the Ghost AI product.

**Publisher:** Brendigo · https://brendigo.com
