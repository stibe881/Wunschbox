/**
 * Nimmt alle Bildschirmfotos für die Handbücher auf.
 *
 * Voraussetzung: Das Portal läuft (npm run dev) und Playwright ist verfügbar.
 *
 *   npm run dev                       # in einem eigenen Fenster
 *   node docs/quelle/bilder-aufnehmen.mjs
 *
 * Die Bilder landen als PNG in docs/bilder/roh/ und werden anschliessend
 * von docs/quelle/bilder-verkleinern.py als WebP nach docs/bilder/ gelegt.
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASIS = process.env.SOBE_URL ?? 'http://127.0.0.1:5173'
const BROWSER = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium'
const ZIEL = new URL('../bilder/roh/', import.meta.url).pathname
const TELEFON = { viewport: { width: 414, height: 896 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
const RECHNER = { viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 }

mkdirSync(ZIEL, { recursive: true })

async function schuss(p, name, warten = 700) {
  await p.waitForTimeout(warten)
  await p.screenshot({ path: ZIEL + name + '.png' })
  console.log('  ✓', name)
}

async function anmelden(p, mail, passwort = 'sobe2026') {
  await p.goto(BASIS + '/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  if (await p.locator('input[type=password]').count()) {
    await p.locator('input[type=email], input[type=text]').first().fill(mail)
    await p.locator('input[type=password]').first().fill(passwort)
    await p.getByRole('button', { name: 'Anmelden' }).click()
    await p.waitForTimeout(1200)
  }
}

async function abmelden(p) {
  await p.goto(BASIS + '/#/app', { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: 'Profil' }).click()
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: /Abmelden/i }).click()
  await p.waitForTimeout(1200)
}

/** Auslösende Knöpfe reagieren erst nach gut einer Sekunde Halten. */
async function halten(p, ziel) {
  const k = await ziel.boundingBox()
  await p.mouse.move(k.x + k.width / 2, k.y + k.height / 2)
  await p.mouse.down()
  await p.waitForTimeout(1700)
  await p.mouse.up()
  await p.waitForTimeout(900)
}

const b = await chromium.launch({ executablePath: BROWSER })

// ---------------------------------------------------------------- Portal
{
  const ctx = await b.newContext(RECHNER)
  const p = await ctx.newPage()
  await p.goto(BASIS + '/', { waitUntil: 'networkidle' })
  await schuss(p, 'web-01-anmeldung', 900)
  await anmelden(p, 'stefan.gross@sonnenberg-baar.ch')

  for (const [pfad, name] of [
    ['dashboard', 'web-02-dashboard'], ['alarm', 'web-03-alarm-ausloesen'],
    ['monitor', 'web-04-alarmzentrale'], ['alleinarbeit', 'web-05-alleinarbeit'],
    ['alarmknoepfe', 'web-06-alarmknoepfe'], ['szenarien', 'web-07-szenarien'],
    ['alarmplaene', 'web-08-alarmplaene'], ['benutzer', 'web-09-benutzer'],
    ['gruppen', 'web-10-gruppen'], ['standorte', 'web-11-standorte'],
    ['notfallkontakte', 'web-12-notfallkontakte'], ['integrationen', 'web-13-integrationen'],
    ['protokoll', 'web-14-protokoll'],
  ]) {
    await p.goto(`${BASIS}/#/${pfad}`, { waitUntil: 'networkidle' })
    await schuss(p, name, 900)
  }

  // Ablauf: Alarm vorbereiten, auslösen, in der Alarmzentrale ansehen
  await p.goto(BASIS + '/#/alarm', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.locator('button:visible', { hasText: 'Medizinischer Notfall' }).first().click()
  await schuss(p, 'web-15-alarm-vorbereitet', 800)
  await halten(p, p.getByText('Alarm auslösen', { exact: true }).last())
  await schuss(p, 'web-16-alarm-ausgeloest')
  await p.goto(BASIS + '/#/monitor', { waitUntil: 'networkidle' })
  await schuss(p, 'web-17-alarmzentrale-aktiv', 1200)

  await p.goto(BASIS + '/#/szenarien', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: 'Ansehen' }).first().click()
  await schuss(p, 'web-18-szenario-ansicht', 800)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  await p.locator('button:has(svg.lucide-pencil)').first().click()
  await schuss(p, 'web-19-szenario-editor', 800)
  await p.keyboard.press('Escape')
  await p.goto(BASIS + '/#/benutzer', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: 'Neuer Benutzer' }).click()
  await schuss(p, 'web-20-benutzer-editor', 800)
  await ctx.close()
}

