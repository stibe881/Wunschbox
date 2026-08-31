# -*- coding: utf-8 -*-
"""Verkleinert die aufgenommenen PNG und legt sie als WebP nach docs/bilder/.

    pip install Pillow
    python3 docs/quelle/bilder-verkleinern.py

Telefonbilder werden auf 460 px Breite gebracht, Portalbilder auf 1120 px.
Das reicht für Bildschirm und Druck und hält die Handbücher unter zwei Megabyte.
"""
import glob
import os

from PIL import Image

QUELLE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'bilder', 'roh')
ZIEL = os.path.dirname(QUELLE)

gesamt = 0
for datei in sorted(glob.glob(os.path.join(QUELLE, '*.png'))):
    name = os.path.basename(datei)[:-4]
    bild = Image.open(datei).convert('RGB')
    breite = 460 if name.startswith(('app-', 'kri-03', 'kri-04')) else 1120
    if bild.width > breite:
        bild = bild.resize((breite, round(bild.height * breite / bild.width)), Image.LANCZOS)
    pfad = os.path.join(ZIEL, name + '.webp')
    bild.save(pfad, 'WEBP', quality=86, method=6)
    gesamt += os.path.getsize(pfad)
    print(f'{name:42s} {bild.width}x{bild.height}  {os.path.getsize(pfad) // 1024} KB')

print('\nGesamt: %.1f MB' % (gesamt / 1024 / 1024))
