/**
 * Konten auflisten – zeigt, welche Anmeldungen der Server tatsächlich kennt.
 * Hilft bei der Frage «warum komme ich nicht rein?»: falsche Adresse, kein
 * Passwort gesetzt oder erzwungener Wechsel offen.
 *
 *   npm run accounts
 */
import { seedDatabase } from './setup.js'
import { allStoredUsers } from './store.js'

seedDatabase()

const users = allStoredUsers()
if (users.length === 0) {
  console.log('Keine Konten vorhanden.')
} else {
  console.log('')
  console.log('  E-Mail'.padEnd(46) + 'Rolle'.padEnd(14) + 'Anmeldung')
  console.log('  ' + '-'.repeat(78))
  for (const u of users) {
    const anmeldung = !u.passwordHash
      ? 'kein Passwort gesetzt'
      : u.mustChangePassword
        ? 'Passwortwechsel offen'
        : u.lastLoginAt
          ? `zuletzt ${new Date(u.lastLoginAt).toLocaleString('de-CH')}`
          : 'noch nie angemeldet'
    console.log('  ' + u.email.padEnd(44) + u.role.padEnd(14) + anmeldung)
  }
  console.log('')
  console.log(`  ${users.length} Konto/Konten. Passwort zurücksetzen: npm run reset-admin -- <e-mail>`)
  console.log('')
}
