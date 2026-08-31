# -*- coding: utf-8 -*-
"""Gemeinsame Hülle und Gestaltung der drei Handbücher."""

STIL = """
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<style>
:root {
  --akzent: $akzent;
  --akzent-tief: $akzent_tief;
  --akzent-hauch: $akzent_hauch;
  --grund: $grund;
  --flaeche: #ffffff;
  --flaeche-still: $flaeche_still;
  --tinte: $tinte;
  --tinte-leise: $tinte_leise;
  --tinte-fein: $tinte_fein;
  --linie: $linie;
  --linie-stark: $linie_stark;
  --gut: #0f7051;
  --warnung: #9a5b06;
  --stopp: #b4232b;
  --rahmen-geraet: $rahmen_geraet;

  --serif: "Source Serif 4", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --grotesk: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --mass: 66ch;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --akzent: $d_akzent;
    --akzent-tief: $d_akzent_tief;
    --akzent-hauch: $d_akzent_hauch;
    --grund: $d_grund;
    --flaeche: $d_flaeche;
    --flaeche-still: $d_flaeche_still;
    --tinte: $d_tinte;
    --tinte-leise: $d_tinte_leise;
    --tinte-fein: $d_tinte_fein;
    --linie: $d_linie;
    --linie-stark: $d_linie_stark;
    --gut: #3fbc8d;
    --warnung: #d9a441;
    --stopp: #f2696e;
    --rahmen-geraet: $d_rahmen_geraet;
  }
}
:root[data-theme="dark"] {
  --akzent: $d_akzent;
  --akzent-tief: $d_akzent_tief;
  --akzent-hauch: $d_akzent_hauch;
  --grund: $d_grund;
  --flaeche: $d_flaeche;
  --flaeche-still: $d_flaeche_still;
  --tinte: $d_tinte;
  --tinte-leise: $d_tinte_leise;
  --tinte-fein: $d_tinte_fein;
  --linie: $d_linie;
  --linie-stark: $d_linie_stark;
  --gut: #3fbc8d;
  --warnung: #d9a441;
  --stopp: #f2696e;
  --rahmen-geraet: $d_rahmen_geraet;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--grund);
  color: var(--tinte);
  font-family: var(--serif);
  font-size: 17.5px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}

.blatt { max-width: 980px; margin: 0 auto; padding: 0 28px 96px; }

/* ---------- Titelblatt ---------- */
.titelblatt { padding: 72px 0 40px; border-bottom: 3px solid var(--akzent); }
.marke {
  font-family: var(--grotesk); font-weight: 700; font-size: 12px;
  letter-spacing: .16em; text-transform: uppercase; color: var(--akzent);
  display: flex; align-items: center; gap: 10px;
}
.marke::after { content: ""; flex: 1; height: 1px; background: var(--linie-stark); }
.titelblatt h1 {
  font-family: var(--grotesk); font-weight: 700;
  font-size: clamp(38px, 6.2vw, 62px); line-height: 1.03;
  letter-spacing: -.025em; margin: 22px 0 0; text-wrap: balance;
}
.titelblatt .fuer {
  font-family: var(--grotesk); font-weight: 600;
  font-size: clamp(19px, 2.4vw, 24px); color: var(--akzent);
  margin: 10px 0 0; letter-spacing: -.01em;
}
.vorspann { max-width: var(--mass); margin: 26px 0 0; font-size: 19px; color: var(--tinte-leise); }
.stand {
  font-family: var(--grotesk); font-size: 12.5px; letter-spacing: .05em;
  color: var(--tinte-fein); margin-top: 30px; display: flex; flex-wrap: wrap; gap: 6px 22px;
}

/* ---------- Inhaltsverzeichnis ---------- */
.inhalt { padding: 34px 0 4px; border-bottom: 1px solid var(--linie); }
.inhalt h2 {
  font-family: var(--grotesk); font-size: 11.5px; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase; color: var(--tinte-fein);
  margin: 0 0 16px;
}
.inhalt ol { list-style: none; margin: 0; padding: 0; max-width: none; display: grid; gap: 0 40px; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); }
.inhalt a {
  font-family: var(--grotesk); font-size: 15px; font-weight: 500;
  color: var(--tinte); text-decoration: none;
  display: flex; gap: 12px; align-items: baseline; padding: 7px 8px 7px 0;
  border-bottom: 1px solid var(--linie);
}
.inhalt a:hover, .inhalt a:focus-visible { color: var(--akzent); }
.inhalt .zahl { font-variant-numeric: tabular-nums; color: var(--akzent); font-weight: 700; min-width: 1.6em; }

/* ---------- Abschnitte ---------- */
section { padding-top: 56px; scroll-margin-top: 24px; }
h2.abschnitt {
  font-family: var(--grotesk); font-weight: 700;
  font-size: clamp(25px, 3.2vw, 33px); letter-spacing: -.02em;
  margin: 0 0 6px; display: flex; gap: 16px; align-items: baseline; text-wrap: balance;
}
h2.abschnitt .zahl {
  color: var(--akzent); font-variant-numeric: tabular-nums;
  font-size: .72em; letter-spacing: 0;
}
h3 {
  font-family: var(--grotesk); font-weight: 600; font-size: 20px;
  letter-spacing: -.012em; margin: 40px 0 8px; text-wrap: balance;
}
h4 {
  font-family: var(--grotesk); font-weight: 600; font-size: 15.5px;
  margin: 26px 0 4px; color: var(--tinte);
}
p, ul, ol { max-width: var(--mass); }
p { margin: 0 0 14px; }
ul, ol { margin: 0 0 16px; padding-left: 1.35em; }
li { margin-bottom: 7px; }
li::marker { color: var(--akzent); }
strong { font-weight: 600; }
a { color: var(--akzent-tief); }
code {
  font-family: var(--grotesk); font-weight: 600; font-size: .88em;
  background: var(--flaeche-still); border: 1px solid var(--linie);
  padding: .06em .38em; border-radius: 3px; letter-spacing: .01em;
}

/* Beschriftung eines Bedienelements aus der Anwendung */
.ui {
  font-family: var(--grotesk); font-weight: 600; font-size: .87em;
  letter-spacing: .005em; color: var(--tinte);
  border-bottom: 2px solid var(--akzent-hauch); padding-bottom: .04em;
  white-space: nowrap;
}

/* ---------- Schrittfolgen ---------- */
ol.schritte { list-style: none; padding: 0; counter-reset: schritt; max-width: var(--mass); }
ol.schritte > li {
  counter-increment: schritt; position: relative;
  padding: 0 0 16px 46px; margin: 0;
}
ol.schritte > li::before {
  content: counter(schritt); position: absolute; left: 0; top: 1px;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--akzent); color: #fff;
  font-family: var(--grotesk); font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  font-variant-numeric: tabular-nums;
}

/* ---------- Hinweiskästen ---------- */
.hinweis {
  max-width: var(--mass); margin: 22px 0; padding: 16px 20px;
  background: var(--flaeche-still); border-left: 3px solid var(--akzent);
  border-radius: 0 3px 3px 0;
}
.hinweis > :last-child { margin-bottom: 0; }
.hinweis .marke-klein {
  font-family: var(--grotesk); font-weight: 700; font-size: 11px;
  letter-spacing: .14em; text-transform: uppercase;
  color: var(--akzent); margin: 0 0 6px;
}
.hinweis--stopp { border-left-color: var(--stopp); }
.hinweis--stopp .marke-klein { color: var(--stopp); }
.hinweis--warnung { border-left-color: var(--warnung); }
.hinweis--warnung .marke-klein { color: var(--warnung); }
.hinweis--gut { border-left-color: var(--gut); }
.hinweis--gut .marke-klein { color: var(--gut); }

/* ---------- Abbildungen ---------- */
figure { margin: 26px 0; }
figure img { display: block; width: 100%; height: auto; }
figcaption {
  font-family: var(--grotesk); font-size: 12.5px; line-height: 1.5;
  color: var(--tinte-fein); margin-top: 9px; max-width: 62ch;
}
figcaption b {
  font-weight: 700; color: var(--akzent);
  font-variant-numeric: tabular-nums; letter-spacing: .04em;
}
.bild-breit img { border: 1px solid var(--linie-stark); border-radius: 4px; }
/* Erst ausbrechen, wenn dafür wirklich Platz ist - sonst schiebt die Seite seitlich. */
@media (min-width: 1130px) {
  .bild-breit { margin-left: -60px; margin-right: -60px; }
  .bild-breit figcaption { margin-left: 60px; }
}

.geraet { max-width: 300px; }
.geraet img {
  border: 8px solid var(--rahmen-geraet); border-radius: 26px;
  box-shadow: 0 1px 2px rgba(0,0,0,.14);
}
.geraet-reihe {
  display: grid; gap: 30px; margin: 28px 0;
  grid-template-columns: repeat(auto-fill, minmax(240px, 300px));
  justify-content: start;
}
.geraet-reihe figure { margin: 0; }

/* ---------- Tabellen ---------- */
.tabelle-huelle { overflow-x: auto; margin: 22px 0; }
table { border-collapse: collapse; width: 100%; min-width: 480px; font-size: 15.5px; }
caption {
  font-family: var(--grotesk); font-size: 12px; font-weight: 700;
  letter-spacing: .13em; text-transform: uppercase; color: var(--tinte-fein);
  text-align: left; padding-bottom: 10px;
}
th, td { text-align: left; padding: 10px 14px 10px 0; border-bottom: 1px solid var(--linie); vertical-align: top; }
th {
  font-family: var(--grotesk); font-weight: 700; font-size: 12px;
  letter-spacing: .1em; text-transform: uppercase; color: var(--tinte-fein);
  border-bottom: 1px solid var(--linie-stark);
}
td.ja { color: var(--gut); font-family: var(--grotesk); font-weight: 600; font-size: 14px; }
td.nein { color: var(--tinte-fein); font-family: var(--grotesk); font-weight: 600; font-size: 14px; }

/* ---------- Fusszeile ---------- */
footer {
  margin-top: 80px; padding-top: 26px; border-top: 3px solid var(--akzent);
  font-family: var(--grotesk); font-size: 13px; color: var(--tinte-fein);
}
footer p { max-width: var(--mass); margin-bottom: 8px; }

:focus-visible { outline: 2px solid var(--akzent); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }

@media (max-width: 720px) {
  body { font-size: 16.5px; }
  .blatt { padding: 0 18px 64px; }
  h2.abschnitt { flex-direction: column; gap: 2px; }
}

@media print {
  :root {
    --grund: #fff; --flaeche: #fff; --flaeche-still: #f4f4f2;
    --tinte: #000; --tinte-leise: #222; --tinte-fein: #555;
    --linie: #ccc; --linie-stark: #999; --rahmen-geraet: #ddd;
  }
  body { font-size: 10.5pt; }
  .blatt { max-width: none; padding: 0; }
  .titelblatt { padding-top: 0; }
  .inhalt { break-after: page; }
  section { break-before: auto; padding-top: 18px; }
  h2.abschnitt, h3, h4 { break-after: avoid; }
  /* Auf Papier gibt es kein vw - die Nummer bliebe sonst allein auf einer Zeile. */
  h2.abschnitt { display: block; font-size: 17pt; }
  h2.abschnitt .zahl { font-size: 1em; margin-right: .45em; }
  h3 { font-size: 12.5pt; margin-top: 20px; }
  h4 { font-size: 11pt; }
  p, li { orphans: 2; widows: 2; }
  .hinweis, .tabelle-huelle, ol.schritte > li, figcaption { break-inside: avoid; }
  figure { break-inside: avoid; margin: 14px 0; }
  /* Bildhöhe begrenzen, sonst reisst jede Abbildung eine halbe Leerseite auf. */
  .bild-breit { margin: 16px 0; max-width: 148mm; }
  .geraet { max-width: 56mm; }
  .geraet-reihe { grid-template-columns: repeat(auto-fill, 56mm); gap: 8mm; margin: 16px 0; }
  .geraet img { border-width: 4px; border-radius: 12px; box-shadow: none; }
  a { color: #000; text-decoration: none; }
}
</style>
"""

