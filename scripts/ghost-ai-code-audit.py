#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Report maintainability and security review candidates in first-party code."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOTS = ("src", "src-tauri/src", "scripts")
SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".rs", ".py", ".ps1"}
SKIPPED = {"__tests__", "node_modules", "vendor", "target", "dist", "generated", "assets"}
SIGNALS = {
    "dynamic code execution": re.compile(r"\beval\s*\(|\bnew\s+Function\s*\(", re.I),
    "HTML injection boundary": re.compile(r"dangerouslySetInnerHTML|\.innerHTML\s*=", re.I),
    "shell execution boundary": re.compile(r"\bshell\s*:\s*true\b|Command::new\(\s*\"(?:sh|bash|cmd|powershell)\"", re.I),
    "non-HTTPS endpoint": re.compile(r"http://(?!localhost\b|127\.0\.0\.1\b|asset\.localhost\b|ipc\.localhost\b)", re.I),
}


def scan():
    files: list[tuple[int, str]] = []
    missing_headers: list[str] = []
    signals: list[tuple[str, str, int]] = []
    count = 0
    for folder in SOURCE_ROOTS:
        directory = ROOT / folder
        if not directory.is_dir():
            continue
        for path in sorted(directory.rglob("*")):
            if not path.is_file() or path.suffix not in SOURCE_EXTENSIONS:
                continue
            if path.name.endswith(".d.ts") or any(p in SKIPPED for p in path.relative_to(directory).parts[:-1]):
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except (UnicodeError, OSError):
                continue
            relative = path.relative_to(ROOT).as_posix()
            lines = content.splitlines()
            count += 1
            files.append((len(lines), relative))
            start = lines[1] if lines and lines[0].startswith("#!") and len(lines) > 1 else (lines[0] if lines else "")
            if "Ghost AI by Brendigo" not in start:
                missing_headers.append(relative)
            for number, line in enumerate(lines, 1):
                if line.strip().startswith(("//", "#", "*", "/*")):
                    continue
                for label, expression in SIGNALS.items():
                    if expression.search(line):
                        signals.append((label, relative, number))
    return count, sorted(files, reverse=True), missing_headers, signals


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "reports" / "ghost-ai-code-audit.md")
    args = parser.parse_args()
    count, files, missing, signals = scan()
    markdown = [
        "# Ghost AI by Brendigo — source review",
        "",
        "Automated risk indicators are **review candidates**, not proven vulnerabilities. "
        "A dead-code determination requires dependency graph and runtime tests.",
        "",
        f"First-party source files scanned: **{count}**",
        f"Files over 500 lines: **{sum(size > 500 for size, _ in files)}**",
        f"First-party files without a product header: **{len(missing)}**",
        f"Security review candidates: **{len(signals)}**",
        "",
        "## Largest first-party source files",
        "",
        "| Lines | Source |",
        "| ---: | --- |",
    ]
    markdown.extend(f"| {size} | `{name}` |" for size, name in files[:30])
    markdown.extend(["", "## Header consistency", ""])
    if missing:
        markdown.extend(f"- `{name}`" for name in missing[:100])
        if len(missing) > 100:
            markdown.append(f"- ... and {len(missing) - 100} more")
    else:
        markdown.append("All scanned files include the first-party header.")
    markdown.extend(["", "## Review candidates", "", "| Signal | Source | Line |", "| --- | --- | ---: |"])
    markdown.extend(f"| {kind} | `{name}` | {line} |" for kind, name, line in signals[:160])
    if len(signals) > 160:
        markdown.append(f"\nAdditional items not displayed: {len(signals)-160}")
    markdown.extend(["", "## What is not certified", "",
        "This report does not certify vulnerability absence, dependency safety, UI pixel "
        "matching, full dead-code coverage, or release signing.", ""])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(markdown), encoding="utf-8")
    print(f"Ghost AI source audit: {count} files, {len(missing)} header gaps, {len(signals)} review candidates")


if __name__ == "__main__":
    main()
