import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AppState, User } from './types'

/**
 * Verbindung zum Alarmserver (Live-Modus).
 *
 * Der Demo-Modus arbeitet weiterhin ohne Netz auf dem Gerät. Im Live-Modus
 * kommen alle Daten vom Server, damit App und Webportal denselben Bestand sehen.
 */

const URL_KEY = 'sobe-server-url'
const TOKEN_KEY = 'sobe-server-token'

/** Ohne eigene Angabe wird der Server im Schulnetz erwartet */
export const DEFAULT_SERVER_URL = 'http://192.168.1.42:3001'

let serverUrlCache = DEFAULT_SERVER_URL
let tokenCache: string | null = null

/** Beim Start einmalig aus dem Gerätespeicher laden */
export async function loadApiSettings(): Promise<void> {
  try {
    const [url, token] = await Promise.all([AsyncStorage.getItem(URL_KEY), AsyncStorage.getItem(TOKEN_KEY)])
    if (url) serverUrlCache = url
    tokenCache = token
  } catch {
    // kein Speicher verfügbar – Standardwerte bleiben
  }
}

export const serverUrl = () => serverUrlCache

export async function setServerUrl(url: string): Promise<void> {
  serverUrlCache = url.trim().replace(/\/+$/, '')
  try {
    await AsyncStorage.setItem(URL_KEY, serverUrlCache)
  } catch {
    // Adresse gilt dann nur für diese Sitzung
  }
}

export const authToken = () => tokenCache

export async function setAuthToken(token: string | null): Promise<void> {
  tokenCache = token
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token)
    else await AsyncStorage.removeItem(TOKEN_KEY)
  } catch {
    // Token gilt dann nur für diese Sitzung
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function anfrage<T>(pfad: string, optionen: RequestInit = {}): Promise<T> {
  let antwort: Response
  try {
    antwort = await fetch(serverUrl() + '/api' + pfad, {
      ...optionen,
      headers: {
        'Content-Type': 'application/json',
        ...(tokenCache ? { Authorization: `Bearer ${tokenCache}` } : {}),
        ...(optionen.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(`Der Alarmserver unter ${serverUrl()} ist nicht erreichbar.`, 0)
  }
  const text = await antwort.text()
  const daten = text ? JSON.parse(text) : null
  if (!antwort.ok) throw new ApiError(daten?.error ?? `Serverfehler (${antwort.status})`, antwort.status)
  return daten as T
}

export type ServerData = Omit<AppState, 'mode' | 'session' | 'currentUserId' | 'scenarioContentVersion' | 'authVersion'>

export const api = {
  health: () => anfrage<{ ok: boolean }>('/health'),
  login: (email: string, password: string) =>
    anfrage<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => anfrage<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => anfrage<{ user: User }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    anfrage<{ ok: boolean }>('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  state: () => anfrage<ServerData>('/state'),
  triggerAlarm: (daten: Record<string, unknown>) =>
    anfrage<{ alarm: AppState['alarms'][number] }>('/alarms', { method: 'POST', body: JSON.stringify(daten) }),
  ackAlarm: (id: string, ack: 'acknowledged' | 'declined') =>
    anfrage<{ alarm: AppState['alarms'][number] }>(`/alarms/${id}/ack`, { method: 'POST', body: JSON.stringify({ ack }) }),
  endAlarm: (id: string) => anfrage<{ alarm: AppState['alarms'][number] }>(`/alarms/${id}/end`, { method: 'POST' }),
  startLoneWork: (daten: Record<string, unknown>) =>
    anfrage<{ session: AppState['loneWorkSessions'][number] }>('/lone-work', { method: 'POST', body: JSON.stringify(daten) }),
  extendLoneWork: (id: string, minutes: number) =>
    anfrage<{ session: AppState['loneWorkSessions'][number] }>(`/lone-work/${id}/extend`, { method: 'POST', body: JSON.stringify({ minutes }) }),
  completeLoneWork: (id: string) => anfrage<{ ok: boolean }>(`/lone-work/${id}/complete`, { method: 'POST' }),
  registerPush: (token: string) =>
    anfrage<{ ok: boolean }>('/push/register', { method: 'POST', body: JSON.stringify({ token, platform: 'ios' }) }),
  unregisterPush: (token: string) =>
    anfrage<{ ok: boolean }>('/push/unregister', { method: 'POST', body: JSON.stringify({ token }) }),
}
