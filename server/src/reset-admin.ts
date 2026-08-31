/**
 * Administrator-Passwort zurücksetzen.
 *
 * Für den Fall, dass niemand mehr ins Portal kommt. Läuft direkt auf dem Server
 * und braucht deshalb keine Anmeldung – wer Zugriff auf die Datenbankdatei hat,
 * könnte sie ohnehin verändern.
 *
 *   npm run reset-admin                          erstes Administratorkonto, neues Zufallspasswort
 *   npm run reset-admin -- name@schule.ch        bestimmtes Konto, neues Zufallspasswort
 *   npm run reset-admin -- name@schule.ch Neu2026sicher
 */
import { randomBytes } from 'node:crypto'
import { hashPassword, newSalt } from './auth.js'
import { db } from './db.js'
import { seedDatabase } from './setup.js'
import { addAudit, allStoredUsers, findStoredUserByEmail, upsertUser } from './store.js'

function zufallspasswort(): string {
  // Gut lesbar, ohne leicht verwechselbare Zeichen
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const roh = randomBytes(14)
  return Array.from(roh, (b) => zeichen[b % zeichen.length]).join('') + '7'
}

function main(): void {
  // Sicherstellen, dass Grundkonfiguration und Administratorkonto existieren
  seedDatabase()

  const [emailArg, passwortArg] = process.argv.slice(2)
  const users = allStoredUsers()

  const ziel = emailArg ? findStoredUserByEmail(emailArg) : users.find((u) => u.role === 'admin')

  if (!ziel) {
    console.error(
      emailArg
        ? `Kein Konto mit der Adresse ${emailArg} gefunden.`
        : 'Kein Administratorkonto gefunden.',
    )
    console.error('\nVorhandene Konten:')
    for (const u of users) console.error(`  ${u.email}  (${u.role})`)
    process.exit(1)
  }

  if (ziel.role !== 'admin') {
    console.error(`${ziel.email} ist kein Administrator (Rolle: ${ziel.role}).`)
    console.error('Dieses Werkzeug setzt nur Administratorkonten zurück.')
    process.exit(1)
  }

  const passwort = passwortArg || zufallspasswort()
  const salt = newSalt()
  upsertUser({
    ...ziel,
    passwordSalt: salt,
    passwordHash: hashPassword(passwort, salt),
    mustChangePassword: true,
  })
  // Alle bestehenden Anmeldungen dieses Kontos beenden
  db.prepare('DELETE FROM sessions WHERE userId = ?').run(ziel.id)
  addAudit('system', `Passwort von ${ziel.email} über die Kommandozeile zurückgesetzt`)

  console.log('')
  console.log('  Passwort zurückgesetzt')
  console.log('  ----------------------')
  console.log(`  Konto:    ${ziel.email}`)
  console.log(`  Passwort: ${passwort}`)
  console.log('')
  console.log('  Bei der nächsten Anmeldung muss ein eigenes Passwort vergeben werden.')
  console.log('  Alle bisherigen Anmeldungen dieses Kontos wurden beendet.')
  console.log('')
}

main()
