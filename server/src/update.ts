import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { broadcast } from './events.js'
import { getSetting, setSetting } from './db.js'
import { addAudit } from './store.js'

/**
 * Aktualisierung per Knopfdruck.
 *
 * Statt über SSH zu pullen und von Hand zu bauen, führt der Server die immer
 * gleichen Schritte selbst aus: Quellcode holen, Abhängigkeiten aktualisieren,
 * Portal und Server bauen, optional den iOS-Build anstossen und zuletzt neu
 * starten. Es laufen ausschliesslich fest hinterlegte Befehle – der Client
 * wählt nur den Umfang, nie den Befehl.
 */

export type UpdateScope = 'server' | 'server+ios'
export type SchrittStatus = 'offen' | 'laufend' | 'erfolgreich' | 'fehlgeschlagen' | 'übersprungen'

export interface UpdateSchritt {
  id: string
  titel: string
  status: SchrittStatus
  /** Gekürzte Ausgabe des Befehls */
  ausgabe: string
  startedAt?: number
  finishedAt?: number
}

export interface UpdateJob {
  id: string
  scope: UpdateScope
  status: 'laufend' | 'erfolgreich' | 'fehlgeschlagen' | 'neustart'
  startedAt: number
  finishedAt?: number
  gestartetVon: string
  schritte: UpdateSchritt[]
  /** Link zum EAS-Build, sobald bekannt */
  buildUrl?: string
  fehler?: string
}

const JOB_KEY = 'update_job'
const MAX_AUSGABE = 20_000

let laufenderJob: UpdateJob | null = null

/** Wurzel des Arbeitsverzeichnisses – der Server liegt in server/ darunter */
export function repoRoot(): string {
  return resolve(process.env.SOBE_REPO_ROOT ?? resolve(process.cwd(), '..'))
}

export function ladeLetztenJob(): UpdateJob | null {
  const roh = getSetting(JOB_KEY)
  if (!roh) return null
  try {
    const job = JSON.parse(roh) as UpdateJob
    // Ein gespeicherter Auftrag stammt aus einem früheren Prozess, sobald in
    // diesem keiner mehr läuft. Dann ist er abgeschlossen: «laufend» wurde vom
    // Neustart unterbrochen, «neustart» hat stattgefunden – sonst liefe dieser
    // Server nicht. Ohne diese Umschreibung bliebe der Auftrag dauerhaft auf
    // «Server startet neu» stehen und der Dialog zeigte nie wieder eine Auswahl.
    if (!laufenderJob && (job.status === 'laufend' || job.status === 'neustart')) {
      return { ...job, status: 'erfolgreich', finishedAt: job.finishedAt ?? Date.now() }
    }
    return job
  } catch {
    return null
  }
}

function speichereJob(job: UpdateJob): void {
  setSetting(JOB_KEY, JSON.stringify(job))
  broadcast('update')
}

export const aktuellerJob = () => laufenderJob ?? ladeLetztenJob()

// ---------- Befehlsausführung ----------

interface BefehlErgebnis {
  code: number
  ausgabe: string
}

/**
 * Geheimnisse aus der Ausgabe entfernen.
 * Das Protokoll eines Laufs wird im Portal angezeigt – ein Zugangstoken, das
 * ein Werkzeug versehentlich ausgibt, darf dort nicht landen.
 */
function unkenntlich(text: string): string {
  let sauber = text
  for (const name of ['EXPO_TOKEN', 'SOBE_ADMIN_PASSWORD', 'GITHUB_TOKEN', 'GH_TOKEN']) {
    const wert = process.env[name]
    if (wert && wert.length >= 8) sauber = sauber.split(wert).join(`«${name} entfernt»`)
  }
  return sauber
}

