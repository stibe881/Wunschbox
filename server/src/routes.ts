import { Router, type NextFunction, type Request, type Response } from 'express'
import {
  createSession, destroySession, destroyUserSessions, hashPassword, newSalt, normalizeEmail,
  passwordProblem, publicUser, sessionUserId, verifyPassword,
} from './auth.js'
import { addClient } from './events.js'
import { broadcast } from './events.js'
import { alarmPush, ausgehendeWebhooks, entwarnungPush } from './engine.js'
import { registerPushToken, removePushToken } from './push.js'
import { aktuellerJob, starteUpdate, updateLaeuft, versionsInfo, type UpdateScope } from './update.js'
import { ensureAdmin } from './setup.js'
import {
  addAudit, allLoneWork, allStoredUsers, createAlarm, deleteDoc, deleteUser, findAlarm, findStoredUser,
  findStoredUserByEmail, fullState, saveAlarm, saveIntegrations, uid, upsertDoc, upsertGroup,
  upsertLocation, upsertUser,
} from './store.js'
import type { AckStatus, Alarm, Role, StoredUser } from './types.js'

export const router = Router()

// ---------- Authentifizierung ----------

interface AuthRequest extends Request {
  user?: StoredUser
  token?: string
}

function auth(req: AuthRequest, res: Response, next: NextFunction): void {
  const kopf = req.header('authorization') ?? ''
  const token = kopf.startsWith('Bearer ') ? kopf.slice(7) : ''
  const userId = token ? sessionUserId(token) : null
  const user = userId ? findStoredUser(userId) : null
  if (!user) {
    res.status(401).json({ error: 'Nicht angemeldet.' })
    return
  }
  req.user = user
  req.token = token
  next()
}

/** Nur Administratoren dürfen die Konfiguration ändern */
function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Diese Aktion ist Administratoren vorbehalten.' })
    return
  }
  next()
}

/** Verwaltungsdaten dürfen Administratoren und Krisenstab pflegen */
function staffOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin' && req.user?.role !== 'krisenstab') {
    res.status(403).json({ error: 'Diese Aktion ist Administration und Krisenstab vorbehalten.' })
    return
  }
  next()
}

const FALSCHE_ANMELDUNG = 'E-Mail-Adresse oder Passwort ist falsch.'

/**
 * Öffentliche Auskunft für die Anmeldemaske: Ist der Server frisch eingerichtet?
 * Bewusst minimal – nur, ob genau ein Administratorkonto mit unverändertem
 * Erstpasswort besteht, und dessen Adresse. Sobald das Passwort geändert wurde,
 * verschwindet die Auskunft.
 */
router.get('/setup', (_req, res) => {
  const users = allStoredUsers()
  const frisch =
    users.length === 1 && users[0].role === 'admin' && users[0].mustChangePassword === true
  res.json({
    freshInstall: frisch,
    adminEmail: frisch ? users[0].email : null,
    userCount: users.length,
  })
})

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'Bitte E-Mail-Adresse und Passwort eingeben.' })
    return
  }
  const user = findStoredUserByEmail(normalizeEmail(String(email)))
  // Bewusst dieselbe Meldung für unbekannte Adresse und falsches Passwort
  if (!user) {
    res.status(401).json({ error: FALSCHE_ANMELDUNG })
    return
  }
  if (!user.passwordHash || !user.passwordSalt) {
    res.status(401).json({ error: 'Für dieses Konto ist noch kein Passwort gesetzt. Bitte an die Administration wenden.' })
    return
  }
  if (!verifyPassword(user, String(password))) {
    res.status(401).json({ error: FALSCHE_ANMELDUNG })
    return
  }

  const { token, expiresAt } = createSession(user.id)
  upsertUser({ ...user, lastLoginAt: Date.now() })
  addAudit('anmeldung', `Anmeldung: ${user.firstName} ${user.lastName} (${user.email})`, user.id)
  res.json({ token, expiresAt, user: publicUser({ ...user, lastLoginAt: Date.now() }) })
})

router.post('/auth/logout', auth, (req: AuthRequest, res) => {
  if (req.token) destroySession(req.token)
  res.json({ ok: true })
})

