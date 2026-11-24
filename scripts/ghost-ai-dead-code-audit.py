#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Conservative static reachability review of first-party TS/TSX and Rust modules.

This reports candidates, not proof of dead code. Runtime reflection, dynamic
registries, Tauri commands, generated glue and build-time includes need review.
No files are removed by this tool.
"""
from __future__ import annotations

import argparse
import hashlib
import posixpath
import re
import tomllib
import zlib
from collections import defaultdict, deque
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
    known = set(sources)
    assets = {p.relative_to(ROOT).as_posix() for p in (ROOT / "src").rglob("*") if p.is_file()}
    graph: dict[str, set[str]] = {}
    unresolved = 0
    for name, path in sorted(sources.items()):
        contents = path.read_text(encoding="utf-8")
        imports = IMPORT_RE.findall(contents)
        targets = set()
        for specifier in imports:
            target = ts_target(name, specifier, known)
            if target is not None:
                targets.add(target)
            elif specifier.startswith((".", "@/")):
                # Existing non-code assets (JSON, CSS, images, declarations)
                # are resolved inputs, not missing TS modules.
                raw = specifier.split("?", 1)[0]
                if ts_target(name, raw, assets) is None:
                    unresolved += 1
        graph[name] = targets
    # Importing a module from a test does not make it production-reachable.
    production = {
        name for name in sources
        if not re.search(r"(?:/__tests__/|\.(?:test|spec)\.[jt]sx?$)", name)
    }
    entrypoints = {x for x in ("src/main.tsx", "src/main.ts", "src/index.tsx", "src/index.ts") if x in sources}
    # The configured Vitest setup is a test entrypoint, not production code
    # and not a deletion candidate. Only use paths explicitly in setupFiles.
    config = ROOT / "vitest.config.ts"
    setup_roots = set()
    if config.is_file():
        match = re.search(r"setupFiles\s*:\s*\[([^\]]*)\]", config.read_text(encoding="utf-8"))
        if match:
            for path in re.findall(r"['\"]([^'\"]+)['\"]", match.group(1)):
                normalized = posixpath.normpath(path)
                if normalized in known:
                    setup_roots.add(normalized)
    production -= setup_roots
    reached = walk_graph(graph, entrypoints)
    # Test-only dependencies are still not production-reachable. Keep them
    # in the candidate inventory, but never list the explicit setup root.
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
    known = set(files)
    graph: dict[str, set[str]] = {}
    for name, path in sorted(files.items()):
        contents = path.read_text(encoding="utf-8")
        graph[name] = {
            child for module in RUST_MOD_RE.findall(contents)
            if (child := rust_child(name, module, known)) is not None
        }
    entrypoints = {
        name for name in files
        if name in ("src-tauri/src/lib.rs", "src-tauri/src/main.rs")
        or re.fullmatch(r"vendor/agent/crates/[^/]+/src/(?:lib|main)\.rs", name)
    }
    # Cargo explicit and auto-discovered binary targets are entrypoints.
    for root in roots:
        manifest = root.parent / "Cargo.toml"
        if not manifest.is_file():
            continue
        config = tomllib.loads(manifest.read_text(encoding="utf-8"))
        for target in config.get("bin", []):
            path = target.get("path")
            if path:
                candidate = (root.parent / path).relative_to(ROOT).as_posix()
                if candidate in known:
                    entrypoints.add(candidate)
        if config.get("package", {}).get("autobins", True):
            prefix = (root / "bin").relative_to(ROOT).as_posix()
            entrypoints.update(name for name in known if re.fullmatch(
                re.escape(prefix) + r"/(?:[^/]+\.rs|[^/]+/main\.rs)", name
            ))
    reached = walk_graph(graph, entrypoints)
    # Non-module Rust files (examples and build scripts) are outside src roots.
    return len(files), sorted(set(files) - reached)


def exact_duplicates() -> list[list[str]]:
    """Byte-identical source candidates; not semantic clone detection."""
    groups: dict[str, list[str]] = defaultdict(list)
    for root in (ROOT / "src", ROOT / "src-tauri" / "src"):
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.suffix not in (*TS_EXTENSIONS, ".rs"):
                continue
            name = path.relative_to(ROOT).as_posix()
            if "/types/generated/" in name or path.name.endswith(".d.ts"):
                continue
            data = path.read_bytes()
            if len(data) >= 100:
                groups[hashlib.sha256(data).hexdigest()].append(name)
    return sorted(sorted(group) for group in groups.values() if len(group) > 1)



# Approximate lexical clone detection, not a language parser or equivalence
# checker. Normalize names and literal values, but retain control flow and
# operators. Keep source line locations without printing code or secrets.
CLONE_TOKEN_RE = re.compile(
    r"(?P<comment>//[^\n]*|/\*[\s\S]*?\*/)"
    r"|(?P<string>\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\\n])*'|\x60(?:\\.|[^\x60\\])*\x60)"
    r"|(?P<number>\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?)\b)"
    r"|(?P<identifier>[A-Za-z_$][A-Za-z0-9_$]*)"
    r"|(?P<operator>===|!==|=>|==|!=|<=|>=|&&|\|\||\?\?|::|->|\+=|-=|\S)"
)
CLONE_KEYWORDS = frozenset("""
    if else match switch case default for while loop break continue return
    throw try catch finally async await yield fn function let const var mut
    pub struct enum impl trait type interface class extends implements
    import export from use mod as in of is new typeof instanceof delete
    true false null undefined None Some Ok Err unsafe move where ref
