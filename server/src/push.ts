import { db } from './db.js'

/**
 * Echte Push-Nachrichten über den Expo-Push-Dienst.
 * Voraussetzung ist ein eigener App-Build (TestFlight/App Store) – Expo Go kann
 * seit SDK 53 keine Remote-Push-Nachrichten mehr empfangen.
 */
const EXPO_PUSH_URL = process.env.SOBE_PUSH_URL ?? 'https://exp.host/--/api/v2/push/send'

export function registerPushToken(userId: string, token: string, platform = 'ios', criticalAlerts = false): void {
  db.prepare(`
    INSERT INTO push_tokens (token, userId, platform, updatedAt, criticalAlerts) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET userId = excluded.userId, platform = excluded.platform,
      updatedAt = excluded.updatedAt, criticalAlerts = excluded.criticalAlerts
  `).run(token, userId, platform, Date.now(), criticalAlerts ? 1 : 0)
}

export function removePushToken(token: string): void {
  db.prepare('DELETE FROM push_tokens WHERE token = ?').run(token)
}

export interface PushZiel {
  token: string
  /** Gerät darf Alarme auch bei stummem Telefon hörbar machen */
  criticalAlerts: boolean
}

export function tokensForUsers(userIds: string[]): PushZiel[] {
  if (userIds.length === 0) return []
  const platzhalter = userIds.map(() => '?').join(',')
  const zeilen = db
    .prepare(`SELECT token, criticalAlerts FROM push_tokens WHERE userId IN (${platzhalter})`)
    .all(...userIds) as { token: string; criticalAlerts: number }[]
  return zeilen.map((r) => ({ token: r.token, criticalAlerts: Boolean(r.criticalAlerts) }))
}

export interface PushNachricht {
  title: string
  body: string
  data?: Record<string, unknown>
  /**
   * Nicht stiller Alarm: Ton auch bei stummgeschaltetem Telefon.
   * Geräte ohne bewilligte Critical-Alert-Berechtigung erhalten stattdessen
   * «time-sensitive» – das durchbricht immerhin Fokus-Modi.
   */
  critical?: boolean
  /**
   * Stiller Alarm: Die Mitteilung kommt an und erscheint auf dem Sperrbildschirm,
   * aber ohne Ton und ohne Vibration – niemand soll auf sich aufmerksam machen.
   */
  silent?: boolean
  /** Ohne Alarmton, aber wichtig genug, um Fokus-Modi zu durchbrechen (z. B. Entwarnung) */
  wichtig?: boolean
}

/** Android-Kanäle – die App legt sie beim Start mit passender Lautstärke an */
export const KANAL_ALARM = 'alarme'
export const KANAL_STILL = 'alarme-still'

/**
 * Versand an alle Geräte der genannten Personen. Fehler werden protokolliert,
 * aber nie weitergereicht: Ein nicht erreichbarer Push-Dienst darf die
 * Alarmauslösung nicht verhindern.
 */
export async function sendPush(userIds: string[], nachricht: PushNachricht): Promise<number> {
  const ziele = tokensForUsers(userIds)
  if (ziele.length === 0) return 0

  const nachrichten = ziele.map((ziel) => ({
    to: ziel.token,
    title: nachricht.title,
    body: nachricht.body,
    data: nachricht.data ?? {},
    // Stiller Alarm: kein Ton – auf iOS entfällt damit auch die Vibration
    sound: nachricht.silent ? null : 'default',
    priority: 'high',
    channelId: nachricht.silent ? KANAL_STILL : KANAL_ALARM,
    // Critical Alert nur an Geräte, die ihn tatsächlich dürfen – sonst lehnt
    // Apple die Nachricht ab. Ohne Bewilligung bleibt «time-sensitive».
    // Ein stiller Alarm bleibt «time-sensitive»: sichtbar trotz Fokus, aber lautlos.
    interruptionLevel: nachricht.critical && !nachricht.silent
      ? (ziel.criticalAlerts ? 'critical' : 'time-sensitive')
      : nachricht.silent || nachricht.wichtig ? 'time-sensitive' : 'active',
    // Ein Alarm, der eine Stunde später eintrifft, hilft niemandem mehr
    ttl: nachricht.critical || nachricht.silent ? 3600 : undefined,
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
      if (eintrag.status === 'error' && eintrag.details?.error === 'DeviceNotRegistered') removePushToken(ziele[i].token)
    })
    return ziele.length
  } catch (fehler) {
    console.warn('[push] Versand fehlgeschlagen:', (fehler as Error).message)
    return 0
  }
}
