import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Alarm, AlarmLogEntry, Channel, Delivery, EscalationLevel, LoneWorkSession, Session, User } from './types'
import { CHANNEL_LABELS } from './types'
import { LIVE_INITIAL_PASSWORD, SEED_GROUPS, SEED_SCENARIOS, SEED_USERS, createLiveInitialState } from './seed'
import { hashPassword, randomSalt } from './auth'
import { notifyNow } from './notifications'

export type AppMode = 'demo' | 'live'

const MODE_KEY = 'sonnenberg-mobile-mode'
const DATA_KEYS: Record<AppMode, string> = {
  demo: 'sonnenberg-mobile-v1',
  live: 'sonnenberg-mobile-live-v1',
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export interface MobileState {
  mode: AppMode
  /** Angemeldete Sitzung – null bedeutet: Anmeldemaske anzeigen */
  session: Session | null
  /** Benutzerverzeichnis des jeweiligen Modus (Demo: Beispielteam, Live: echte Konten) */
  users: User[]
  currentUserId: string
  alarms: Alarm[]
  loneWorkSessions: LoneWorkSession[]
}

function initialState(mode: AppMode): MobileState {
  const users = mode === 'live' ? createLiveInitialState().users : SEED_USERS
  return {
    mode,
    session: null,
    users,
    currentUserId: users[0].id,
    alarms: [],
    loneWorkSessions: [],
  }
}

// ---------- Alarm-Logik (identisch zur Web-App, Alarmserver wird lokal simuliert) ----------

export function resolveRecipients(users: User[], groupIds: string[], locationIds: string[]): User[] {
  const today = new Date().toISOString().slice(0, 10)
  return users.filter((u) => {
    const inGroup = groupIds.length === 0 || u.groupIds.some((g) => groupIds.includes(g))
    const inLocation = locationIds.length === 0 || locationIds.includes(u.locationId)
    const absent = u.absence && u.absence.from <= today && today <= u.absence.to
    return inGroup && inLocation && !absent
  })
}

function buildDeliveries(recipients: User[], channels: Channel[]): Delivery[] {
  const deliveries: Delivery[] = []
  for (const user of recipients) {
    for (const channel of channels) {
      deliveries.push({ id: uid('dlv'), userId: user.id, channel, status: 'pending', ack: 'none', updatedAt: Date.now() })
    }
  }
  return deliveries
}

export interface TriggerOptions {
  scenarioId: string
  message: string
  silent: boolean
  requireAck: boolean
  channels: Channel[]
  groupIds: string[]
  locationIds: string[]
  triggeredByUserId: string
  triggeredVia: Alarm['triggeredVia']
  escalation?: EscalationLevel[]
  /** Gezielte Empfänger (z. B. einzelnes Krisenteam-Mitglied) statt Gruppen-/Standortauflösung */
  recipientUserIds?: string[]
}

export function createAlarm(users: User[], opts: TriggerOptions): Alarm {
  const recipients = opts.recipientUserIds
    ? users.filter((u) => opts.recipientUserIds!.includes(u.id))
    : resolveRecipients(users, opts.groupIds, opts.locationIds)
  const now = Date.now()
  return {
    id: uid('alarm'),
    scenarioId: opts.scenarioId,
    message: opts.message,
    silent: opts.silent,
    requireAck: opts.requireAck,
    triggeredByUserId: opts.triggeredByUserId,
    triggeredVia: opts.triggeredVia,
    triggeredAt: now,
    locationIds: opts.locationIds,
    groupIds: opts.groupIds,
    channels: opts.channels,
    status: 'active',
    escalationStage: 0,
    escalation: opts.escalation ?? [],
    deliveries: buildDeliveries(recipients, opts.channels),
    log: [
      { ts: now, message: `Alarm ausgelöst (${opts.triggeredVia}) – ${recipients.length} Empfänger über ${opts.channels.map((c) => CHANNEL_LABELS[c]).join(', ')}` },
    ],
  }
}

export type Action =
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_PASSWORD'; userId: string; password: string; mustChange?: boolean }
  | { type: 'SET_USER'; userId: string }
  | { type: 'TRIGGER_ALARM'; alarm: Alarm }
  | { type: 'END_ALARM'; alarmId: string }
  | { type: 'ACK_ALARM'; alarmId: string; userId: string; ack: 'acknowledged' | 'declined' }
  | { type: 'TICK'; now: number }
  | { type: 'START_LONE_WORK'; session: LoneWorkSession }
  | { type: 'EXTEND_LONE_WORK'; sessionId: string; minutes: number }
  | { type: 'COMPLETE_LONE_WORK'; sessionId: string }
  | { type: 'HYDRATE'; state: MobileState }
  | { type: 'RESET' }

/** Zustellsimulation (nur Demo), Eskalation, Alleinarbeits-Timer */
function tick(state: MobileState, now: number): MobileState {
  let changed = false
  const simulate = state.mode === 'demo'

  const alarms = state.alarms.map((alarm) => {
    if (alarm.status !== 'active') return alarm
    let aChanged = false
    let deliveries = !simulate
      ? alarm.deliveries
      : alarm.deliveries.map((d) => {
          const age = now - d.updatedAt
          if (d.status === 'pending' && age > 1200 + Math.random() * 1500) {
            aChanged = true
            return { ...d, status: 'sent' as const, updatedAt: now }
          }
          if (d.status === 'sent' && age > 1500 + Math.random() * 2500) {
            aChanged = true
            return { ...d, status: Math.random() < 0.04 ? ('failed' as const) : ('delivered' as const), updatedAt: now }
          }
          return d
        })

    const log: AlarmLogEntry[] = [...alarm.log]

    // Simulierte Rückmeldungen (nur Demo): alarmierte Personen quittieren nach Zustellung
    if (simulate && alarm.requireAck) {
      const pendingUsers = [...new Set(deliveries.map((d) => d.userId))].filter(
        (userId) =>
          userId !== state.currentUserId &&
          deliveries.some((d) => d.userId === userId && d.status === 'delivered') &&
          deliveries.every((d) => d.userId !== userId || d.ack === 'none'),
      )
      for (const userId of pendingUsers) {
        if (Math.random() < 0.06) {
          const ack = Math.random() < 0.85 ? ('acknowledged' as const) : ('declined' as const)
          deliveries = deliveries.map((d) => (d.userId === userId ? { ...d, ack } : d))
          const user = state.users.find((u) => u.id === userId)
          log.push({
            ts: now,
            message: `${user ? `${user.firstName} ${user.lastName}` : userId} hat ${ack === 'acknowledged' ? 'quittiert (kommt)' : 'abgelehnt (nicht verfügbar)'}`,
          })
          aChanged = true
        }
      }
    }

    // Eskalation
    let escalationStage = alarm.escalationStage
    const nextLevel = alarm.escalation[escalationStage]
    const anyAck = deliveries.some((d) => d.ack === 'acknowledged')
    if (nextLevel && !anyAck && now - alarm.triggeredAt > nextLevel.afterMinutes * 60_000) {
      escalationStage += 1
      const recipients = resolveRecipients(state.users, nextLevel.groupIds, alarm.locationIds)
      deliveries = [...deliveries, ...buildDeliveries(recipients, nextLevel.channels)]
      log.push({
        ts: now,
        message: `Eskalationsstufe ${escalationStage}: ${recipients.length} weitere Empfänger${nextLevel.notifyEmergencyServices ? ' – Blaulichtorganisationen benachrichtigt' : ''}`,
      })
      aChanged = true
    }

    if (!aChanged) return alarm
    changed = true
    return { ...alarm, deliveries, log, escalationStage }
  })

  // Alleinarbeits-Timer abgelaufen -> automatischer Alarm
  let loneWorkSessions = state.loneWorkSessions
  let newAlarms: Alarm[] = []
  const expired = state.loneWorkSessions.filter((s) => s.status === 'running' && now > s.expiresAt)
  if (expired.length > 0) {
    changed = true
    loneWorkSessions = state.loneWorkSessions.map((s) =>
      expired.some((e) => e.id === s.id) ? { ...s, status: 'alarm' as const } : s,
    )
    for (const session of expired) {
      const user = state.users.find((u) => u.id === session.userId)
      newAlarms = [
        createAlarm(state.users, {
          scenarioId: 'sc-medizin',
          message: `ALLEINARBEIT: Timer von ${user ? `${user.firstName} ${user.lastName}` : '?'} abgelaufen (${session.activity}). Keine Rückmeldung – bitte sofort prüfen!`,
          silent: session.silent,
          requireAck: true,
          channels: ['push', 'sms', 'voice'],
          groupIds: ['gr-ersthelfer', 'gr-sicherheit'],
          locationIds: [session.locationId],
          triggeredByUserId: session.userId,
          triggeredVia: 'timer',
          escalation: [{ afterMinutes: 5, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true }],
        }),
        ...newAlarms,
      ]
    }
    Vibration.vibrate([0, 300, 150, 300])
  }

  if (!changed) return state
  return { ...state, alarms: [...newAlarms, ...alarms], loneWorkSessions }
}

function reducer(state: MobileState, action: Action): MobileState {
  switch (action.type) {
    case 'LOGIN': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      return {
        ...state,
        session: { userId: user.id, loginAt: Date.now() },
        currentUserId: user.id,
        users: state.users.map((u) => (u.id === user.id ? { ...u, lastLoginAt: Date.now() } : u)),
      }
    }
    case 'LOGOUT':
      return { ...state, session: null }
    case 'SET_PASSWORD': {
      const salt = randomSalt()
      const hash = hashPassword(action.password, salt)
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId
            ? { ...u, passwordSalt: salt, passwordHash: hash, mustChangePassword: action.mustChange ?? false }
            : u,
        ),
      }
    }
    case 'SET_USER':
      return { ...state, currentUserId: action.userId }
    case 'TRIGGER_ALARM':
      return { ...state, alarms: [action.alarm, ...state.alarms].slice(0, 20) }
    case 'END_ALARM':
      return {
        ...state,
        alarms: state.alarms.map((a) =>
          a.id === action.alarmId
            ? { ...a, status: 'ended' as const, endedAt: Date.now(), log: [...a.log, { ts: Date.now(), message: 'Alarm beendet – Entwarnung versendet.' }] }
            : a,
        ),
      }
    case 'ACK_ALARM':
      return {
        ...state,
        alarms: state.alarms.map((a) =>
          a.id === action.alarmId
            ? { ...a, deliveries: a.deliveries.map((d) => (d.userId === action.userId ? { ...d, ack: action.ack } : d)) }
            : a,
        ),
      }
    case 'TICK':
      return tick(state, action.now)
    case 'START_LONE_WORK':
      return { ...state, loneWorkSessions: [action.session, ...state.loneWorkSessions].slice(0, 20) }
    case 'EXTEND_LONE_WORK':
      return {
        ...state,
        loneWorkSessions: state.loneWorkSessions.map((s) =>
          s.id === action.sessionId ? { ...s, expiresAt: s.expiresAt + action.minutes * 60_000 } : s,
        ),
      }
    case 'COMPLETE_LONE_WORK':
      return {
        ...state,
        loneWorkSessions: state.loneWorkSessions.map((s) => (s.id === action.sessionId ? { ...s, status: 'completed' as const } : s)),
      }
    case 'HYDRATE':
      return action.state
    case 'RESET': {
      const fresh = initialState(state.mode)
      // Angemeldet bleiben, sofern das eigene Konto im frischen Bestand existiert
      const keep = fresh.users.some((u) => u.id === state.session?.userId)
      return keep ? { ...fresh, session: state.session, currentUserId: state.session!.userId } : fresh
    }
    default:
      return state
  }
}

