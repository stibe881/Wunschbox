/**
 * Integrationstest gegen die laufende API.
 * Aufruf: SOBE_TEST_URL=http://localhost:3099 npx tsx src/test.ts
 */
const BASIS = process.env.SOBE_TEST_URL ?? 'http://localhost:3099'
const ERSTPASSWORT = process.env.SOBE_ADMIN_PASSWORD ?? 'SOBE-Start2026!'
const ADMIN_MAIL = process.env.SOBE_ADMIN_EMAIL ?? 'stefan.gross@sonnenberg-baar.ch'

let bestanden = 0
let gescheitert = 0
function pruefe(name: string, bedingung: boolean, zusatz = ''): void {
  if (bedingung) {
    bestanden++
    console.log('OK   ' + name)
  } else {
    gescheitert++
    console.log('FEHL ' + name + (zusatz ? ' – ' + zusatz : ''))
  }
}

async function ruf(pfad: string, optionen: RequestInit & { token?: string } = {}): Promise<{ status: number; body: any }> {
  const { token, ...rest } = optionen
  const antwort = await fetch(BASIS + '/api' + pfad, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  })
  const text = await antwort.text()
  return { status: antwort.status, body: text ? JSON.parse(text) : null }
}

async function main(): Promise<void> {
  // --- Anmeldung ---
  const falsch = await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_MAIL, password: 'falsch123' }) })
  pruefe('falsches Passwort wird abgelehnt', falsch.status === 401)

  const unbekannt = await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'niemand@example.ch', password: 'falsch123' }) })
  pruefe('gleiche Meldung für unbekanntes Konto', unbekannt.status === 401 && unbekannt.body.error === falsch.body.error)

  const an = await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_MAIL, password: ERSTPASSWORT }) })
  pruefe('Anmeldung mit Erstpasswort', an.status === 200 && Boolean(an.body.token))
  const adminToken: string = an.body.token
  pruefe('Passwortwechsel wird verlangt', an.body.user.mustChangePassword === true)
  pruefe('Antwort enthält keine Passwortdaten', !('passwordHash' in an.body.user) && !('passwordSalt' in an.body.user))

  const grossKlein = await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_MAIL.toUpperCase(), password: ERSTPASSWORT }) })
  pruefe('E-Mail ohne Beachtung der Gross-/Kleinschreibung', grossKlein.status === 200)

  // --- Zugriffsschutz ---
  const ohne = await ruf('/state')
  pruefe('Datenbestand ohne Anmeldung gesperrt', ohne.status === 401)
  const falscherToken = await ruf('/state', { token: 'a'.repeat(64) })
  pruefe('erfundenes Token wird abgelehnt', falscherToken.status === 401)

  // --- Datenbestand ---
  const stand = await ruf('/state', { token: adminToken })
  pruefe('Datenbestand abrufbar', stand.status === 200)
  pruefe('22 Szenarien vorhanden', stand.body.scenarios.length === 22, `gefunden: ${stand.body.scenarios?.length}`)
  pruefe('3 Standorte vorhanden', stand.body.locations.length === 3)
  pruefe('7 Gruppen vorhanden', stand.body.groups.length === 7)
  pruefe('Notrufnummern vorhanden', stand.body.contacts.length === 8)
  pruefe('keine Demo-Benutzer im Live-Bestand', stand.body.users.length === 1)
  pruefe('Benutzerliste ohne Passwortdaten', stand.body.users.every((u: any) => !('passwordHash' in u)))

  // --- Passwortwechsel ---
  const zuKurz = await ruf('/auth/password', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({ currentPassword: ERSTPASSWORT, newPassword: 'kurz1' }),
  })
  pruefe('zu kurzes Passwort abgelehnt', zuKurz.status === 400)

  const falschesAlt = await ruf('/auth/password', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({ currentPassword: 'stimmtnicht1', newPassword: 'Baar2026sicher' }),
  })
  pruefe('falsches aktuelles Passwort abgelehnt', falschesAlt.status === 400)

  const gewechselt = await ruf('/auth/password', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({ currentPassword: ERSTPASSWORT, newPassword: 'Baar2026sicher' }),
  })
  pruefe('Passwort geändert', gewechselt.status === 200)
  pruefe('altes Passwort gilt nicht mehr',
    (await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_MAIL, password: ERSTPASSWORT }) })).status === 401)
  const neuAn = await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN_MAIL, password: 'Baar2026sicher' }) })
  pruefe('neues Passwort gilt', neuAn.status === 200 && neuAn.body.user.mustChangePassword === false)
  pruefe('eigene Sitzung bleibt nach Wechsel gültig', (await ruf('/auth/me', { token: adminToken })).status === 200)

  // --- Benutzerverwaltung ---
  const angelegt = await ruf('/users', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({
      firstName: 'Peter', lastName: 'Muster', email: 'peter.muster@sonnenberg-baar.ch',
      role: 'mitarbeiter', groupIds: ['gr-alle', 'gr-ersthelfer'], locationId: 'loc-baar',
      password: 'Muster2026', mustChangePassword: false,
    }),
  })
  pruefe('Benutzer angelegt', angelegt.status === 200)
  const peterId: string = angelegt.body.user.id

  const doppelt = await ruf('/users', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({ firstName: 'Andere', lastName: 'Person', email: 'PETER.muster@sonnenberg-baar.ch', role: 'mitarbeiter' }),
  })
  pruefe('doppelte E-Mail-Adresse abgelehnt', doppelt.status === 400)

  const peterAn = await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'peter.muster@sonnenberg-baar.ch', password: 'Muster2026' }) })
  pruefe('neu angelegter Benutzer kann sich anmelden', peterAn.status === 200)
  const peterToken: string = peterAn.body.token

  const ohnePasswort = await ruf('/users', {
    method: 'POST', token: adminToken,
    body: JSON.stringify({ firstName: 'Ohne', lastName: 'Passwort', email: 'ohne@sonnenberg-baar.ch', role: 'mitarbeiter' }),
  })
  pruefe('Benutzer ohne Passwort anlegbar', ohnePasswort.status === 200 && ohnePasswort.body.user.hasPassword === false)
  pruefe('ohne Passwort keine Anmeldung',
    (await ruf('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'ohne@sonnenberg-baar.ch', password: 'egal1234' }) })).status === 401)

  // --- Rechte ---
  const fremdAnlage = await ruf('/users', {
    method: 'POST', token: peterToken,
    body: JSON.stringify({ firstName: 'Heimlich', lastName: 'Admin', email: 'heimlich@x.ch', role: 'admin' }),
  })
  pruefe('Mitarbeitende dürfen keine Benutzer anlegen', fremdAnlage.status === 403)
  pruefe('Mitarbeitende dürfen keine Szenarien ändern',
    (await ruf('/scenarios', { method: 'POST', token: peterToken, body: JSON.stringify({ id: 'sc-brand', title: 'Manipuliert' }) })).status === 403)
  pruefe('Mitarbeitende sehen den Datenbestand', (await ruf('/state', { token: peterToken })).status === 200)

  // --- Letzter Administrator ---
  const admins = (await ruf('/state', { token: adminToken })).body.users.filter((u: any) => u.role === 'admin')
  pruefe('genau ein Administrator vorhanden', admins.length === 1)
  pruefe('letzter Administrator nicht löschbar',
    (await ruf(`/users/${admins[0].id}`, { method: 'DELETE', token: adminToken })).status === 400)
  pruefe('letzter Administrator nicht herabstufbar',
    (await ruf('/users', { method: 'POST', token: adminToken, body: JSON.stringify({ ...admins[0], role: 'mitarbeiter' }) })).status === 400)

  // --- Alarm ---
  const alarm = await ruf('/alarms', {
    method: 'POST', token: peterToken,
    body: JSON.stringify({
      scenarioId: 'sc-medizin', message: 'Testalarm: Sturz im Treppenhaus', silent: false,
      requireAck: true, channels: ['push'], groupIds: ['gr-ersthelfer'], locationIds: ['loc-baar'], triggeredVia: 'app',
    }),
  })
  pruefe('Alarm ausgelöst', alarm.status === 200 && alarm.body.alarm.status === 'active')
  const alarmId: string = alarm.body.alarm.id
  pruefe('Empfänger wurden aufgelöst', alarm.body.alarm.deliveries.length > 0)

  const quittiert = await ruf(`/alarms/${alarmId}/ack`, { method: 'POST', token: peterToken, body: JSON.stringify({ ack: 'acknowledged' }) })
  pruefe('Quittierung gespeichert', quittiert.body.alarm.deliveries.some((d: any) => d.userId === peterId && d.ack === 'acknowledged'))

  pruefe('Mitarbeitende dürfen Alarme nicht beenden',
    (await ruf(`/alarms/${alarmId}/end`, { method: 'POST', token: peterToken })).status === 403)
  const beendet = await ruf(`/alarms/${alarmId}/end`, { method: 'POST', token: adminToken })
  pruefe('Administration beendet den Alarm', beendet.status === 200 && beendet.body.alarm.status === 'ended')

  // --- Gemeinsamer Datenbestand: das eigentliche Ziel ---
  const standPeter = await ruf('/state', { token: peterToken })
  pruefe('App sieht die im Portal angelegten Benutzer',
    standPeter.body.users.some((u: any) => u.email === 'peter.muster@sonnenberg-baar.ch'))
  pruefe('App sieht den beendeten Alarm', standPeter.body.alarms.some((a: any) => a.id === alarmId && a.status === 'ended'))

  // --- Alleinarbeit ---
  const timer = await ruf('/lone-work', { method: 'POST', token: peterToken, body: JSON.stringify({ activity: 'Kontrollgang', durationMin: 30, locationId: 'loc-baar' }) })
  pruefe('Alleinarbeits-Timer gestartet', timer.status === 200 && timer.body.session.status === 'running')
  const verlaengert = await ruf(`/lone-work/${timer.body.session.id}/extend`, { method: 'POST', token: peterToken, body: JSON.stringify({ minutes: 20 }) })
  pruefe('Timer verlängert', verlaengert.body.session.expiresAt > timer.body.session.expiresAt)
  pruefe('Timer beendet', (await ruf(`/lone-work/${timer.body.session.id}/complete`, { method: 'POST', token: peterToken })).status === 200)

  // --- Push-Registrierung ---
  pruefe('ungültiges Push-Token abgelehnt',
    (await ruf('/push/register', { method: 'POST', token: peterToken, body: JSON.stringify({ token: 'kaputt' }) })).status === 400)
  pruefe('gültiges Push-Token angenommen',
    (await ruf('/push/register', { method: 'POST', token: peterToken, body: JSON.stringify({ token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' }) })).status === 200)

  // --- Abmelden ---
  pruefe('Abmeldung möglich', (await ruf('/auth/logout', { method: 'POST', token: peterToken })).status === 200)
  pruefe('Token nach Abmeldung ungültig', (await ruf('/state', { token: peterToken })).status === 401)

  console.log(`\n${bestanden} bestanden, ${gescheitert} fehlgeschlagen`)
  process.exit(gescheitert === 0 ? 0 : 1)
}

main().catch((f) => {
  console.error(f)
  process.exit(1)
})
