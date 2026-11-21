#!/usr/bin/env python3
"""Generate the official Ghost AI Windows installer artwork from original brand assets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "src-tauri" / "windows"
ART.mkdir(parents=True, exist_ok=True)
LOGO = Image.open(ROOT / "brand" / "icon-1024.png").convert("RGBA")

def font(px: int, strong: bool = False):
    fonts = [
        "C:/Windows/Fonts/segoeuib.ttf" if strong else "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if strong else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for name in fonts:
        try:
            return ImageFont.truetype(name, px)
        except OSError:
            pass
    return ImageFont.load_default()

def background(w: int, h: int):
    canvas = Image.new("RGB", (w, h))
    data = canvas.load()
    for y in range(h):
        for x in range(w):
            t = x / max(1, w-1)
            v = y / max(1, h-1)
            data[x, y] = (
                int(8 + 20*t + 7*v),
                int(15 + 20*t),
                int(26 + 41*t + 20*v),
            )
    return canvas

def put_logo(base: Image.Image, x: int, y: int, size: int):
    icon = LOGO.resize((size, size), Image.Resampling.LANCZOS)
    base.paste(icon, (x, y), icon)

def make_header():
    canvas = background(150, 57)
    draw = ImageDraw.Draw(canvas)
    put_logo(canvas, 5, 5, 45)
    draw.text((54, 8), "Ghost AI", font=font(16, True), fill=(243, 247, 255))
    draw.text((54, 30), "by Brendigo", font=font(9), fill=(103, 233, 250))
    canvas.save(ART / "installer-header.bmp", "BMP")

def make_sidebar():
    canvas = background(164, 314)
    draw = ImageDraw.Draw(canvas)
    put_logo(canvas, 22, 65, 120)
    draw.text((27, 205), "Ghost AI", font=font(22, True), fill=(243, 247, 255))
    draw.line(((27, 245), (135, 245)), fill=(0, 229, 255), width=2)
    draw.text((29, 267), "by Brendigo", font=font(12), fill=(162, 174, 212))
    canvas.save(ART / "installer-sidebar.bmp", "BMP")

make_header()
make_sidebar()
print("Ghost AI installer graphics generated.")
