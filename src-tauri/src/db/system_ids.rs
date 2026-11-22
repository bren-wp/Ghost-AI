// Ghost AI by Brendigo
//! Deterministic system-row ids (UUID v5).
//!
//! System-seeded rows (self user, parameter presets, system prompts,
//! built-in providers and their models) must carry the SAME id on every
//! device: seeds are singletons by type/name, the merge is row-wise by pk,
//! and the UI resolves built-in providers by `provider_type`. Random ids
//! split identities across devices (real-device findings: FK failures on
//! fresh joins, duplicated providers breaking the model picker).
//!
//! iOS never seeds these rows (it receives them via sync), so this module
//! is desktop-only by design.

use uuid::Uuid;

/// Single namespace for every system id label.
const NAMESPACE: uuid::Uuid = uuid::Uuid::from_u128(0x6f9619ff_8b86_d011_b42d_00c04fc964ff);

/// Derive a deterministic system id from its label, e.g.
/// `system_uuid("ghost_ai.preset.balanced")`.
pub fn system_uuid(label: &str) -> String {
    Uuid::new_v5(&NAMESPACE, label.as_bytes()).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derivation_is_stable_across_versions_and_devices() {
        // Golden UUIDv5 vectors independently verified using RFC 4122's
        // SHA-1 name-based UUID construction (namespace bytes + UTF-8 label).
        // Earlier test constants did not match the namespace/algorithm that
        // shipped in the app. Do not change system_uuid or its namespace to
        // satisfy an incorrect fixture: it would split synced database rows.
        assert_eq!(
            system_uuid("ghost_ai.test.anchor"),
            "95a10eb3-7873-5611-a49d-b371e61e9d5c"
        );
        // Built-in Balanced preset ID under the same stable namespace.
        assert_eq!(
            system_uuid("ghost_ai.preset.balanced"),
            "85ddba5a-3e98-59b1-a496-820c0e82698d"
        );
    }

    #[test]
    fn ids_are_uuid_v5() {
        let id = system_uuid("ghost_ai.anything");
        assert_eq!(id.as_bytes()[14], b'5');
    }
}