// ------------------------------------------------- Krisenstab und gesperrtes Portal
{
  const ctx = await b.newContext(RECHNER)
  const p = await ctx.newPage()
  await anmelden(p, 'anna.mueller@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/dashboard', { waitUntil: 'networkidle' })
  await schuss(p, 'kri-01-dashboard', 1000)
  await p.goto(BASIS + '/#/alarmplaene', { waitUntil: 'networkidle' })
  await schuss(p, 'kri-02-alarmplaene', 900)
  await ctx.close()

  const ctx2 = await b.newContext({ viewport: { width: 1440, height: 800 }, deviceScaleFactor: 2 })
  const p2 = await ctx2.newPage()
  await anmelden(p2, 'lea.weber@sonnenberg-baar.ch')
  await p2.goto(BASIS + '/#/dashboard', { waitUntil: 'networkidle' })
  await schuss(p2, 'mit-01-kein-portal', 1000)
  await ctx2.close()
}

// ---------------------------------------------------------------- App
{
  const ctx = await b.newContext(TELEFON)
  const p = await ctx.newPage()
  await p.goto(BASIS + '/#/app', { waitUntil: 'networkidle' })
  await schuss(p, 'app-01-anmeldung', 900)

  // Alarm mit Quittierpflicht vorbereiten, damit die Rückmeldeknöpfe erscheinen
  await anmelden(p, 'stefan.gross@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/alarm', { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  await p.locator('button:visible', { hasText: 'Brand / Feuer' }).first().click()
  await p.waitForTimeout(700)
  await p.getByRole('button', { name: /Anpassen/ }).click()
  await p.waitForTimeout(500)
  await p.getByText('Aufgebot mit Quittierfunktion').click()
  await p.waitForTimeout(400)
  await halten(p, p.getByText('Alarm auslösen', { exact: true }).last())
  await abmelden(p)

  await anmelden(p, 'lea.weber@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/app', { waitUntil: 'networkidle' })
  await schuss(p, 'app-02-alarm-empfangen', 900)
  // Wer den Alarm erhält, bekommt einen eigenen Weg - ohne Notruf, ohne Auslösung
  await p.getByRole('button', { name: /Was jetzt zu tun ist/ }).click()
  await schuss(p, 'app-03-empfaenger', 800)
  await p.getByRole('button', { name: 'Ich komme' }).click()
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: 'Start' }).click()
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: 'Szenarien' }).click()
  await schuss(p, 'app-09-szenarienliste', 800)
  await p.getByRole('button', { name: 'Notruf' }).click()
  await schuss(p, 'app-11-notruf', 800)
  await p.getByRole('button', { name: 'Profil' }).click()
  await schuss(p, 'app-12-profil', 800)

  // Knopf oben rechts: Ereignis wählen. Für Brand läuft bereits ein Alarm -
  // die App weist darauf hin, statt stumm einen zweiten auszulösen.
  await p.getByRole('button', { name: 'Alarm auslösen' }).click()
  await schuss(p, 'app-14-alarm-auswahl', 800)
  await p.getByText('Brand / Feuer').first().click()
  await p.waitForTimeout(6000)
  await p.getByText('Für dieses Ereignis läuft bereits ein Alarm').scrollIntoViewIfNeeded()
  await schuss(p, 'app-15-doppelalarm', 800)

  // Entwarnung: Der Krisenstab beendet den Alarm, Lea erhält die zweite Mitteilung
  await abmelden(p)
  await anmelden(p, 'stefan.gross@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/monitor', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: 'Beenden' }).first().click()
  await p.waitForTimeout(600)
  const bestaetigen = p.getByRole('button', { name: /Beenden|Entwarnung/ }).last()
  if (await bestaetigen.isVisible().catch(() => false)) await bestaetigen.click()
  await abmelden(p)
  await anmelden(p, 'lea.weber@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/app', { waitUntil: 'networkidle' })
  await schuss(p, 'app-16-entwarnung-start', 900)
  await p.getByRole('button', { name: /Nächste Schritte/ }).first().click()
  await schuss(p, 'app-17-entwarnung', 800)
  await p.getByRole('button', { name: 'Start' }).click()
  await p.waitForTimeout(600)

  // Geführter Ablauf. Vorher warten, bis die Rückmeldung ausgeblendet ist.
  await p.getByRole('button', { name: 'Szenarien' }).click()
  await p.waitForTimeout(700)
  await p.getByText('Brand / Feuer').first().click()
  await schuss(p, 'app-04-phasenuebersicht', 800)
  await p.getByRole('button', { name: /Geführt starten/ }).click()
  await schuss(p, 'app-05-phase1-alarmieren', 6000)
  await p.mouse.wheel(0, 700)
  await schuss(p, 'app-05b-phase1-unten', 800)
  await p.getByRole('button', { name: 'Weiter', exact: true }).click()
  await p.waitForTimeout(900)
  await p.mouse.wheel(0, -900)
  await schuss(p, 'app-06-phase2-sofortmassnahmen', 800)
  await p.getByRole('button', { name: 'Weiter', exact: true }).click()
  await p.waitForTimeout(900)
  await p.mouse.wheel(0, -900)
  await schuss(p, 'app-07-phase3-informieren', 800)
  await p.getByRole('button', { name: 'Weiter', exact: true }).click()
  await p.waitForTimeout(900)
  await p.mouse.wheel(0, -1200)
  await schuss(p, 'app-08-phase4-weitere', 800)
  await p.mouse.wheel(0, 1000)
  await schuss(p, 'app-08b-checkliste', 800)
  const rg = p.getByText('Rechtsgrundlagen').first()
  await rg.scrollIntoViewIfNeeded()
  await rg.click()
  await p.waitForTimeout(600)
  await rg.scrollIntoViewIfNeeded()
  await schuss(p, 'app-08c-rechtsgrundlagen', 700)
  await ctx.close()
}