/**
 * Unter Windows sind npm und npx Batch-Dateien (npm.cmd, npx.cmd). Node kann
 * solche Dateien seit den Sicherheitskorrekturen von 2024 nicht mehr direkt
 * starten – ohne Shell scheitert der Aufruf mit ENOENT. Für diese beiden
 * Befehle wird dort deshalb die Shell verwendet. Die Argumente stammen
 * ausschliesslich aus dem fest hinterlegten Ablaufplan, nie vom Client.
 */
function brauchtShell(befehl: string): boolean {
  return process.platform === 'win32' && (befehl === 'npm' || befehl === 'npx')
}

/**
 * Einen fest hinterlegten Befehl ausführen. Argumente werden als Array
 * übergeben; ausser für npm und npx unter Windows läuft alles ohne Shell,
 * damit keine Befehlsverkettung möglich ist.
 */
function fuehreAus(
  befehl: string,
  argumente: string[],
  arbeitsverzeichnis: string,
  beiAusgabe: (text: string) => void,
  timeoutMs = 45 * 60_000,
  zusatzUmgebung: Record<string, string> = {},
): Promise<BefehlErgebnis> {
  return new Promise((fertig) => {
    let ausgabe = ''
    const sammeln = (daten: Buffer) => {
      const text = unkenntlich(daten.toString())
      ausgabe = (ausgabe + text).slice(-MAX_AUSGABE)
      beiAusgabe(text)
    }

    const kind = spawn(befehl, argumente, {
      cwd: arbeitsverzeichnis,
      env: { ...process.env, CI: '1', npm_config_fund: 'false', npm_config_audit: 'false', ...zusatzUmgebung },
      shell: brauchtShell(befehl),
      windowsHide: true,
    })
    const uhr = setTimeout(() => {
      kind.kill('SIGKILL')
      ausgabe += '\n[abgebrochen: Zeitüberschreitung]'
    }, timeoutMs)

    kind.stdout.on('data', sammeln)
    kind.stderr.on('data', sammeln)
    kind.on('error', (fehler) => {
      clearTimeout(uhr)
      const hinweis =
        (fehler as NodeJS.ErrnoException).code === 'ENOENT'
          ? `\n[${befehl} wurde nicht gefunden. Ist es installiert und im Suchpfad des Benutzers, unter dem der Server läuft?]`
          : `\n[${befehl} nicht ausführbar: ${fehler.message}]`
      fertig({ code: 127, ausgabe: ausgabe + hinweis })
    })
    kind.on('close', (code) => {
      clearTimeout(uhr)
      fertig({ code: code ?? 1, ausgabe })
    })
  })
}

/** Kurzausgabe eines Befehls, für Versionsabfragen */
async function still(befehl: string, argumente: string[], verzeichnis: string): Promise<string> {
  const { code, ausgabe } = await fuehreAus(befehl, argumente, verzeichnis, () => {}, 60_000)
  return code === 0 ? ausgabe.trim() : ''
}

// ---------- Versionsinformationen ----------

export interface VersionsInfo {
  branch: string
  commit: string
  commitKurz: string
  commitDatum: string
  commitTitel: string
  /** Anzahl Commits, die auf dem Server noch fehlen */
  hinterher: number
  /** Ob der iOS-Build möglich ist (Zugangstoken hinterlegt) */
  iosMoeglich: boolean
  iosHinweis?: string
  /** Ob ein Neustart nach dem Update möglich ist */
  neustartMoeglich: boolean
}

