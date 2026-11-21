#!/usr/bin/env python3
# Ghost AI by Brendigo
"""Render the vector Ghost AI identity into app icons and splash assets."""
from pathlib import Path
import shutil
import cairosvg

root=Path(__file__).resolve().parents[1]
logo=root/"brand/logo.svg"
out=root/"brand/icon-1024.png"
cairosvg.svg2png(url=str(logo),write_to=str(out),output_width=1024,output_height=1024)
shutil.copyfile(out,root/"src/assets/app-icon.png")
shutil.copyfile(out,root/"public/ghost-ai-icon.png")
print("Created original Ghost AI desktop art assets.")
