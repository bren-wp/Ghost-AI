#!/usr/bin/env python3
"""Verify complete release assets before public stable promotion."""
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

SUFFIXES = ("Setup.exe", "Portable.exe", "Portable.zip", "Update.exe",
            "Linux.AppImage", "Linux.deb", "macOS.dmg", "macOS-Portable.zip")


def inventory(folder, tag):
    if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", tag):
        raise ValueError("Invalid release tag")
    for suffix in SUFFIXES:
        path = folder / f"Ghost-AI-{tag}-{suffix}"
        if path.is_symlink() or not path.is_file() or not path.stat().st_size:
            raise ValueError(f"Missing package: {path.name}")
    sums = folder / "SHA256SUMS.txt"
    if sums.is_symlink():
        raise ValueError("Unsafe checksum path")
    files = sorted(p for p in folder.iterdir() if p != sums)
    def digest(p):
        with p.open("rb") as stream:
            return hashlib.file_digest(stream, "sha256").hexdigest()
    result = {}
    for p in files:
        if p.is_symlink() or not p.is_file() or not p.stat().st_size or not re.fullmatch(r"[A-Za-z0-9_.-]+", p.name):
            raise ValueError(f"Unsafe or empty asset: {p.name}")
        result[p.name] = (p.stat().st_size, digest(p))
    sums.write_text("".join(f"{h}  {n}\n" for n, (_, h) in result.items()), encoding="utf-8")
    result[sums.name] = (sums.stat().st_size, digest(sums))
    return result


def missing_assets(assets, expected):
    seen = set()
    for asset in assets:
        name = asset["name"]
        if name in seen or name not in expected:
            raise ValueError(f"Unexpected asset: {name}")
        size, digest = expected[name]
        if (asset.get("state"), asset.get("size"), asset.get("digest")) != ("uploaded", size, f"sha256:{digest}"):
            raise ValueError(f"Mismatched or unverified asset: {name}")
        seen.add(name)
    return sorted(expected.keys() - seen)


def owned_release(releases, tag, marker):
    matches = [r for r in releases if r["tag_name"] == tag]
    if len(matches) > 1 or (matches and marker not in (matches[0].get("body") or "").splitlines()):
        raise ValueError("Refuse to overwrite an unrelated release")
    return matches[0] if matches else None


def api(endpoint, method="GET", payload=None, paginate=False):
    args = ["gh", "api", "--method", method, endpoint]
    if paginate:
        args += ["--paginate", "--slurp"]
    if payload is not None:
        args += ["--input", "-"]
    result = json.loads(subprocess.run(args, input=json.dumps(payload) if payload is not None else None,
                                      text=True, stdout=subprocess.PIPE, check=True).stdout)
    return [x for page in result for x in page] if paginate else result


def verify_refs(repo, tag, sha, required=False):
    if api(f"repos/{repo}/git/ref/heads/release/{tag}")["object"]["sha"] != sha:
        raise ValueError("Release branch moved after validation")
    refs = subprocess.check_output(["git", "ls-remote", "--tags", "origin",
                                   f"refs/tags/{tag}", f"refs/tags/{tag}^{{}}"], text=True)
    hashes = dict(line.split("\t")[::-1] for line in refs.splitlines())
    target = hashes.get(f"refs/tags/{tag}^{{}}", hashes.get(f"refs/tags/{tag}"))
    if (target is not None and target != sha) or (required and target != sha):
        raise ValueError("Existing tag points to another commit or is missing")


def publish(repo, tag, sha, folder):
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Invalid commit SHA")
    expected = inventory(folder, tag)
    endpoint = f"repos/{repo}/releases"
    marker = f"<!-- ghost-ai-release-commit:{sha} -->"
    verify_refs(repo, tag, sha)
    release = owned_release(api(endpoint, paginate=True), tag, marker)
    if release is None:
        release = api(endpoint, "POST", {
            "tag_name": tag, "target_commitish": sha, "name": f"Ghost AI {tag} Stable",
            "body": marker + "\n\nWindows Authenticode signing and macOS notarization are not established by this workflow; OS warnings may occur. Update.exe is manual maintenance, not an authenticated automatic updater. Automatic updates require trusted signing keys.\n\n" + f"See [CHANGELOG](https://github.com/{repo}/blob/{sha}/CHANGELOG.md).",
            "draft": True, "prerelease": False,
        })
    item = f"{endpoint}/{release['id']}"
    missing = missing_assets(api(item + "/assets", paginate=True), expected)
    if not release["draft"]:
        if missing or release["prerelease"]:
            raise ValueError("Refuse to overwrite an already-published version")
        verify_refs(repo, tag, sha, True)
        print("Identical verified stable release already exists; no changes made")
        return
    def check_draft():
        current = api(item)
        if not current["draft"] or marker not in (current.get("body") or "").splitlines():
            raise ValueError("Owned staging draft changed")
    for name in missing:
        check_draft()
        subprocess.run(["gh", "release", "upload", tag, str(folder / name), "--repo", repo], check=True)
    if missing_assets(api(item + "/assets", paginate=True), expected):
        raise ValueError("Incomplete uploaded assets")
    verify_refs(repo, tag, sha)
    check_draft()
    result = api(item, "PATCH", {"draft": False, "prerelease": False})
    if result["draft"] or result["prerelease"]:
        raise ValueError("Stable publication not confirmed")
    verify_refs(repo, tag, sha, True)
    if missing_assets(api(item + "/assets", paginate=True), expected):
        raise ValueError("Published assets incomplete")
    print(f"Verified stable publication: {result['html_url']}")


if __name__ == "__main__":
    publish(os.environ["GITHUB_REPOSITORY"], sys.argv[1], os.environ["GITHUB_SHA"], Path(sys.argv[2]))