// ------------------------------------------- App ohne Alarm, SOS, Alleinarbeit
{
  const ctx = await b.newContext(TELEFON)
  const p = await ctx.newPage()
  await anmelden(p, 'lea.weber@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/app', { waitUntil: 'networkidle' })
  await schuss(p, 'app-00-start-leer', 900)
  await p.getByRole('button', { name: 'Alleinarbeit' }).click()
  await schuss(p, 'app-10-alleinarbeit', 700)
  await p.getByPlaceholder(/Tätigkeit/).fill('Abendrundgang Therapietrakt')
  await p.getByRole('button', { name: /Timer starten/ }).click()
  await schuss(p, 'app-10b-alleinarbeit-laufend', 1300)
  await p.getByRole('button', { name: 'Start' }).click()
  await p.waitForTimeout(600)
  await halten(p, p.getByText('SOS', { exact: true }).first())
  await schuss(p, 'app-13-sos-aktiv', 900)
  await ctx.close()
}

// ------------------------------------------------- Krisenstab in der App
{
  const ctx = await b.newContext(TELEFON)
  const p = await ctx.newPage()
  await anmelden(p, 'anna.mueller@sonnenberg-baar.ch')
  await p.goto(BASIS + '/#/app', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: 'Szenarien' }).click()
  await p.waitForTimeout(600)
  await p.getByText('Krisenstab einberufen').first().click()
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: /Geführt starten/ }).click()
  await schuss(p, 'kri-03-app-phase1', 800)
  for (let i = 0; i < 2; i++) {
    await p.getByRole('button', { name: 'Weiter', exact: true }).click()
    await p.waitForTimeout(800)
  }
  await schuss(p, 'kri-04-app-krisenteam-aufbieten', 800)
  await ctx.close()
}

await b.close()
console.log('\nDie Live-Bilder (web-21 bis web-25) entstehen gegen einen laufenden')
console.log('Alarmserver und werden von Hand aufgenommen – siehe docs/README.md.')
