# Ghost AI by Brendigo — release history

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
