import { db } from './db.js'

/**
 * Echte Push-Nachrichten über den Expo-Push-Dienst.
 * Voraussetzung ist ein eigener App-Build (TestFlight/App Store) – Expo Go kann
 * seit SDK 53 keine Remote-Push-Nachrichten mehr empfangen.
 */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export function registerPushToken(userId: string, token: string, platform = 'ios'): void {
  db.prepare(`
    INSERT INTO push_tokens (token, userId, platform, updatedAt) VALUES (?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET userId = excluded.userId, platform = excluded.platform, updatedAt = excluded.updatedAt
  `).run(token, userId, platform, Date.now())
}

export function removePushToken(token: string): void {
  db.prepare('DELETE FROM push_tokens WHERE token = ?').run(token)
}

export function tokensForUsers(userIds: string[]): string[] {
  if (userIds.length === 0) return []
  const platzhalter = userIds.map(() => '?').join(',')
  return (db.prepare(`SELECT token FROM push_tokens WHERE userId IN (${platzhalter})`).all(...userIds) as { token: string }[])
    .map((r) => r.token)
}

export interface PushNachricht {
  title: string
  body: string
  data?: Record<string, unknown>
  /** Alarmton auch im Fokus-/Nicht-stören-Modus */
  critical?: boolean
}

/**
 * Versand an alle Geräte der genannten Personen. Fehler werden protokolliert,
 * aber nie weitergereicht: Ein nicht erreichbarer Push-Dienst darf die
 * Alarmauslösung nicht verhindern.
 */
export async function sendPush(userIds: string[], nachricht: PushNachricht): Promise<number> {
  const tokens = tokensForUsers(userIds)
  if (tokens.length === 0) return 0

  const nachrichten = tokens.map((to) => ({
    to,
    title: nachricht.title,
    body: nachricht.body,
    data: nachricht.data ?? {},
    sound: nachricht.critical ? 'default' : 'default',
    priority: 'high',
    channelId: 'alarme',
    interruptionLevel: nachricht.critical ? 'critical' : 'active',
  }))

  try {
    const antwort = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(nachrichten),
    })
    if (!antwort.ok) {
      console.warn('[push] Expo antwortete mit', antwort.status)
      return 0
    }
    const ergebnis = (await antwort.json()) as { data?: { status: string; details?: { error?: string } }[] }
    // Von Expo abgelehnte Tokens (App deinstalliert) entfernen
    ergebnis.data?.forEach((eintrag, i) => {
      if (eintrag.status === 'error' && eintrag.details?.error === 'DeviceNotRegistered') removePushToken(tokens[i])
    })
    return tokens.length
  } catch (fehler) {
    console.warn('[push] Versand fehlgeschlagen:', (fehler as Error).message)
    return 0
  }
}