export async function versionsInfo(pruefeRemote = true): Promise<VersionsInfo> {
  const root = repoRoot()
  const branch = (await still('git', ['rev-parse', '--abbrev-ref', 'HEAD'], root)) || 'unbekannt'
  const commit = (await still('git', ['rev-parse', 'HEAD'], root)) || ''
  const commitTitel = (await still('git', ['log', '-1', '--pretty=%s'], root)) || ''
  const commitDatum = (await still('git', ['log', '-1', '--pretty=%cI'], root)) || ''

  let hinterher = 0
  if (pruefeRemote && branch !== 'unbekannt') {
    await still('git', ['fetch', 'origin', branch], root)
    const zaehler = await still('git', ['rev-list', '--count', `HEAD..origin/${branch}`], root)
    hinterher = Number(zaehler) || 0
  }

  const expoToken = Boolean(process.env.EXPO_TOKEN)
  const mobileDa = existsSync(resolve(root, 'mobile', 'package.json'))

  return {
    branch,
    commit,
    commitKurz: commit.slice(0, 7),
    commitDatum,
    commitTitel,
    hinterher,
    iosMoeglich: expoToken && mobileDa,
    iosHinweis: !mobileDa
      ? 'Der Ordner mobile/ fehlt auf dem Server.'
      : !expoToken
        ? 'Für den iOS-Build fehlt die Umgebungsvariable EXPO_TOKEN (Zugangstoken von expo.dev).'
        : undefined,
    neustartMoeglich: process.env.SOBE_AUTO_RESTART !== 'false',
  }
}

// ---------- Ablauf ----------

interface SchrittDefinition {
  id: string
  titel: string
  befehl: string
  argumente: string[]
  verzeichnis: (root: string) => string
  /** Fehler hier bricht den Auftrag nicht ab */
  optional?: boolean
  timeoutMs?: number
  /** Zusätzliche Umgebungsvariablen nur für diesen Schritt */
  umgebung?: Record<string, string>
}

function schrittPlan(scope: UpdateScope): SchrittDefinition[] {
  const schritte: SchrittDefinition[] = [
    {
      id: 'fetch', titel: 'Änderungen vom Repository holen',
      befehl: 'git', argumente: ['fetch', '--all', '--prune'], verzeichnis: (r) => r,
    },
    {
      id: 'pull', titel: 'Quellcode aktualisieren',
      befehl: 'git', argumente: ['pull', '--ff-only'], verzeichnis: (r) => r,
    },
    {
      id: 'deps-web', titel: 'Abhängigkeiten des Portals aktualisieren',
      // --foreground-scripts: Neuere npm-Versionen sperren Installationsskripte, wenn
      // das Paket nicht unter allowScripts in package.json steht. Ohne diesen Schalter
      // steht die Warnung nirgends und der Build scheitert später ohne erkennbaren Grund.
      befehl: 'npm', argumente: ['install', '--no-audit', '--no-fund', '--foreground-scripts'], verzeichnis: (r) => r,
    },
    {
      id: 'build-web', titel: 'Portal bauen',
      befehl: 'npm', argumente: ['run', 'build'], verzeichnis: (r) => r,
    },
    {
      id: 'deps-server', titel: 'Abhängigkeiten des Servers aktualisieren',
      befehl: 'npm', argumente: ['install', '--no-audit', '--no-fund', '--foreground-scripts'], verzeichnis: (r) => resolve(r, 'server'),
    },
    {
      id: 'build-server', titel: 'Server bauen',
      befehl: 'npm', argumente: ['run', 'build'], verzeichnis: (r) => resolve(r, 'server'),
    },
  ]

  if (scope === 'server+ios') {
    schritte.push(
      {
        id: 'deps-app', titel: 'Abhängigkeiten der App aktualisieren',
        befehl: 'npm', argumente: ['install', '--no-audit', '--no-fund', '--foreground-scripts'], verzeichnis: (r) => resolve(r, 'mobile'),
      },
      {
        id: 'ios-build', titel: 'iOS-Build anstossen (läuft bei Expo weiter)',
        befehl: 'npx',
        argumente: [
          '--yes', 'eas-cli', 'build',
          '--platform', 'ios',
          '--profile', 'production',
          '--non-interactive',
          '--auto-submit',
          // Nicht auf den Build warten: Er läuft auf den Servern von Expo, die
          // Übermittlung an TestFlight schliesst dort automatisch an. Ohne dies
          // hinge der Auftrag 20 bis 45 Minuten, der Server könnte nicht neu
          // starten, und ein Abbruch der Verbindung sähe wie ein Fehlschlag aus.
          '--no-wait',
        ],
        verzeichnis: (r) => resolve(r, 'mobile'),
        // Hochladen des Projekts kann bei langsamer Leitung dauern
        timeoutMs: 20 * 60_000,
        // Ohne diese Einstellung verlangt eas-cli im nicht interaktiven Betrieb
        // ein sauberes Git-Verzeichnis. Nach npm install sind die Lock-Dateien
        // aber oft verändert, und der Build bräche nach allen anderen Schritten
        // ab. Mit EAS_NO_VCS packt EAS das Arbeitsverzeichnis direkt und
        // beachtet dabei weiterhin .gitignore und .easignore.
        umgebung: { EAS_NO_VCS: '1' },
      },
    )
  }
  return schritte
}

