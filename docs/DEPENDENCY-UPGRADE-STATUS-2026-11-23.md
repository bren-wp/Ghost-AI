# Ghost AI — dependency update verification (23 November 2026)

## Verified and committed in PR #40

The temporary dependency-refresh CI job passed at commit `d401426ae0f8`
and pushed the regenerated manifests/lockfiles as `f2b64360811d`.
The candidate passed `pnpm build`, **1,679 of 1,679** Vitest tests across
**153 test files**, and `pnpm audit --audit-level low` with **no known
vulnerabilities**. The job also resolved both desktop and shared-agent
Cargo lockfiles and passed `cargo metadata --locked`. These checks alone
do not prove that Windows, Linux and macOS installers and startup all pass.

Updated JavaScript tooling:
- Vite 8.3.8, Vitest 5.1.1, @vitest/coverage-v8 5.1.1,
  @vitejs/plugin-react 6.3.0
- jsdom 31.0.1, @testing-library/jest-dom 8.0.0
- @typescript-eslint/parser and eslint-plugin 8.73.0
- lucide-react 1.78.0
- Additional dependencies compatible with existing semver requirements,
  updated reproducibly by `pnpm up`, are tracked in the lockfile.

Both Cargo workspace locks were updated to the newest versions permitted
by the current Rust manifests. Confirmed refreshed crates include
`anyhow 1.0.105`, `globset 0.4.22`, `grep-matcher 0.1.10`,
`grep-regex 0.1.15`, `grep-searcher 0.1.18` and `ignore 0.4.35`.

## Latest-major upgrades still requiring migration, not falsely marked done

- **TypeScript 7**: the current `@typescript-eslint` release declares
  TypeScript support below 6.1; TS 7 must not be adopted until a supported
  parser/toolchain combination is established and tested.
- **ESLint 10**: the repository uses legacy ESLint 8 configuration and
  command flags; a migration to the current flat config and compatible rules
  is needed, including verification across CI and editor tooling.
- **Mermaid 12**, **react-i18next 18**, **Zustand 5**: require application
  API/behavior review before changing production dependencies.
- **Rust HKDF 0.13 and SHA-2 0.11**: previous independent Dependabot
  upgrades caused digest trait mismatches; migrate together with
  cryptographic known-answer and backward-compatibility tests.
- **Rust PNG 0.18**: changes the `FilterType` API used by the encoder;
  migrate the encoder with lossless screenshot/image tests.
- **Rust rig 0.46 and rand 0.10**: previous upgrades broke provider adapter
  and RNG APIs; require source migration and end-to-end model tests.

These are known blockers, not security exemptions or reasons to disable
audit gates. Do not loosen `--frozen-lockfile`, skip Windows screenshots,
or publish a release that fails any required OS or security job.

## Release policy

Only PR #40 is used for development. The published v0.1.3 release was
created before every Quality Gate passed. The next verified release must
use a new version (v0.1.4 or later), pass the complete Quality Gates on
the exact same commit, and include verified Windows Setup/Portable/Update,
Linux DEB/AppImage, and macOS DMG/portable app ZIP packages.
