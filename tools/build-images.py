#!/usr/bin/env python3
"""Generuje WebP i AVIF w 3 rozmiarach (800 / 1400 / 2200 px) dla zdjęć z assets/img.
Uruchom ponownie po podmianie zdjęć na większe: python3 tools/build-images.py
Wymaga: pip install pillow (>= 11, z obsługą AVIF)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "assets" / "img"
PHOTOS = ["hero-stadion.jpg", "o-nas-biznes.png", "o-nas-sport.png",
          "dla-kogo-przemiana.png", "pasek-sportowiec.png"]
SIZES = [800, 1400, 2200]

for name in PHOTOS:
    src = ROOT / name
    im = Image.open(src).convert("RGB")
    for w in SIZES:
        # Zawsze dokładnie 800 / 1400 / 2200 px, żeby srcset w index.html się zgadzał.
        # Zdjęcia mniejsze niż 2200 px są na razie powiększane; po podmianie na większe uruchom skrypt ponownie.
        tw = w
        th = round(im.height * tw / im.width)
        out = im.resize((tw, th), Image.LANCZOS) if tw != im.width else im
        stem = ROOT / f"{src.stem}-{w}"
        out.save(f"{stem}.webp", "WEBP", quality=78, method=6)
        out.save(f"{stem}.avif", "AVIF", quality=55, speed=6)
        print(f"{stem.name}: {tw}x{th}")
