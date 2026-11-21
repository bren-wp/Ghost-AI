#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Build a static download manifest from verified local release files."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

NAME_PATTERN = re.compile(
    r"^Ghost-AI-v\d+\.\d+\.\d+-[A-Za-z0-9_.-]+"
    r"\.(?:exe|zip|dmg|AppImage|deb)$"
)

def checksum(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as data:
        for chunk in iter(lambda: data.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def generate(folder: Path) -> dict[str, list[dict[str, str | int]]]:
    if not folder.is_dir():
        raise ValueError(f"Downloads directory does not exist: {folder}")
    files: list[dict[str, str | int]] = []
    for path in sorted(folder.iterdir()):
        if path.is_symlink() or not path.is_file() or not NAME_PATTERN.fullmatch(path.name):
            continue
        if path.stat().st_size < 1024 * 1024:
            raise ValueError(f"Suspiciously small release package: {path.name}")
        files.append({
            "name": path.name,
            "bytes": path.stat().st_size,
            "sha256": checksum(path),
        })
    return {"files": files}

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--downloads", required=True, type=Path)
    args = parser.parse_args()
    payload = generate(args.downloads)
    output = args.downloads / "files.json"
    output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Ghost AI: published checksums for {len(payload['files'])} packages")

if __name__ == "__main__":
    main()
