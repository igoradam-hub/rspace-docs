#!/usr/bin/env python3
"""Compress screenshots to <500KB using Pillow.
- Keeps PNG format
- Downscales from 2x to 1x (which is enough for markdown rendering)
- Re-saves with optimize=True
"""
import os
import sys
from pathlib import Path
from PIL import Image

TARGET_KB = 500
MAX_WIDTH = 1440  # 1x landing width

def compress(path):
    img = Image.open(path)
    w, h = img.size
    if w > MAX_WIDTH:
        new_h = int(h * MAX_WIDTH / w)
        img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
    # Convert RGBA->RGB if no transparency needed (saves bytes)
    if img.mode == 'RGBA':
        # Check if alpha channel is uniform (all 255)
        alpha = img.getchannel('A')
        if alpha.getextrema() == (255, 255):
            img = img.convert('RGB')
    tmp = str(path) + '.tmp.png'
    img.save(tmp, 'PNG', optimize=True)
    before = os.path.getsize(path)
    after = os.path.getsize(tmp)
    if after < before:
        os.replace(tmp, path)
        print(f"  {path.name}: {before//1024}KB -> {after//1024}KB")
    else:
        os.remove(tmp)
        print(f"  {path.name}: skipped ({before//1024}KB)")

def main():
    base = Path(sys.argv[1] if len(sys.argv) > 1 else '/sessions/modest-compassionate-ride/mnt/rspace/rspace-docs/assets/screenshots')
    for png in sorted(base.rglob('*.png')):
        compress(png)

if __name__ == '__main__':
    main()
