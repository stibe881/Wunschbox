import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Alarm, AlarmLogEntry, Channel, Delivery, EscalationLevel, LoneWorkSession, User } from './types'
import { CHANNEL_LABELS } from './types'
import { SEED_GROUPS, SEED_SCENARIOS, SEED_USERS } from './seed'
import { notifyNow } from './notifications'

const STORAGE_KEY = 'sonnenberg-mobile-v1'

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export interface MobileState {
  currentUserId: string
  alarms: Alarm[]
  loneWorkSessions: LoneWorkSession[]
}

const INITIAL: MobileState = {
  currentUserId: 'u-weber',
  alarms: [],
  loneWorkSessions: [],
}

// ---------- Alarm-Logik (identisch zur Web-App, Alarmserver wird lokal simuliert) ----------

export function resolveRecipients(groupIds: string[], locationIds: string[]): User[] {
  const today = new Date().toISOString().slice(0, 10)
  return SEED_USERS.filter((u) => {
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
}

export function createAlarm(opts: TriggerOptions): Alarm {
  const recipients = resolveRecipients(opts.groupIds, opts.locationIds)
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

/** Simulation: Zustellungen, Rückmeldungen der Einsatzkräfte, Eskalation, Alleinarbeits-Timer */
function tick(state: MobileState, now: number): MobileState {
  let changed = false

  const alarms = state.alarms.map((alarm) => {
    if (alarm.status !== 'active') return alarm
    let aChanged = false
    let deliveries = alarm.deliveries.map((d) => {
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

    // Simulierte Rückmeldungen: alarmierte Personen quittieren nach Zustellung
    if (alarm.requireAck) {
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
          const user = SEED_USERS.find((u) => u.id === userId)
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
      const recipients = resolveRecipients(nextLevel.groupIds, alarm.locationIds)
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
      const user = SEED_USERS.find((u) => u.id === session.userId)
      newAlarms = [
        createAlarm({
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
    case 'RESET':
      return INITIAL
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

interface StoreCtx {
  state: MobileState
  dispatch: React.Dispatch<Action>
  toasts: Toast[]
  hydrated: boolean
}

const StoreContext = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL)
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
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as MobileState
          if (parsed.currentUserId) rawDispatch({ type: 'HYDRATE', state: parsed })
        }
      })
      .catch(() => {
        // korrupte Daten -> Neustart mit Ausgangszustand
      })
      .finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {})
  }, [state, hydrated])

  useEffect(() => {
    const interval = setInterval(() => rawDispatch({ type: 'TICK', now: Date.now() }), 1000)
    return () => clearInterval(interval)
  }, [])

  return <StoreContext.Provider value={{ state, dispatch, toasts, hydrated }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return ctx
}

export { SEED_GROUPS }
