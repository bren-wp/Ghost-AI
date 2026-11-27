#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Measure bundled UI localization coverage without contacting online translators.

Every missing key remains visible in the report; English fallback is not treated
as a completed translation. Placeholder mismatches fail the check.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ROOT / "src" / "locales"
UI_CONFIG = ROOT / "src" / "lib" / "i18n.ts"
OVERRIDES = ROOT / "src" / "lib" / "ghost-ai-locale-overrides.ts"
PLACEHOLDER = re.compile(r"{{\s*([\w.]+)\s*}}")


def flatten(data: object, prefix: str = "") -> dict[str, str]:
    if isinstance(data, str):
        return {prefix: data}
    if isinstance(data, dict):
        found: dict[str, str] = {}
        for key, value in data.items():
            found.update(flatten(value, f"{prefix}.{key}" if prefix else key))
        return found
    return {}


def load_overrides() -> dict[str, dict[str, object]]:
    source = OVERRIDES.read_text(encoding="utf-8")
    # The overrides are a literal JSON-compatible TS object; do not use eval.
    value = source[source.index("{"): source.rindex("}") + 1]
    obj = json.loads(value)
    if not isinstance(obj, dict):
        raise ValueError("Localization overrides must be a JSON object")
    return obj


def evaluate() -> tuple[list[dict[str, object]], list[str]]:
    source = UI_CONFIG.read_text(encoding="utf-8")
    codes = re.findall(r"\{\s*code:\s*'([^']+)'\s*,\s*name:", source)
    if not codes or len(codes) != len(set(codes)):
        raise ValueError("Missing or duplicate supported language entries")
    baseline = {
        file.stem: flatten(json.loads(file.read_text(encoding="utf-8")))
        for file in sorted((LOCALES / "en").glob("*.json"))
    }
    overrides = load_overrides()
    problems: list[str] = []
    results: list[dict[str, object]] = []
    for code in codes:
        translated = overrides.get(code, {})
        row: dict[str, object] = {"locale": code, "namespaces": {}, "translated": 0, "total": 0}
        for namespace, source_values in baseline.items():
            file = LOCALES / code / f"{namespace}.json"
            if file.is_file():
                local_values = flatten(json.loads(file.read_text(encoding="utf-8")))
            else:
                local_values = flatten(translated.get(namespace, {}))
            unknown = set(local_values) - set(source_values)
            for key in sorted(unknown):
                problems.append(f"{code}/{namespace}: unknown key {key}")
            valid = 0
            for key, value in local_values.items():
                if key not in source_values:
                    continue
                if source_values[key].strip() and not value.strip():
                    problems.append(f"{code}/{namespace}.{key}: empty translation")
                    continue
                original_params = set(PLACEHOLDER.findall(source_values[key]))
                actual_params = set(PLACEHOLDER.findall(value))
                if original_params != actual_params:
                    problems.append(f"{code}/{namespace}.{key}: placeholders {sorted(actual_params)} != {sorted(original_params)}")
                else:
                    valid += 1
            row["namespaces"][namespace] = {"translated": valid, "total": len(source_values)}
            row["translated"] = int(row["translated"]) + valid
            row["total"] = int(row["total"]) + len(source_values)
        row["coverage_percent"] = round(100 * int(row["translated"]) / max(1, int(row["total"])), 2)
        results.append(row)
    for unexpected in set(overrides) - set(codes):
        problems.append(f"Unexpected override locale: {unexpected}")
    return results, problems


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "reports" / "ghost-ai-localization-audit.md")
    args = parser.parse_args()
    results, problems = evaluate()
    lines = [
        "# Ghost AI UI language coverage",
        "",
        "Coverage counts actual bundled translation keys per namespace. English fallback",
        "is **not** translated content. This measures key coverage, not linguistic quality.",
        "",
        "| Language | Translated keys | English keys | Coverage |",
        "|---|---:|---:|---:|",
    ]
    for result in results:
        lines.append(f"| {result['locale']} | {result['translated']} | {result['total']} | {result['coverage_percent']}% |")
    lines.extend(["", "## Review findings", ""])
    if problems:
        lines.extend(f"- {problem}" for problem in problems)
    else:
        lines.append("No unknown translation keys or interpolation placeholder mismatches detected.")
    lines.extend(["", "## Release policy", "",
                  "Incomplete languages must not be advertised as fully localized. "
                  "Professional linguistic review and screen-by-screen verification "
                  "are required in addition to 100% key coverage.", ""])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Audited {len(results)} languages; {len(problems)} issues")
    for p in problems:
        print(p)
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
