import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'
import { db } from './db.js'
import type { StoredUser, User } from './types.js'

/**
 * Passwörter auf dem Server: PBKDF2-SHA256 mit Zufalls-Salt. Bewusst anders als
 * das frühere Client-Verfahren – auf dem Server ist ein bewusst langsames
 * Verfahren möglich und richtig, weil Hashes nie das Gerät verlassen.
 */
const ITERATIONS = 210_000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

/** Gültigkeitsdauer einer Anmeldung */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export const MIN_PASSWORD_LENGTH = 8

export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
}

export function newSalt(): string {
  return randomBytes(16).toString('hex')
}

export function verifyPassword(user: StoredUser, password: string): boolean {
  if (!user.passwordHash || !user.passwordSalt) return false
  const candidate = Buffer.from(hashPassword(password, user.passwordSalt), 'hex')
  const stored = Buffer.from(user.passwordHash, 'hex')
  // Längengleichheit zuerst prüfen, timingSafeEqual wirft sonst
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`
  if (!/[A-Za-zÀ-ÿ]/.test(password)) return 'Das Passwort muss mindestens einen Buchstaben enthalten.'
  if (!/[0-9]/.test(password)) return 'Das Passwort muss mindestens eine Ziffer enthalten.'
  return null
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Passwortfelder entfernen – sie verlassen den Server nie */
export function publicUser(user: StoredUser): User {
  const { passwordHash: _h, passwordSalt: _s, ...rest } = user
  return { ...rest, hasPassword: Boolean(user.passwordHash && user.passwordSalt) }
}

export function createSession(userId: string): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_MS
  db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)').run(token, userId, now, expiresAt)
  return { token, expiresAt }
}

export function sessionUserId(token: string): string | null {
  const row = db.prepare('SELECT userId, expiresAt FROM sessions WHERE token = ?').get(token) as
    | { userId: string; expiresAt: number }
    | undefined
  if (!row) return null
  if (row.expiresAt < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return null
  }
  return row.userId
}

export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

/** Alle Anmeldungen eines Kontos beenden – nach Passwortwechsel oder Sperrung */
export function destroyUserSessions(userId: string, keepToken?: string): void {
  if (keepToken) db.prepare('DELETE FROM sessions WHERE userId = ? AND token != ?').run(userId, keepToken)
  else db.prepare('DELETE FROM sessions WHERE userId = ?').run(userId)
}

export function purgeExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(Date.now())
}
