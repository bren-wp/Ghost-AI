# Ghost AI by Brendigo
"""Fail closed when the release version differs across package metadata."""
import json
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def verify(version: str, root: Path = ROOT) -> None:
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise ValueError(f"Invalid stable version: {version}")
    versions = {
        "package.json": json.loads((root / "package.json").read_text(encoding="utf-8"))["version"],
        "tauri.conf.json": json.loads((root / "src-tauri/tauri.conf.json").read_text(encoding="utf-8"))["version"],
        "Cargo.toml": tomllib.loads((root / "src-tauri/Cargo.toml").read_text(encoding="utf-8"))["package"]["version"],
    }
    lock = tomllib.loads((root / "src-tauri/Cargo.lock").read_text(encoding="utf-8"))
    roots = [p for p in lock["package"] if p["name"] == "ghost-ai-desktop" and "source" not in p]
    if len(roots) != 1:
        raise ValueError("Expected exactly one local ghost-ai-desktop package in Cargo.lock")
    versions["Cargo.lock"] = roots[0]["version"]
    mismatches = {name: value for name, value in versions.items() if value != version}
    if mismatches:
        raise ValueError(f"Expected {version}; mismatched release metadata: {mismatches}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify_release_version.py X.Y.Z")
    verify(sys.argv[1])
    print(f"Release version {sys.argv[1]} verified")
