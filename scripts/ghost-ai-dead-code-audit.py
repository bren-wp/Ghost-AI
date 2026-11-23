#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Conservative static reachability review of first-party TS/TSX and Rust modules.

This reports candidates, not proof of dead code. Runtime reflection, dynamic
registries, Tauri commands, generated glue and build-time includes need review.
No files are removed by this tool.
"""
from __future__ import annotations

import argparse
import posixpath
import re
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORT_RE = re.compile(
    r"""(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]"""
)
RUST_MOD_RE = re.compile(r"(?m)^\s*(?:pub(?:\([^)]*\))?\s+)?mod\s+(\w+)\s*;")
TS_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")


def ts_target(source: str, specifier: str, known: set[str]) -> str | None:
    if specifier.startswith("@/"):
        raw = "src/" + specifier[2:]
    elif specifier.startswith("."):
        raw = posixpath.normpath(posixpath.join(posixpath.dirname(source), specifier))
    else:
        return None
    options = [raw]
    options.extend(raw + ext for ext in TS_EXTENSIONS)
    options.extend(raw + "/index" + ext for ext in TS_EXTENSIONS)
    return next((candidate for candidate in options if candidate in known), None)


def walk_graph(graph: dict[str, set[str]], roots: set[str]) -> set[str]:
    reached = set(roots)
    pending = deque(roots)
    while pending:
        current = pending.popleft()
        for child in graph.get(current, ()):
            if child not in reached:
                reached.add(child)
                pending.append(child)
    return reached


def ts_candidates() -> tuple[int, list[str], int]:
    sources = {
        p.relative_to(ROOT).as_posix(): p
        for p in (ROOT / "src").rglob("*")
        if p.is_file() and p.suffix in TS_EXTENSIONS and not p.name.endswith(".d.ts")
    }
    graph: dict[str, set[str]] = {}
    unresolved = 0
    for name, path in sorted(sources.items()):
        contents = path.read_text(encoding="utf-8")
        imports = IMPORT_RE.findall(contents)
        targets = set()
        for specifier in imports:
            target = ts_target(name, specifier, set(sources))
            if target is not None:
                targets.add(target)
            elif specifier.startswith((".", "@/")):
                unresolved += 1
        graph[name] = targets
    # Importing a module from a test does not make it production-reachable.
    production = {
        name for name in sources
        if not re.search(r"(?:/__tests__/|\.(?:test|spec)\.[jt]sx?$)", name)
    }
    entrypoints = {x for x in ("src/main.tsx", "src/main.ts", "src/index.tsx", "src/index.ts") if x in sources}
    # React roots may use imported global CSS and lazy modules. This report
    # deliberately does not infer live behavior from filenames alone.
    reached = walk_graph(graph, entrypoints)
    candidates = sorted(production - reached)
    return len(production), candidates, unresolved


def rust_child(current: str, module: str, known: set[str]) -> str | None:
    directory = posixpath.dirname(current)
    if posixpath.basename(current) not in ("lib.rs", "main.rs", "mod.rs"):
        directory = posixpath.join(directory, posixpath.splitext(posixpath.basename(current))[0])
    for candidate in (posixpath.join(directory, module + ".rs"),
                      posixpath.join(directory, module, "mod.rs")):
        if candidate in known:
            return candidate
    return None


def rust_candidates() -> tuple[int, list[str]]:
    roots = [ROOT / "src-tauri" / "src"]
    roots.extend((ROOT / "vendor" / "agent" / "crates").glob("*/src"))
    files: dict[str, Path] = {
        p.relative_to(ROOT).as_posix(): p
        for root in roots if root.is_dir()
        for p in root.rglob("*.rs")
    }
    graph: dict[str, set[str]] = {}
    for name, path in sorted(files.items()):
        contents = path.read_text(encoding="utf-8")
        graph[name] = {
            child for module in RUST_MOD_RE.findall(contents)
            if (child := rust_child(name, module, set(files))) is not None
        }
    entrypoints = {
        name for name in files
        if name in ("src-tauri/src/lib.rs", "src-tauri/src/main.rs")
        or re.fullmatch(r"vendor/agent/crates/[^/]+/src/(?:lib|main)\.rs", name)
    }
    reached = walk_graph(graph, entrypoints)
    # Non-module Rust files (examples and build scripts) are outside src roots.
    return len(files), sorted(set(files) - reached)


def report(output: Path) -> dict[str, int]:
    ts_total, unused_ts, unresolved = ts_candidates()
    rust_total, unused_rust = rust_candidates()
    lines = [
        "# Ghost AI by Brendigo — full first-party static dead-code review",
        "",
        "This is a **candidate inventory** rather than proof of unused code. "
        "Lazy imports, Tauri command dispatch, build macros, file-system "
        "conventions and runtime registration can make static reachability "
        "incomplete. Never delete these files automatically.",
        "",
        f"- Production TS/TSX/JS modules analyzed: **{ts_total}**",
        f"- Rust crate source modules analyzed: **{rust_total}**",
        f"- TS modules without a static path from a production entrypoint: **{len(unused_ts)}**",
        f"- Rust modules without a recognized `mod` path: **{len(unused_rust)}**",
        f"- Unresolved relative/alias import specifiers (review required): **{unresolved}**",
        "",
        "## TypeScript review candidates",
        "",
    ]
    lines.extend(f"- `{file}`" for file in unused_ts)
    if not unused_ts:
        lines.append("None identified by the static import graph.")
    lines.extend(["", "## Rust review candidates", ""])
    lines.extend(f"- `{file}`" for file in unused_rust)
    if not unused_rust:
        lines.append("None identified by the Rust module graph.")
    lines.extend([
        "",
        "## Reviewer procedure",
        "",
        "For each candidate: inspect its call sites, platform-specific cfg, "
        "dynamic import and Tauri registration, then run tests before proposing removal. "
        "No automatic deletion, no claim of 100% dead-code coverage.",
        "",
    ])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines), encoding="utf-8")
    return {"typescript": ts_total, "rust": rust_total, "ts_candidates": len(unused_ts),
            "rust_candidates": len(unused_rust), "unresolved_imports": unresolved}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path,
                        default=ROOT / "reports" / "ghost-ai-dead-code-audit.md")
    args = parser.parse_args()
    print(report(args.output))


if __name__ == "__main__":
    main()
