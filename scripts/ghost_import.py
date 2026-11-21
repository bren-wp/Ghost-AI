#!/usr/bin/env python3
"""Ghost AI: pinned-source importer and visual identity migration."""
from __future__ import annotations
import json, os, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = Path(os.environ["GHOST_SOURCE_CORE"])
AGENT = Path(os.environ["GHOST_SOURCE_AGENT"])

def copy_into(src, dst, skip):
    dst.mkdir(parents=True, exist_ok=True)
    for child in src.iterdir():
        if child.name in skip:
            continue
        output = dst / child.name
        if output.is_dir():
            shutil.rmtree(output)
        elif output.exists():
            output.unlink()
        if child.is_dir():
            shutil.copytree(child, output)
        else:
            shutil.copy2(child, output)

def replace_names(s):
    for a,b in [
        ("CHATSHELL","GHOST_AI"), ("ChatShell","Ghost AI"),
        ("chatshell-agent","ghost-ai-agent"),
        ("chatshell-desktop","ghost-ai-desktop"),
        ("chatshell_desktop","ghost_ai_desktop"),
        ("chatshell","ghost_ai"),
    ]:
        s=s.replace(a,b)
    return s.replace("https://dl.ghost_ai.app","https://github.com/bren-wp/Ghost-AI").replace(
        "https://ghost_ai.app","https://github.com/bren-wp/Ghost-AI"
    )

def migrate():
    for current,dirs,files in os.walk(ROOT):
        dirs[:]=[d for d in dirs if d not in (".git",".github","target","node_modules","legal")]
        for filename in files:
            p=Path(current)/filename
            if p==ROOT/"scripts/ghost_import.py":
                continue
            try:
                buf=p.read_bytes()
                if b"\0" in buf or len(buf)>2_000_000:
                    continue
                s=buf.decode("utf-8")
            except (OSError,UnicodeError):
                continue
            t=replace_names(s)
            if t!=s:
                p.write_text(t,encoding="utf-8")
    for current,dirs,files in os.walk(ROOT,topdown=False):
        if ".git" in Path(current).parts or ".github" in Path(current).parts or "legal" in Path(current).parts:
            continue
        for name in files+dirs:
            newer=name.replace("chatshell","ghost-ai").replace("ChatShell","Ghost-AI")
            if newer!=name:
                (Path(current)/name).rename(Path(current)/newer)

def configure():
    p=ROOT/"package.json"
    data=json.loads(p.read_text())
    data["name"]="ghost-ai-desktop"
    data["version"]="0.1.0"
    p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n")
    p=ROOT/"src-tauri/tauri.conf.json"
    data=json.loads(p.read_text())
    data.update(productName="Ghost AI",version="0.1.0",identifier="com.brendigo.ghostai")
    data["app"]["windows"][0].update(title="Ghost AI",width=1220,height=790,minWidth=800,minHeight=560)
    data["plugins"].pop("updater",None)
    data["bundle"]["createUpdaterArtifacts"]=False
    data["bundle"]["macOS"]={}
    data["build"].pop("beforeBundleCommand",None)
    p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n")
    p=ROOT/"src-tauri/Cargo.toml"
    s=p.read_text()
    s=re.sub(r'(ghost-ai-agent-core\s*=\s*\{\s*path\s*=\s*")[^"]+',r'\g<1>../vendor/agent/crates/ghost-ai-agent-core',s)
    s=re.sub(r'(?m)^version = "0\.12\.0"$','version = "0.1.0"',s,count=1)
    s=s.replace('authors = ["you"]','authors = ["Brendigo"]')
    p.write_text(s)
    p=ROOT/"index.html"
    s=p.read_text()
    s=re.sub(r'<link rel="icon"[^>]*>','<link rel="icon" type="image/png" href="/ghost-ai-icon.png" />',s)
    p.write_text(s)