// ---------- Toasts ----------

export interface Toast {
  id: number
  message: string
  kind: 'success' | 'alarm'
}

function toastForAction(action: Action): Toast['message'] | { message: string; kind: 'alarm' } | null {
  switch (action.type) {
    case 'TRIGGER_ALARM':
      return { message: 'Alarm ausgelöst – Empfänger werden benachrichtigt', kind: 'alarm' }
    case 'END_ALARM':
      return 'Alarm beendet – Entwarnung versendet'
    case 'ACK_ALARM':
      return action.ack === 'acknowledged' ? 'Quittiert – Sie nehmen teil' : 'Als nicht verfügbar gemeldet'
    case 'LOGOUT':
      return 'Abgemeldet'
    case 'SET_PASSWORD':
      return 'Passwort gespeichert'
    case 'START_LONE_WORK':
      return 'Alleinarbeits-Timer gestartet'
    case 'EXTEND_LONE_WORK':
      return 'Lebenszeichen erhalten – Timer verlängert'
    case 'COMPLETE_LONE_WORK':
      return 'Alleinarbeit sicher beendet'
    case 'RESET':
      return 'Demo zurückgesetzt'
    default:
      return null
  }
}

// ---------- Provider ----------

/**
 * Gespeicherte Stände auf die Anmeldung umstellen. Ältere Stände kennen weder
 * Benutzerverzeichnis noch Sitzung; sie erhalten das Verzeichnis des Modus.
 * Demo-Passwörter werden nur im Demo-Modus übernommen; im Live-Modus bekommen
 * Administratoren das Erstpasswort mit erzwungener Änderung, sobald kein
 * anmeldefähiges Konto existiert.
 */