PALETTEN = {
  'rot': dict(
    akzent='#c81e1e', akzent_tief='#a31616', akzent_hauch='#f3c9c9',
    grund='#f8f6f5', flaeche_still='#f2eeed', tinte='#1c1817',
    tinte_leise='#4d4442', tinte_fein='#847673', linie='#e4dcda', linie_stark='#c8bbb8',
    rahmen_geraet='#e0d6d4',
    d_akzent='#f0777a', d_akzent_tief='#f7a4a6', d_akzent_hauch='#6b2b2c',
    d_grund='#171313', d_flaeche='#211b1b', d_flaeche_still='#241d1d',
    d_tinte='#efe8e6', d_tinte_leise='#c3b6b3', d_tinte_fein='#968784',
    d_linie='#332a29', d_linie_stark='#4a3d3c', d_rahmen_geraet='#3a2f2e'),
  'violett': dict(
    akzent='#6b3fbd', akzent_tief='#57309e', akzent_hauch='#d4c6ee',
    grund='#f7f6fa', flaeche_still='#f0edf6', tinte='#1a1722',
    tinte_leise='#48425a', tinte_fein='#7d7591', linie='#e2dceb', linie_stark='#c5bad6',
    rahmen_geraet='#ded6ec',
    d_akzent='#b294f0', d_akzent_tief='#c9b2f6', d_akzent_hauch='#43307a',
    d_grund='#141320', d_flaeche='#1d1b2b', d_flaeche_still='#211f31',
    d_tinte='#ebe8f2', d_tinte_leise='#b8b1c9', d_tinte_fein='#8a83a0',
    d_linie='#2c2940', d_linie_stark='#413c5c', d_rahmen_geraet='#332f4a'),
  'petrol': dict(
    akzent='#0d6d6a', akzent_tief='#0a5654', akzent_hauch='#b3dbd9',
    grund='#f4f7f7', flaeche_still='#eaf1f0', tinte='#131b1b',
    tinte_leise='#3d4c4b', tinte_fein='#6f8180', linie='#dae5e4', linie_stark='#b9cbc9',
    rahmen_geraet='#d3e2e0',
    d_akzent='#4fbfb8', d_akzent_tief='#7cd4ce', d_akzent_hauch='#144f4c',
    d_grund='#101717', d_flaeche='#182222', d_flaeche_still='#1b2727',
    d_tinte='#e6eeed', d_tinte_leise='#adc0be', d_tinte_fein='#7f9391',
    d_linie='#243333', d_linie_stark='#365049', d_rahmen_geraet='#2a3b3a'),
}


def seite(titel, palette, koerper):
    from string import Template
    return f"<title>{titel}</title>\n" + Template(STIL).substitute(PALETTEN[palette]) + "\n" + koerper