""".split())
CLONE_TOKENS = 48
CLONE_WINDOW = 16
CLONE_MAX_OCCURRENCES = 16
CLONE_REPORT_LIMIT = 200


def clone_tokens(contents: str) -> list[tuple[str, int]]:
    tokens = []
    line = 1
    end = 0
    for match in CLONE_TOKEN_RE.finditer(contents):
        line += contents.count("\n", end, match.start())
        value = match.group()
        kind = match.lastgroup
        if kind != "comment":
            if kind == "identifier" and value not in CLONE_KEYWORDS:
                value = "<id>"
            elif kind == "string":
                value = "<string>"
            elif kind == "number":
                value = "<number>"
            tokens.append((value, line))
        line += match.group().count("\n")
        end = match.end()
    return tokens


def clone_fingerprints(tokens: list[tuple[str, int]], width: int = CLONE_TOKENS,
                       window: int = CLONE_WINDOW):
    """Rolling hashes + winnowing: linear time, bounded candidate density."""
    if len(tokens) < width:
        return
    mask = (1 << 64) - 1
    base = 257
    power = pow(base, width - 1, 1 << 64)
    values = [zlib.crc32(value.encode("utf-8")) + 1 for value, _ in tokens]
    rolling = 0
    for value in values[:width]:
        rolling = (rolling * base + value) & mask
    minima = deque()
    last_index = -1
    count = len(values) - width + 1
    window = min(window, count)
    for index in range(count):
        if index:
            rolling = ((rolling - values[index - 1] * power) * base + values[index + width - 1]) & mask
        while minima and minima[-1][0] >= rolling:
            minima.pop()
        minima.append((rolling, index))
        while minima[0][1] <= index - window:
            minima.popleft()
        if index >= window - 1 and minima[0][1] != last_index:
            _, start = minima[0]
            last_index = start
            # Verify sampled rolling matches using a cryptographic digest of
            # the actual normalized sequence, not raw source code.
            block = tokens[start:start + width]
            first, last = block[0][1], block[-1][1]
            if last - first < 3:
                continue
            digest = hashlib.blake2b(
                "\0".join(value for value, _ in block).encode("utf-8"), digest_size=16
            ).hexdigest()
            yield digest, first, last


def structural_clone_candidates() -> tuple[int, list[list[tuple[str, int, int]]], int]:
    """Review seeds with renamed identifiers/literals, within or across files.

    Very common fingerprints are ignored as boilerplate; report explicit
    counts and limits rather than treating skipped regions as proven clean.
    """
    index: dict[tuple[str, str], list[tuple[str, int, int]]] = defaultdict(list)
    common = set()
    scanned = 0
    for root in (ROOT / "src", ROOT / "src-tauri" / "src", ROOT / "vendor" / "agent" / "crates"):
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.suffix not in (*TS_EXTENSIONS, ".rs"):
                continue
            name = path.relative_to(ROOT).as_posix()
            if ("/types/generated/" in name or path.name.endswith(".d.ts")
                    or re.search(r"(?:/(?:__tests__|test|tests|target)/|\.(?:test|spec)\.[jt]sx?$)", name)):
                continue
            scanned += 1
            language = "rust" if path.suffix == ".rs" else "typescript"
            for digest, first, last in clone_fingerprints(clone_tokens(path.read_text(encoding="utf-8"))):
                key = (language, digest)
                if key in common:
                    continue
                occurrences = index[key]
                occurrence = (name, first, last)
                if occurrence in occurrences:
                    continue
                if len(occurrences) >= CLONE_MAX_OCCURRENCES:
                    common.add(key)
                    del index[key]
                else:
                    occurrences.append(occurrence)
    groups = []
    seen = set()
    for occurrences in index.values():
        if len(occurrences) < 2:
            continue
        distinct = []
        for occurrence in sorted(occurrences):
            name, first, last = occurrence
            if any(name == other[0] and first <= other[2] and last >= other[1] for other in distinct):
                continue
            distinct.append(occurrence)
        if len(distinct) < 2:
            continue
        group = tuple(distinct)
        if group not in seen:
            seen.add(group)
            groups.append(distinct)
    # Deterministic, broadest cross-file candidates first. Adjacent seeds can
    # still refer to a single larger clone, so the count is not a defect count.
    groups.sort(key=lambda g: (-len({item[0] for item in g}), -len(g), g))
    return scanned, groups, len(common)


def report(output: Path) -> dict[str, int]:
    ts_total, unused_ts, unresolved = ts_candidates()
    rust_total, unused_rust = rust_candidates()
    duplicates = exact_duplicates()
    clone_files, clone_groups, common_clones = structural_clone_candidates()
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
        f"- Byte-identical first-party source groups (review required): **{len(duplicates)}**",
        f"- Production lexical-clone source files checked: **{clone_files}**",
        f"- Normalized structural clone seed groups: **{len(clone_groups)}**",
        f"- Very common fingerprints skipped: **{common_clones}**",
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
    lines.extend(["", "## Exact duplicate source candidates", "",
                  "Generated declarations are excluded. Similar functions and semantic clones need manual review."])
    for group in duplicates:
        lines.append("- " + ", ".join(f"`{name}`" for name in group))
    if not duplicates:
        lines.append("No byte-identical source groups identified within the checked scope.")
    lines.extend(["", "## Normalized structural clone candidates", "",
                  "Heuristic lexical review seeds: identifiers and literals normalized; control flow and operators retained.",
                  "Not proof of semantic equivalence. Generated declarations, test paths and very common fingerprints excluded.",
                  f"Showing {min(len(clone_groups), CLONE_REPORT_LIMIT)} of {len(clone_groups)} groups; overlapping seeds may identify the same clone.",
                  ""])
    for group in clone_groups[:CLONE_REPORT_LIMIT]:
        lines.append("- " + "; ".join(f"`{name}:{first}-{last}`" for name, first, last in group))
    if not clone_groups:
        lines.append("No normalized clone seeds identified within the checked scope.")
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
            "rust_candidates": len(unused_rust), "unresolved_imports": unresolved,
            "exact_duplicate_groups": len(duplicates), "clone_files": clone_files,
            "structural_clone_seed_groups": len(clone_groups), "common_fingerprints_skipped": common_clones}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path,
                        default=ROOT / "reports" / "ghost-ai-dead-code-audit.md")
    args = parser.parse_args()
    print(report(args.output))


if __name__ == "__main__":
    main()
