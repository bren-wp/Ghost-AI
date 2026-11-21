#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Configure the Ghost AI signed-updater only with an independently provisioned public key."""
from __future__ import annotations
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
config_path = ROOT / "src-tauri" / "tauri.conf.json"
public_key = os.environ.get("GHOST_AI_UPDATER_PUBLIC_KEY", "").strip()
private_key = os.environ.get("TAURI_SIGNING_PRIVATE_KEY", "").strip()
config = json.loads(config_path.read_text(encoding="utf8"))

if bool(public_key) != bool(private_key):
    raise SystemExit(
        "Signed updates require BOTH GHOST_AI_UPDATER_PUBLIC_KEY and "
        "TAURI_SIGNING_PRIVATE_KEY. No unsigned auto-updater fallback is allowed."
    )

if public_key:
    if "BEGIN" in public_key or len(public_key) < 40:
        raise SystemExit("Invalid public updater key format")
    config.setdefault("plugins", {})["updater"] = {
        "pubkey": public_key,
        "endpoints": ["https://brendigo.com/ghost-ai/updates/latest.json"],
    }
    config["bundle"]["createUpdaterArtifacts"] = True
else:
    config.setdefault("plugins", {}).pop("updater", None)
    config["bundle"]["createUpdaterArtifacts"] = False

config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
print("Signed update channel:", "enabled" if public_key else "disabled (no trusted key provisioned)")
