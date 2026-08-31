/**
 * Erzeugt aus den Handbüchern druckfertige PDF im Corporate Design.
 *
 *   node docs/quelle/pdf-erzeugen.mjs        -> docs/handbuch-*.pdf
 *
 * Kopf- und Fusszeile kommen nicht aus dem HTML: Chrome legt fest
 * positionierte Elemente beim Drucken nicht in den Seitenrand, sondern über
 * den Text. Chromes eigene headerTemplate/footerTemplate dagegen sitzen genau
 * dort, wo sie hingehören – deshalb entstehen Logo oben und Adresse unten
 * hier und nicht im Stylesheet.
 *
 * Seitenmasse nach der Word-Vorlage: A4, Ränder oben/links/rechts 25 mm,
 * unten 20 mm; für Logo und Adresse kommt je ein Streifen dazu.
 */
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const BROWSER = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium'
const DOCS = new URL('../', import.meta.url).pathname
const HANDBUECHER = ['handbuch-1-administration', 'handbuch-2-krisenstab', 'handbuch-3-mitarbeitende']

const HAUS = '#1c504b'
const logo = 'data:image/png;base64,' + readFileSync(DOCS + 'bilder/logo-sonnenberg.png').toString('base64')

/** Kleines Logo links oben – wie auf den Folgeseiten der Word-Vorlage. */
const kopf = `<div style="width:100%;padding:0 25mm;-webkit-print-color-adjust:exact">
  <img src="${logo}" style="width:46mm;display:block">
</div>`

/** Adressblock zweispaltig, dazu die Seitenzahl rechts. */
const fuss = `<div style="width:100%;padding:0 25mm;font-family:'Segoe UI',sans-serif;font-size:7pt;
     color:${HAUS};-webkit-print-color-adjust:exact;display:flex;justify-content:space-between;align-items:flex-end">
  <table style="border-collapse:collapse;font-size:7pt;color:${HAUS}">
    <tr><td style="padding:0 26px 0 0;font-weight:700">SONNENBERG</td><td>T +41 41 767 78 33</td></tr>
    <tr><td style="padding:0 26px 0 0">Landhausstrasse 20</td><td>info@sonnenberg-baar.ch</td></tr>
    <tr><td style="padding:0 26px 0 0">6340 Baar</td><td>www.sonnenberg-baar.ch</td></tr>
  </table>
  <span style="font-size:8pt"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`

const RAND = { top: '36mm', right: '25mm', bottom: '32mm', left: '25mm' }

const b = await chromium.launch({ executablePath: BROWSER })
for (const name of HANDBUECHER) {
  const p = await b.newPage()
  await p.goto(`file://${DOCS}${name}.html`, { waitUntil: 'networkidle' })
  await p.emulateMedia({ media: 'print', colorScheme: 'light' })
  await p.waitForTimeout(1500)

  // Chrome setzt Kopf- und Fusszeile auf jede Seite, auch auf die Titelseite –
  // dort trägt aber schon das grosse Logo. Also zweimal drucken: die Titelseite
  // ohne, den Rest mit, und beides zusammenfügen. Die Seitenzahlen im zweiten
  // Durchgang stimmen dabei von selbst, weil er das ganze Dokument umfasst.
  const nurTitel = `${tmpdir()}/${name}-titel.pdf`
  const mitKopf = `${tmpdir()}/${name}-rest.pdf`

  await p.addStyleTag({ content: '@media print { nav.inhalt, main, footer { display: none !important } }' })
  await p.pdf({ path: nurTitel, format: 'A4', printBackground: true, margin: RAND })

  await p.reload({ waitUntil: 'networkidle' })
  await p.emulateMedia({ media: 'print', colorScheme: 'light' })
  await p.waitForTimeout(1500)
  await p.pdf({
    path: mitKopf, format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: kopf, footerTemplate: fuss, margin: RAND,
  })

  const seiten = await entferneErsteSeite(mitKopf)
  execFileSync('pdfunite', [nurTitel, seiten, `${DOCS}${name}.pdf`])
  for (const f of [nurTitel, mitKopf, seiten]) rmSync(f, { force: true })
  console.log('✓', name + '.pdf')
  await p.close()
}
await b.close()

/** Erste Seite abschneiden – sie wird durch die Titelseite ohne Kopfzeile ersetzt. */
async function entferneErsteSeite(pfad) {
  const anzahl = Number(execFileSync('pdfinfo', [pfad]).toString().match(/Pages:\s+(\d+)/)[1])
  const ziel = pfad.replace(/\.pdf$/, '-ab2.pdf')
  execFileSync('pdfseparate', ['-f', '2', '-l', String(anzahl), pfad, pfad.replace(/\.pdf$/, '-%d.pdf')])
  const teile = []
  for (let i = 2; i <= anzahl; i++) teile.push(pfad.replace(/\.pdf$/, `-${i}.pdf`))
  execFileSync('pdfunite', [...teile, ziel])
  for (const f of teile) rmSync(f, { force: true })
  return ziel
}
