/**
 * Einstellungen aus einer .env-Datei laden.
 *
 * Muss als allererster Import in index.ts stehen: In ESM werden Importe der
 * Reihe nach ausgewertet, und andere Module lesen process.env bereits beim
 * Laden (etwa db.ts den Pfad der Datenbank).
 *
 * Die Datei server/.env enthält Zugangsdaten und ist deshalb von der
 * Versionsverwaltung ausgenommen. Vorlage: server/.env.example
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const pfad = resolve(process.env.SOBE_ENV_FILE ?? '.env')

if (existsSync(pfad)) {
  try {
    process.loadEnvFile(pfad)
    console.log(`[env] Einstellungen aus ${pfad} geladen`)
  } catch (fehler) {
    console.warn(`[env] ${pfad} konnte nicht gelesen werden:`, (fehler as Error).message)
  }
}
