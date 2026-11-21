#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Add concise product headers to owned application files without modifying license notices."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADER = "Ghost AI by Brendigo"
EXTENSIONS = {
    ".ts": "//", ".tsx": "//", ".js": "//", ".jsx": "//",
    ".rs": "//", ".swift": "//", ".css": "/*",
    ".py": "#", ".sh": "#", ".ps1": "#",
    ".toml": "#", ".yml": "#", ".yaml": "#", ".nsi": ";",
}
ROOTS = (
    ROOT / "src",
    ROOT / "src-tauri" / "src",
    ROOT / "scripts",
    ROOT / "public",
)
EXCLUDED = {"node_modules", "vendor", "generated", "gen", "target", "dist", "legal", "icons", "assets"}

def make_header(path: Path) -> str:
    symbol = EXTENSIONS[path.suffix]
    return f"/* {HEADER} */" if symbol == "/*" else f"{symbol} {HEADER}"

def apply(path: Path) -> bool:
    if path.name == "ghost_headers.py" or path.name.endswith(".d.ts"):
        return False
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return False
    if not source:
        return False
    prefix = make_header(path)
    rows = source.splitlines(keepends=True)
    header_index = 1 if rows[0].startswith("#!") else 0
    existing = 0
    while header_index + existing < len(rows) and rows[header_index + existing].strip() == prefix:
        existing += 1
    if existing > 1:
        del rows[header_index + 1:header_index + existing]
    elif existing == 0:
        rows.insert(header_index, prefix + "\n")
    updated = "".join(rows)
    if updated == source:
        return False
    path.write_text(updated, encoding="utf-8")
    return True

def main() -> None:
    count = 0
    for folder in ROOTS:
        if not folder.exists():
            continue
        for file in sorted(folder.rglob("*")):
            if not file.is_file() or file.suffix not in EXTENSIONS:
                continue
            if any(part in EXCLUDED for part in file.relative_to(folder).parts[:-1]):
                continue
            count += int(apply(file))
    for file in (ROOT / "src-tauri" / "build.rs", ROOT / "src-tauri" / "Cargo.toml"):
        if file.exists():
            count += int(apply(file))
    print(f"Ghost AI identity header updated in {count} first-party source files")

if __name__ == "__main__":
    main()
