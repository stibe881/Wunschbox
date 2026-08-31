# Benutzerhandbücher

Drei Handbücher, je eines pro Rolle. Jedes ist eine einzelne HTML-Datei, die
sich im Browser öffnen und über «Drucken» als PDF sichern lässt.

| Datei | Für wen | Umfang |
| --- | --- | --- |
| [`handbuch-1-administration.html`](handbuch-1-administration.html) | Schulleitung, Systemverantwortliche | Portal und App, 15 Abschnitte |
| [`handbuch-2-krisenstab.html`](handbuch-2-krisenstab.html) | Krisenstabsmitglieder | Portal und App, 11 Abschnitte |
| [`handbuch-3-mitarbeitende.html`](handbuch-3-mitarbeitende.html) | alle Mitarbeitenden | nur App, 11 Abschnitte |

Die Bildschirmfotos liegen in `bilder/` und stammen aus dem Demo-Modus – dort
sind keine echten Personendaten sichtbar.

## Neu erzeugen

Der Text steht in `quelle/handbuch1.py` bis `quelle/handbuch3.py`, die
gemeinsame Gestaltung in `quelle/schale.py`.

```bash
python3 docs/quelle/bauen.py
```

Für eine Fassung, die sich als einzelne Datei weitergeben lässt (Bilder
eingebettet, kein Ordner nötig):

```bash
python3 docs/quelle/bauen.py /pfad/zum/zielordner
```

## Bildschirmfotos neu aufnehmen

Nötig, sobald sich die Oberfläche ändert. Das Portal muss dafür laufen.

```bash
npm run dev                                   # in einem eigenen Fenster
node docs/quelle/bilder-aufnehmen.mjs         # -> docs/bilder/roh/*.png
python3 docs/quelle/bilder-verkleinern.py     # -> docs/bilder/*.webp
python3 docs/quelle/bauen.py
```

Das Skript meldet sich der Reihe nach als Administrator, Krisenstabsmitglied und
Mitarbeiterin an und klickt die Abläufe durch. Es braucht `playwright-core` und
einen Chromium; die Adresse des Portals lässt sich mit `SOBE_URL`, der Pfad zum
Browser mit `PLAYWRIGHT_CHROMIUM` vorgeben.

Die vier Live-Bilder (`web-21` bis `web-24`) zeigen Zustände, die es nur gegen
einen laufenden Alarmserver gibt: Erstinbetriebnahme, erzwungener
Passwortwechsel, Live-Dashboard und der Dialog «Aktualisierung». Sie entstehen
von Hand gegen einen frisch aufgesetzten Server und ändern sich selten.
