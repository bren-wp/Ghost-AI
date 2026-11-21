#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Create a static Tauri 2 update manifest from signed and verified release assets."""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
from urllib.parse import quote

SUPPORTED={
    "windows-x86_64": ".nsis.zip",
    "linux-x86_64": ".AppImage.tar.gz",
    "darwin-aarch64": ".app.tar.gz",
    "darwin-x86_64": ".app.tar.gz",
}
BASE="https://brendigo.com/ghost-ai/updates/"

def build_manifest(version: str, assets: Path, platforms: dict[str,str]) -> dict:
    if not version or any(ch not in "0123456789." for ch in version):
        raise ValueError("Use an explicit numeric semantic version such as 0.1.1")
    if len(version.split(".")) != 3:
        raise ValueError("Expected X.Y.Z version")
    entries={}
    for platform, filename in platforms.items():
        if platform not in SUPPORTED:
            raise ValueError(f"Unsupported platform: {platform}")
        if Path(filename).name != filename or not filename.endswith(SUPPORTED[platform]):
            raise ValueError(f"Invalid filename for {platform}: {filename}")
        payload=assets / filename
        signature=assets / (filename + ".sig")
        if not payload.is_file() or not signature.is_file():
            raise FileNotFoundError(f"Missing update package or signature: {filename}")
        value=signature.read_text(encoding="utf8").strip()
        if not value or any(ch.isspace() for ch in value):
            raise ValueError(f"Invalid updater signature for {filename}")
        entries[platform]={"signature":value,"url":BASE+quote(filename,safe="")}
    if not entries:
        raise ValueError("No signed update artifacts supplied")
    return {
        "version":version,
        "notes":f"Ghost AI v{version} update.",
        "pub_date":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z"),
        "platforms":entries,
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--version",required=True)
    ap.add_argument("--assets",required=True,type=Path)
    ap.add_argument("--output",required=True,type=Path)
    ap.add_argument("--platform",required=True,action="append",help="OS-ARCH=filename; may repeat")
    args=ap.parse_args()
    pairs={}
    for value in args.platform:
        key,sep,name=value.partition("=")
        if not sep or not key or not name or key in pairs:
            ap.error("Expected unique --platform windows-x86_64=FILE.nsis.zip")
        pairs[key]=name
    data=build_manifest(args.version,args.assets,pairs)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(data,indent=2)+"\n",encoding="utf8")
    print(f"Wrote {args.output} with {len(data['platforms'])} verified signatures")

if __name__ == "__main__":
    main()
