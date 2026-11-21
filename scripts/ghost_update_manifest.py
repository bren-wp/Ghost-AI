#!/usr/bin/env python3
"""Build a strictly static, signed Tauri 2 update feed for brendigo.com."""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
from urllib.parse import urlparse

PLATFORMS = {
    "windows-x86_64", "windows-aarch64",
    "linux-x86_64", "linux-aarch64",
    "darwin-x86_64", "darwin-aarch64",
}

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", required=True)
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--signature-file", required=True, type=Path)
    ap.add_argument("--url", required=True)
    ap.add_argument("--output", required=True, type=Path)
    args = ap.parse_args()
    if not args.version or args.version[0] == "v" or any(x.isspace() for x in args.version):
        ap.error("Version must be a stable dotted value without a v prefix")
    parsed = urlparse(args.url)
    if parsed.scheme != "https" or parsed.hostname not in ("brendigo.com", "www.brendigo.com"):
        ap.error("Update packages must be hosted on the official HTTPS website")
    signature = args.signature_file.read_text(encoding="utf-8").strip()
    if len(signature) < 50 or "BEGIN PRIVATE KEY" in signature or "<" in signature:
        ap.error("Invalid updater signature; refusing to publish unsigned updates")
    data = {
        "version": args.version,
        "notes": f"Ghost AI v{args.version} — improvements and security updates.",
        "pub_date": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "platforms": {},
    }
    if args.output.exists():
        old = json.loads(args.output.read_text(encoding="utf-8"))
        if old.get("version") != args.version:
            ap.error("Refusing to overwrite an update manifest for a different version")
        data = old
    data["platforms"][args.platform] = {"signature": signature, "url": args.url}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(f"Wrote signed {args.platform} metadata for Ghost AI {args.version}")

if __name__ == "__main__":
    main()