router.get('/auth/me', auth, (req: AuthRequest, res) => {
  res.json({ user: publicUser(req.user!) })
})

/** Eigenes Passwort ändern – Kenntnis des bisherigen vorausgesetzt */
router.post('/auth/password', auth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body ?? {}
  const user = req.user!
  // Beim erzwungenen Erstwechsel ist das bisherige Passwort das Erstpasswort
  if (!verifyPassword(user, String(currentPassword ?? ''))) {
    res.status(400).json({ error: 'Das aktuelle Passwort ist falsch.' })
    return
  }
  const problem = passwordProblem(String(newPassword ?? ''))
  if (problem) {
    res.status(400).json({ error: problem })
    return
  }
  const salt = newSalt()
  upsertUser({ ...user, passwordSalt: salt, passwordHash: hashPassword(String(newPassword), salt), mustChangePassword: false })
  // Andere Geräte abmelden, das aktuelle bleibt angemeldet
  destroyUserSessions(user.id, req.token)
  addAudit('anmeldung', `Passwort geändert: ${user.firstName} ${user.lastName}`, user.id)
  broadcast('state')
  res.json({ ok: true })
})

// ---------- Datenbestand ----------

router.get('/state', auth, (_req, res) => {
  res.json(fullState())
})

/** Live-Aktualisierung: Der Client lädt bei jedem Ereignis den Stand neu */
router.get('/events', (req, res) => {
  const token = String(req.query.token ?? '')
  if (!token || !sessionUserId(token)) {
    res.status(401).end()
    return
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()
  const entfernen = addClient(res)
  req.on('close', entfernen)
})

// ---------- Benutzerverwaltung ----------

function istLetzterAdmin(userId: string): boolean {
  const admins = allStoredUsers().filter((u) => u.role === 'admin')
  return admins.length === 1 && admins[0].id === userId
}

router.post('/users', auth, adminOnly, (req, res) => {
  const eingabe = req.body ?? {}
  const bestehend = eingabe.id ? findStoredUser(String(eingabe.id)) : null

  if (bestehend && istLetzterAdmin(bestehend.id) && eingabe.role !== 'admin') {
    res.status(400).json({ error: 'Dies ist der einzige Administrator – die Rolle kann nicht geändert werden.' })
    return
  }
  const email = normalizeEmail(String(eingabe.email ?? ''))
  if (!email) {
    res.status(400).json({ error: 'Bitte eine E-Mail-Adresse angeben.' })
    return
  }
  const belegt = findStoredUserByEmail(email)
  if (belegt && belegt.id !== bestehend?.id) {
    res.status(400).json({ error: 'Diese E-Mail-Adresse wird bereits verwendet.' })
    return
  }

  const user: StoredUser = {
    id: bestehend?.id ?? String(eingabe.id ?? uid('u')),
    firstName: String(eingabe.firstName ?? '').trim(),
    lastName: String(eingabe.lastName ?? '').trim(),
    email,
    phone: String(eingabe.phone ?? ''),
    role: (['admin', 'krisenstab', 'mitarbeiter'].includes(eingabe.role) ? eingabe.role : 'mitarbeiter') as Role,
    groupIds: Array.isArray(eingabe.groupIds) ? eingabe.groupIds : [],
    locationId: String(eingabe.locationId ?? ''),
    language: (['de', 'en', 'fr', 'it'].includes(eingabe.language) ? eingabe.language : 'de') as StoredUser['language'],
    absence: eingabe.absence ?? undefined,
    partTimeNote: eingabe.partTimeNote || undefined,
    passwordHash: bestehend?.passwordHash,
    passwordSalt: bestehend?.passwordSalt,
    mustChangePassword: Boolean(eingabe.mustChangePassword),
    lastLoginAt: bestehend?.lastLoginAt,
  }
  if (!user.firstName || !user.lastName) {
    res.status(400).json({ error: 'Bitte Vor- und Nachname angeben.' })
    return
  }

  // Passwort optional mitgeben – es wird nie im Klartext gespeichert
  if (eingabe.password) {
    const problem = passwordProblem(String(eingabe.password))
    if (problem) {
      res.status(400).json({ error: problem })
      return
    }
    const salt = newSalt()
    user.passwordSalt = salt
    user.passwordHash = hashPassword(String(eingabe.password), salt)
    destroyUserSessions(user.id)
  }

  upsertUser(user)
  addAudit('admin', `${bestehend ? 'Benutzer aktualisiert' : 'Benutzer erstellt'}: ${user.firstName} ${user.lastName}`)
  broadcast('state')
  res.json({ user: publicUser(user) })
})

/** Passwort eines fremden Kontos setzen – nur für die Administration */
router.post('/users/:id/password', auth, adminOnly, (req, res) => {
  const ziel = findStoredUser(req.params.id)
  if (!ziel) {
    res.status(404).json({ error: 'Benutzer nicht gefunden.' })
    return
  }
  const problem = passwordProblem(String(req.body?.password ?? ''))
  if (problem) {
    res.status(400).json({ error: problem })
    return
  }
  const salt = newSalt()
  upsertUser({
    ...ziel,
    passwordSalt: salt,
    passwordHash: hashPassword(String(req.body.password), salt),
    mustChangePassword: Boolean(req.body?.mustChange),
  })
  // Bestehende Anmeldungen dieses Kontos beenden
  destroyUserSessions(ziel.id)
  addAudit('admin', `Passwort gesetzt für ${ziel.firstName} ${ziel.lastName}`)
  broadcast('state')
  res.json({ ok: true })
})

router.delete('/users/:id', auth, adminOnly, (req, res) => {
  if (istLetzterAdmin(req.params.id)) {
    res.status(400).json({ error: 'Der letzte Administrator kann nicht gelöscht werden.' })
    return
  }
  deleteUser(req.params.id)
  destroyUserSessions(req.params.id)
  addAudit('admin', 'Benutzer gelöscht')
  ensureAdmin()
  broadcast('state')
  res.json({ ok: true })
})

// ---------- Stammdaten ----------

const sammlungen = {
  scenarios: 'scenarios',
  plans: 'plans',
  contacts: 'contacts',
  buttons: 'buttons',
} as const

for (const [pfad, tabelle] of Object.entries(sammlungen)) {
  router.post(`/${pfad}`, auth, staffOnly, (req, res) => {
    const doc = req.body ?? {}
    const id = String(doc.id ?? uid(pfad.slice(0, 2)))
    upsertDoc(tabelle, id, { ...doc, id })
    addAudit('admin', `${pfad} gespeichert: ${doc.name ?? doc.title ?? id}`)
    broadcast('state')
    res.json({ id })
  })
  router.delete(`/${pfad}/:id`, auth, staffOnly, (req, res) => {
    deleteDoc(tabelle, req.params.id)
    addAudit('admin', `${pfad} gelöscht: ${req.params.id}`)
    broadcast('state')
    res.json({ ok: true })
  })
}

router.post('/groups', auth, adminOnly, (req, res) => {
  const g = req.body ?? {}
  const id = String(g.id ?? uid('gr'))
  upsertGroup({ id, name: String(g.name ?? ''), description: String(g.description ?? ''), isCrisisTeam: Boolean(g.isCrisisTeam) })
  addAudit('admin', `Gruppe gespeichert: ${g.name}`)
  broadcast('state')
  res.json({ id })
})

router.delete('/groups/:id', auth, adminOnly, (req, res) => {
  deleteDoc('groups', req.params.id)
  addAudit('admin', 'Gruppe gelöscht')
  broadcast('state')
  res.json({ ok: true })
})

router.post('/locations', auth, adminOnly, (req, res) => {
  const l = req.body ?? {}
  const id = String(l.id ?? uid('loc'))
  upsertLocation({
    id,
    name: String(l.name ?? ''),
    address: String(l.address ?? ''),
    geofence: l.geofence ?? undefined,
    operatingHours: l.operatingHours ?? { days: '', open: '', close: '' },
  })
  addAudit('admin', `Standort gespeichert: ${l.name}`)
  broadcast('state')
  res.json({ id })
})

router.delete('/locations/:id', auth, adminOnly, (req, res) => {
  deleteDoc('locations', req.params.id)
  addAudit('admin', 'Standort gelöscht')
  broadcast('state')
  res.json({ ok: true })
})

router.post('/integrations', auth, adminOnly, (req, res) => {
  saveIntegrations(req.body)
  addAudit('admin', 'Integrationen gespeichert')
  broadcast('state')
  res.json({ ok: true })
})

// ---------- Alarme ----------

router.post('/alarms', auth, async (req: AuthRequest, res) => {
  const o = req.body ?? {}
  const alarm = createAlarm({
    scenarioId: String(o.scenarioId ?? ''),
    message: String(o.message ?? ''),
    silent: Boolean(o.silent),
    requireAck: Boolean(o.requireAck),
    channels: Array.isArray(o.channels) && o.channels.length ? o.channels : ['push'],
    groupIds: Array.isArray(o.groupIds) ? o.groupIds : [],
    locationIds: Array.isArray(o.locationIds) ? o.locationIds : [],
    triggeredByUserId: req.user!.id,
    triggeredVia: o.triggeredVia ?? 'app',
    planId: o.planId,
    escalation: o.escalation,
    recipientUserIds: o.recipientUserIds,
  })
  saveAlarm(alarm)
  const ausloeser = req.user!
  addAudit('alarm', `Alarm ausgelöst von ${ausloeser.firstName} ${ausloeser.lastName}: ${alarm.message}`, ausloeser.id)
  broadcast('state')
  // Versand nach der Antwort – ein langsamer Push darf die Auslösung nicht bremsen
  res.json({ alarm })
  await alarmPush(alarm)
  await ausgehendeWebhooks(alarm)
})

router.post('/alarms/:id/ack', auth, (req: AuthRequest, res) => {
  const alarm = findAlarm(req.params.id)
  if (!alarm) {
    res.status(404).json({ error: 'Alarm nicht gefunden.' })
    return
  }
  const ack: AckStatus = req.body?.ack === 'declined' ? 'declined' : 'acknowledged'
  const person = req.user!
  const jetzt = Date.now()
  const warEmpfaenger = alarm.deliveries.some((d) => d.userId === person.id)
  // Wer den Alarm gesehen hat, aber nicht zur alarmierten Gruppe gehört, wird
  // trotzdem erfasst – sonst behauptet das Journal eine Quittierung ohne Beleg
  const deliveries = warEmpfaenger
    ? alarm.deliveries.map((d) => (d.userId === person.id ? { ...d, ack, updatedAt: jetzt } : d))
    : [
        ...alarm.deliveries,
        { id: uid('dlv'), userId: person.id, channel: alarm.channels[0] ?? 'push', status: 'delivered' as const, ack, updatedAt: jetzt },
      ]
  const aktualisiert: Alarm = {
    ...alarm,
    deliveries,
    log: [
      ...alarm.log,
      {
        ts: jetzt,
        message: `${person.firstName} ${person.lastName} hat ${ack === 'acknowledged' ? 'quittiert (kommt)' : 'abgelehnt (nicht verfügbar)'}${
          warEmpfaenger ? '' : ' – war nicht Teil der Alarmierung'
        }`,
      },
    ],
  }
  saveAlarm(aktualisiert)
  broadcast('state')
  res.json({ alarm: aktualisiert })
})

router.post('/alarms/:id/end', auth, staffOnly, async (req: AuthRequest, res) => {
  const alarm = findAlarm(req.params.id)
  if (!alarm) {
    res.status(404).json({ error: 'Alarm nicht gefunden.' })
    return
  }
  const person = req.user!
  const beendet: Alarm = {
    ...alarm,
    status: 'ended',
    endedAt: Date.now(),
    log: [...alarm.log, { ts: Date.now(), message: `Alarm beendet durch ${person.firstName} ${person.lastName} – Entwarnung versendet.` }],
  }
  saveAlarm(beendet)
  addAudit('alarm', `Alarm beendet: ${alarm.message}`, person.id)
  broadcast('state')
  res.json({ alarm: beendet })
  // Ein bereits beendeter Alarm soll nicht bei jedem Klick erneut «entwarnen»
  if (alarm.status === 'active') await entwarnungPush(beendet)
})

// ---------- Alleinarbeit ----------

router.post('/lone-work', auth, (req: AuthRequest, res) => {
  const o = req.body ?? {}
  const dauer = Math.max(1, Number(o.durationMin ?? 30))
  const jetzt = Date.now()
  const sitzung = {
    id: uid('lw'),
    userId: req.user!.id,
    locationId: String(o.locationId ?? req.user!.locationId),
    activity: String(o.activity ?? 'Alleinarbeit'),
    startedAt: jetzt,
    durationMin: dauer,
    expiresAt: jetzt + dauer * 60_000,
    silent: Boolean(o.silent),
    status: 'running' as const,
  }
  upsertDoc('lone_work', sitzung.id, sitzung)
  addAudit('alleinarbeit', `Alleinarbeits-Timer gestartet (${sitzung.activity}, ${dauer} Min.)`, req.user!.id)
  broadcast('state')
  res.json({ session: sitzung })
})

/** Lebenszeichen: die zusätzlichen Minuten kommen zur bestehenden Restzeit hinzu */
router.post('/lone-work/:id/extend', auth, (req: AuthRequest, res) => {
  const sitzung = allLoneWork().find((s) => s.id === req.params.id)
  if (!sitzung) {
    res.status(404).json({ error: 'Timer nicht gefunden.' })
    return
  }
  const minuten = Math.max(1, Number(req.body?.minutes ?? 15))
  const aktualisiert = {
    ...sitzung,
    expiresAt: sitzung.expiresAt + minuten * 60_000,
    durationMin: sitzung.durationMin + minuten,
  }
  upsertDoc('lone_work', sitzung.id, aktualisiert)
  addAudit('alleinarbeit', `Alleinarbeits-Timer verlängert (+${minuten} Min. – Lebenszeichen erhalten)`, req.user!.id)
  broadcast('state')
  res.json({ session: aktualisiert })
})

router.post('/lone-work/:id/complete', auth, (req: AuthRequest, res) => {
  const sitzung = allLoneWork().find((s) => s.id === req.params.id)
  if (!sitzung) {
    res.status(404).json({ error: 'Timer nicht gefunden.' })
    return
  }
  upsertDoc('lone_work', sitzung.id, { ...sitzung, status: 'completed' })
  addAudit('alleinarbeit', 'Alleinarbeit sicher beendet', req.user!.id)
  broadcast('state')
  res.json({ ok: true })
})

// ---------- Aktualisierung ----------

router.get('/update/status', auth, adminOnly, async (_req, res) => {
  res.json({ version: await versionsInfo(), job: aktuellerJob() })
})

/** Schnelle Abfrage ohne Netzzugriff – für regelmässiges Nachsehen */
router.get('/update/job', auth, adminOnly, (_req, res) => {
  res.json({ job: aktuellerJob() })
})

router.post('/update', auth, adminOnly, async (req: AuthRequest, res) => {
  if (updateLaeuft()) {
    res.status(409).json({ error: 'Es läuft bereits eine Aktualisierung.' })
    return
  }
  const scope: UpdateScope = req.body?.scope === 'server+ios' ? 'server+ios' : 'server'
  if (scope === 'server+ios') {
    const info = await versionsInfo(false)
    if (!info.iosMoeglich) {
      res.status(400).json({ error: info.iosHinweis ?? 'Der iOS-Build ist auf diesem Server nicht eingerichtet.' })
      return
    }
  }
  const person = req.user!
  const job = starteUpdate(scope, `${person.firstName} ${person.lastName}`)
  addAudit('system', `Aktualisierung gestartet (${scope === 'server+ios' ? 'Server und iOS-App' : 'Server'})`, person.id)
  res.json({ job })
})

// ---------- Push-Registrierung ----------

router.post('/push/register', auth, (req: AuthRequest, res) => {
  const token = String(req.body?.token ?? '')
  if (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken')) {
    res.status(400).json({ error: 'Kein gültiges Expo-Push-Token.' })
    return
  }
  registerPushToken(
    req.user!.id,
    token,
    String(req.body?.platform ?? 'ios'),
    Boolean(req.body?.criticalAlerts),
  )
  res.json({ ok: true })
})

router.post('/push/unregister', auth, (req, res) => {
  removePushToken(String(req.body?.token ?? ''))
  res.json({ ok: true })
})