function migrateAuth(parsed: MobileState, mode: AppMode): MobileState {
  const fallback = initialState(mode)
  const seedById = new Map(SEED_USERS.map((u) => [u.id, u]))

  let users = (parsed.users?.length ? parsed.users : fallback.users).map((u) => {
    if (u.passwordHash && u.passwordSalt) return u
    if (mode !== 'demo') return u
    const seed = seedById.get(u.id)
    if (seed?.passwordHash && seed.passwordSalt) {
      return { ...u, passwordSalt: seed.passwordSalt, passwordHash: seed.passwordHash }
    }
    return u
  })

  if (!users.some((u) => u.passwordHash && u.passwordSalt)) {
    const salt = randomSalt()
    const hash = hashPassword(LIVE_INITIAL_PASSWORD, salt)
    users = users.map((u) => (u.role === 'admin' ? { ...u, passwordSalt: salt, passwordHash: hash, mustChangePassword: true } : u))
  }

  const session = parsed.session ?? null
  return {
    ...parsed,
    mode,
    users,
    session: session && users.some((u) => u.id === session.userId) ? session : null,
    currentUserId: users.some((u) => u.id === parsed.currentUserId) ? parsed.currentUserId : users[0].id,
  }
}

async function loadStateForMode(mode: AppMode): Promise<MobileState> {
  try {
    const raw = await AsyncStorage.getItem(DATA_KEYS[mode])
    if (raw) {
      const parsed = JSON.parse(raw) as MobileState
      if (parsed.currentUserId) return migrateAuth(parsed, mode)
    }
  } catch {
    // korrupte Daten -> Ausgangszustand
  }
  return initialState(mode)
}