def assets():
    p=ROOT/"brand"
    p.mkdir(exist_ok=True)
    (p/"logo.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop stop-color="#00E5FF"/><stop offset=".57" stop-color="#388FFF"/>
<stop offset="1" stop-color="#874CFF"/></linearGradient></defs>
<rect width="512" height="512" rx="106" fill="#080F1A"/>
<path d="M104 378 C116 255 153 123 266 91 C345 70 412 128 408 217
 C405 267 375 320 355 363 L322 334 L287 398 L244 348 L190 416 L169 330 Z" fill="url(#g)"/>
<path d="M151 345 C172 233 211 160 277 147 C329 137 372 173 364 231
 C358 267 341 293 324 322 L292 294 L259 358 L223 310 Z" fill="#0A1020"/>
<path d="M224 227 Q249 216 269 247 Q252 268 230 250 Z" fill="#EEFAFF"/>
<path d="M300 248 Q323 216 347 223 L341 250 Q319 267 300 248" fill="#EEFAFF"/>
</svg>''')
    (p/"banner.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420">
<defs><linearGradient id="g"><stop stop-color="#00E5FF"/><stop offset="1" stop-color="#874CFF"/></linearGradient></defs>
<rect width="1200" height="420" rx="28" fill="#080F1A"/>
<path d="M-20 345 C275 135 401 545 730 218 S1030 177 1240 20" stroke="url(#g)" fill="none" stroke-width="3" opacity=".65"/>
<circle cx="123" cy="139" r="62" fill="#17243B"/><path d="M91 171 C98 115 123 93 153 104 C175 114 165 144 152 160 L140 143 L119 179 Z" fill="url(#g)"/>
<text x="222" y="168" fill="#E5E7EB" font-family="Arial" font-size="76" font-weight="700">Ghost AI</text>
<text x="75" y="264" fill="#E5E7EB" font-family="Arial" font-size="39" font-weight="600">Your AI. Your desktop.</text>
<text x="77" y="323" fill="#B3C1DC" font-family="Arial" font-size="25">Chat · Create · Analyze · Automate</text>
<text x="77" y="380" fill="#00E5FF" font-family="Arial" font-size="22">Ghost AI by Brendigo</text>
</svg>''')
    (p/"BRAND_GUIDELINES.md").write_text("# Ghost AI\n\nBrand: Ghost AI by Brendigo.\n\nDark background: #080F1A.\nSurface: #111827.\nCyan: #00E5FF.\nViolet: #874CFF.\nText: #E5E7EB.\n\nIllustrations are concepts, not real application screenshots.\n")
    icons=ROOT/"src-tauri/icons"
    if icons.exists():
        shutil.rmtree(icons)
    for name in ["public/ghost-ai-icon.png","src/assets/app-icon.png"]:
        f=ROOT/name
        if f.exists():
            f.unlink()

def docs():
    legal=ROOT/"legal"
    legal.mkdir(exist_ok=True)
    shutil.copyfile(CORE/"LICENSE",legal/"DESKTOP_APACHE_2.0.txt")
    shutil.copyfile(AGENT/"LICENSE",legal/"AGENT_APACHE_2.0.txt")
    (legal/"THIRD_PARTY_NOTICES.md").write_text(
        "# Required third-party attributions\n\nGhost AI includes Apache 2.0 licensed code originally published in:\n"
        "- chatshellapp/chatshell-desktop\n- chatshellapp/chatshell-agent\n\n"
        "These credits and original license texts must be preserved. They do not imply endorsement.\n")
    (ROOT/"README.md").write_text('''<p align="center"><img src="brand/banner.svg" width="100%" alt="Ghost AI"></p>

<p align="center"><b>One desktop. Infinite possibilities.</b><br>
Your AI-powered desktop workspace for chat, research, documents, coding and creation.</p>

<p align="center"><img src="https://img.shields.io/badge/Ghost_AI-v0.1.0-874CFF">
<img src="https://img.shields.io/badge/Tauri-2-00E5FF">
<img src="https://img.shields.io/badge/Backend-Rust-111827">
<img src="https://img.shields.io/badge/Frontend-TypeScript-111827"></p>

## Your work, powered by AI

Ghost AI brings powerful cloud and local models to one focused desktop experience.
Discover ideas, ask questions, analyze documents and take control of your workflow.

### Features

- Multiple cloud and locally hosted AI models
- Conversation history and advanced search
- File and document analysis
- Research and developer tools
- AI assistants and MCP integrations
- Privacy-conscious permissions and local data storage
- Responsive Tauri desktop application

## The Ghost AI experience

<p align="center"><img src="brand/logo.svg" width="160" alt="Ghost AI icon"></p>

Designed for clarity with dark surfaces, glowing cyan and violet accents,
accessible controls and responsive windows.

Graphics are brand concepts, not verified app screenshots. Actual screen captures
will be added after release verification.

## Download

See [Ghost AI releases](https://github.com/bren-wp/Ghost-AI/releases).
Windows is the first priority. Other platforms follow validation.
Release assets are published only after build checks succeed.

## Security & privacy

Conversation history is stored locally. Cloud models process submitted prompts under
their own policies. Sensitive tool actions and credentials require explicit review.

## License and credits

Ghost AI branding and Brendigo-owned contributions are covered by this repository's
MIT license where applicable. Third-party Apache-2.0 software and mandatory credits
are retained in [legal](legal/THIRD_PARTY_NOTICES.md).

**Ghost AI by Brendigo.**
''')

def main():
    if not (CORE/"src-tauri/Cargo.toml").exists() or not (AGENT/"Cargo.toml").exists():
        raise SystemExit("Missing pinned upstream sources")
    copy_into(CORE,ROOT,{".git",".github","LICENSE","README.md","CHANGELOG.md","docs","node_modules"})
    copy_into(AGENT,ROOT/"vendor/agent",{".git",".github","README.md"})
    migrate()
    configure()
    assets()
    docs()
    print("Ghost AI 0.1.0 source imported")

if __name__=="__main__":
    main()
