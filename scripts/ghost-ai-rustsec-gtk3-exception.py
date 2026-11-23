#!/usr/bin/env python3
"""Fail closed on the sole documented upstream GTK3 RustSec exception.

The advisory applies to glib::VariantStrIter in the Linux-only GTK3 backend.
Tauri 2.x depends on gtk 0.18, which pins the affected glib 0.18 generation.
This is a reviewed *risk exception*, not a claim the upstream bug is patched.
All other RustSec advisories must continue to fail CI and release validation.
"""
from __future__ import annotations

import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCKFILE = ROOT / "src-tauri" / "Cargo.lock"
MANIFEST = ROOT / "src-tauri" / "Cargo.toml"
UNSAFE_API_SYMBOLS = ("VariantStrIter", "array_iter_str")


def fail(message: str) -> None:
    raise SystemExit(f"GTK3 RustSec exception no longer validated: {message}")


def main() -> None:
    with LOCKFILE.open("rb") as fh:
        lock = tomllib.load(fh)
    with MANIFEST.open("rb") as fh:
        manifest = tomllib.load(fh)

    packages = lock.get("package", [])
    glib = [p for p in packages if p["name"] == "glib"]
    if len(glib) != 1 or glib[0]["version"] != "0.18.5":
        fail("glib graph changed; remove/reassess RUSTSEC-2024-0429 exception")

    # Both GTK3 and WebKitGTK must depend on the same legacy glib generation.
    for name, version in (("gtk", "0.18.2"), ("webkit2gtk", "2.0.2")):
        matches = [p for p in packages if p["name"] == name and p["version"] == version]
        if len(matches) != 1 or not any(
            d == "glib" or d.startswith("glib ")
            for d in matches[0].get("dependencies", [])
        ):
            fail(f"{name} is no longer the reviewed GTK3 dependency path")

    if "glib" in manifest.get("dependencies", {}):
        fail("glib is now a first-party direct dependency")
    if manifest.get("dependencies", {}).get("tauri", {}).get("version") != "=2.12.7":
        fail("Tauri version changed; re-evaluate upstream GTK3 risk")

    # This cannot prove that every transitive consumer avoids the affected API,
    # but it prevents accidental direct use in our Rust source until resolved.
    for folder in (ROOT / "src-tauri" / "src", ROOT / "vendor" / "agent" / "crates"):
        for source in folder.rglob("*.rs"):
            code = source.read_text(encoding="utf-8")
            if any(symbol in code for symbol in UNSAFE_API_SYMBOLS):
                fail(f"possible direct call to affected GLib API in {source.relative_to(ROOT)}")

    print(
        "REVIEWED UPSTREAM EXCEPTION: RUSTSEC-2024-0429 only; "
        "glib 0.18.5 is constrained by the Tauri 2.x Linux GTK3 backend. "
        "No first-party use of VariantStrIter was found. "
        "Residual Linux transitive risk remains until GTK4/GLib >=0.20 "
        "or a verified upstream 0.18 backport. All other advisories still block."
    )


if __name__ == "__main__":
    main()