/** Build-Adresse aus der Ausgabe der EAS-CLI herausziehen */
function findeBuildUrl(text: string): string | undefined {
  const treffer = text.match(/https:\/\/expo\.dev\/accounts\/[^\s)]+/g)
  return treffer?.[treffer.length - 1]
}

export function updateLaeuft(): boolean {
  return laufenderJob?.status === 'laufend'
}

export function starteUpdate(scope: UpdateScope, gestartetVon: string): UpdateJob {
  const plan = schrittPlan(scope)
  const job: UpdateJob = {
    id: `upd-${Date.now().toString(36)}`,
    scope,
    status: 'laufend',
    startedAt: Date.now(),
    gestartetVon,
    schritte: plan.map((s) => ({ id: s.id, titel: s.titel, status: 'offen', ausgabe: '' })),
  }
  laufenderJob = job
  speichereJob(job)
  void abarbeiten(job, plan)
  return job
}

async function abarbeiten(job: UpdateJob, plan: SchrittDefinition[]): Promise<void> {
  const root = repoRoot()

  for (let i = 0; i < plan.length; i++) {
    const definition = plan[i]
    const schritt = job.schritte[i]
    schritt.status = 'laufend'
    schritt.startedAt = Date.now()
    speichereJob(job)

    let letzterFunk = 0
    const { code, ausgabe } = await fuehreAus(
      definition.befehl,
      definition.argumente,
      definition.verzeichnis(root),
      (text) => {
        schritt.ausgabe = (schritt.ausgabe + text).slice(-MAX_AUSGABE)
        // Nicht bei jedem Zeichen senden, sonst überflutet es die Clients
        if (Date.now() - letzterFunk > 1000) {
          letzterFunk = Date.now()
          speichereJob(job)
        }
      },
      definition.timeoutMs,
      definition.umgebung,
    )

    schritt.ausgabe = ausgabe
    schritt.finishedAt = Date.now()
    schritt.status = code === 0 ? 'erfolgreich' : 'fehlgeschlagen'

    if (definition.id === 'ios-build') job.buildUrl = findeBuildUrl(ausgabe)

    if (code !== 0 && !definition.optional) {
      job.status = 'fehlgeschlagen'
      job.fehler = `Schritt «${definition.titel}» ist fehlgeschlagen.`
      job.finishedAt = Date.now()
      for (const rest of job.schritte.slice(i + 1)) rest.status = 'übersprungen'
      speichereJob(job)
      addAudit('system', `Aktualisierung fehlgeschlagen: ${definition.titel}`)
      laufenderJob = null
      return
    }
    speichereJob(job)
  }

  job.finishedAt = Date.now()
  const neustart = process.env.SOBE_AUTO_RESTART !== 'false'
  job.status = neustart ? 'neustart' : 'erfolgreich'
  speichereJob(job)
  addAudit('system', `Aktualisierung abgeschlossen (${job.scope === 'server+ios' ? 'Server und iOS-App' : 'Server'})`)
  laufenderJob = null

  if (neustart) {
    // Der Prozess beendet sich; ein Dienstverwalter (systemd, pm2 oder das
    // mitgelieferte Startskript) startet ihn mit dem neuen Stand wieder
    setTimeout(() => process.exit(0), 2000)
  }
}
