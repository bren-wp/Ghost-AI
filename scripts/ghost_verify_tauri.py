#!/usr/bin/env python3
# Ghost AI by Brendigo
import json
import re
import tomllib
from pathlib import Path
root = Path(__file__).resolve().parents[1]
with (root / "src-tauri" / "Cargo.lock").open("rb") as stream:
    lock = tomllib.load(stream)
entries = {p["name"]:p["version"] for p in lock["package"] if p["name"] in {
    "tauri","tauri-plugin-updater","tauri-plugin-fs","tauri-plugin-process","tauri-plugin-opener","tauri-plugin-dialog",
}}
package = json.loads((root / "package.json").read_text(encoding="utf-8"))
requirements = {"tauri":"@tauri-apps/api"}
for name in ("updater","fs","process","opener","dialog"):
    requirements[f"tauri-plugin-{name}"] = f"@tauri-apps/plugin-{name}"
if not all(k in entries for k in requirements):
    raise SystemExit(f"Missing Rust Tauri dependencies: {set(requirements)-set(entries)}")
for rust, js in requirements.items():
    installed=package["dependencies"][js].strip("^~=")
    actual=entries[rust]
    # Manifest ranges may be ^2; match resolved pnpm lockfile below.
    content=(root/"pnpm-lock.yaml").read_text(encoding="utf-8")
    match=re.search(r"(?m)^      '"+re.escape(js)+r"':\n        specifier: .*\n        version: (\d+\.\d+\.\d+)",content)
    if not match:
        raise SystemExit(f"Cannot resolve pnpm lock version for {js}")
    js_version=match.group(1)
    if ".".join(actual.split(".")[:2]) != ".".join(js_version.split(".")[:2]):
        raise SystemExit(f"Tauri version mismatch: {rust}={actual}, {js}={js_version}")
print("Ghost AI Tauri versions match:", entries)