interface StoreCtx {
  state: MobileState
  dispatch: React.Dispatch<Action>
  switchMode: (mode: AppMode) => void
  toasts: Toast[]
  hydrated: boolean
}

const StoreContext = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => initialState('demo'))
  const stateRef = useRef(state)
  stateRef.current = state
  const [hydrated, setHydrated] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const pushToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = ++toastId.current
    setToasts((t) => [...t.slice(-1), { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action)
      if (action.type === 'TRIGGER_ALARM' && !action.alarm.silent) {
        const scenario = SEED_SCENARIOS.find((s) => s.id === action.alarm.scenarioId)
        notifyNow(scenario ? `Alarm: ${scenario.title}` : 'Alarm ausgelöst', action.alarm.message)
      }
      const t = toastForAction(action)
      if (t) {
        if (typeof t === 'string') pushToast(t)
        else pushToast(t.message, t.kind)
      }
    },
    [pushToast],
  )

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((stored) => loadStateForMode(stored === 'live' ? 'live' : 'demo'))
      .then((loaded) => rawDispatch({ type: 'HYDRATE', state: loaded }))
      .catch(() => {
        // kein Storage verfügbar -> Demo-Ausgangszustand
      })
      .finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem(DATA_KEYS[state.mode], JSON.stringify(state)).catch(() => {})
    AsyncStorage.setItem(MODE_KEY, state.mode).catch(() => {})
  }, [state, hydrated])

  const switchMode = useCallback(
    (mode: AppMode) => {
      if (stateRef.current.mode === mode) return
      loadStateForMode(mode).then((loaded) => {
        rawDispatch({ type: 'HYDRATE', state: loaded })
        pushToast(
          mode === 'live'
            ? 'Live-Modus aktiv – keine Simulation, eigener Datenbestand'
            : 'Demo-Modus aktiv – Zustellung wird simuliert',
        )
      })
    },
    [pushToast],
  )

  useEffect(() => {
    const interval = setInterval(() => rawDispatch({ type: 'TICK', now: Date.now() }), 1000)
    return () => clearInterval(interval)
  }, [])

  return <StoreContext.Provider value={{ state, dispatch, switchMode, toasts, hydrated }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return ctx
}

export { SEED_GROUPS }
