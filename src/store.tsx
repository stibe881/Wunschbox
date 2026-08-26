import React, { createContext, useContext, useEffect, useReducer } from 'react'
import type { AppState, Alarm, AlarmButton, AlarmPlan, Channel, Delivery, EscalationLevel, Group, Location, LoneWorkSession, Scenario, User, Webhook, AuditEntry } from './types'
import { CHANNEL_LABELS } from './types'
import { createInitialState } from './data/seed'
import { LEGACY_EMOJI_TO_ICON } from './components/ScenarioIcon'

const STORAGE_KEY = 'e-mergency-state-v1'

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ---------- Actions ----------

export type Action =
  | { type: 'SET_CURRENT_USER'; userId: string }
  | { type: 'UPSERT_USER'; user: User }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'IMPORT_USERS'; users: User[] }
  | { type: 'UPSERT_GROUP'; group: Group }
  | { type: 'DELETE_GROUP'; groupId: string }
  | { type: 'UPSERT_LOCATION'; location: Location }
  | { type: 'DELETE_LOCATION'; locationId: string }
  | { type: 'UPSERT_SCENARIO'; scenario: Scenario }
  | { type: 'DELETE_SCENARIO'; scenarioId: string }
  | { type: 'UPSERT_PLAN'; plan: AlarmPlan }
  | { type: 'DELETE_PLAN'; planId: string }
  | { type: 'TRIGGER_ALARM'; alarm: Alarm; audit: string }
  | { type: 'END_ALARM'; alarmId: string; byUserId: string }
  | { type: 'ACK_ALARM'; alarmId: string; userId: string; ack: 'acknowledged' | 'declined' }
  | { type: 'TICK'; now: number }
  | { type: 'UPSERT_BUTTON'; button: AlarmButton }
  | { type: 'DELETE_BUTTON'; buttonId: string }
  | { type: 'START_LONE_WORK'; session: LoneWorkSession }
  | { type: 'EXTEND_LONE_WORK'; sessionId: string; minutes: number }
  | { type: 'COMPLETE_LONE_WORK'; sessionId: string }
  | { type: 'UPDATE_INTEGRATIONS'; integrations: AppState['integrations'] }
  | { type: 'UPSERT_WEBHOOK'; webhook: Webhook }
  | { type: 'DELETE_WEBHOOK'; webhookId: string }
  | { type: 'ADD_ACCESS_CODE'; locationId: string }
  | { type: 'ADD_CONTACT'; contact: AppState['contacts'][number] }
  | { type: 'DELETE_CONTACT'; contactId: string }
  | { type: 'AUDIT'; entryType: string; message: string; userId?: string }
  | { type: 'RESET_DEMO' }

function audit(state: AppState, type: string, message: string, userId?: string): AuditEntry[] {
  const entry: AuditEntry = { id: uid('audit'), ts: Date.now(), type, message, userId }
  return [entry, ...state.audit].slice(0, 300)
}

// ---------- Alarm-Logik ----------

/** Empfänger eines Alarms bestimmen: Gruppen ∩ Standorte, Abwesenheiten ausfiltern */
export function resolveRecipients(state: AppState, groupIds: string[], locationIds: string[]): User[] {
  const today = new Date().toISOString().slice(0, 10)
  return state.users.filter((u) => {
    const inGroup = groupIds.length === 0 || u.groupIds.some((g) => groupIds.includes(g))
    const inLocation = locationIds.length === 0 || locationIds.includes(u.locationId)
    const absent = u.absence && u.absence.from <= today && today <= u.absence.to
    return inGroup && inLocation && !absent
  })
}

export function buildDeliveries(recipients: User[], channels: Channel[]): Delivery[] {
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
  planId?: string
  escalation?: EscalationLevel[]
}

export function createAlarm(state: AppState, opts: TriggerOptions): Alarm {
  const recipients = resolveRecipients(state, opts.groupIds, opts.locationIds)
  const now = Date.now()
  return {
    id: uid('alarm'),
    scenarioId: opts.scenarioId,
    planId: opts.planId,
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
      ...(opts.silent ? [{ ts: now, message: 'Stiller Alarm – keine Signaltöne auf Empfängergeräten.' }] : []),
    ],
  }
}

/** Simulation: Zustellstatus fortschreiben, Eskalationsstufen zünden, Alleinarbeits-Timer prüfen */
function tick(state: AppState, now: number): AppState {
  let changed = false

  // 1. Zustellungen fortschreiben (pending -> sent -> delivered, selten failed)
  const alarms = state.alarms.map((alarm) => {
    if (alarm.status !== 'active') return alarm
    let aChanged = false
    const deliveries = alarm.deliveries.map((d) => {
      const age = now - d.updatedAt
      if (d.status === 'pending' && age > 1200 + Math.random() * 1500) {
        aChanged = true
        return { ...d, status: 'sent' as const, updatedAt: now }
      }
      if (d.status === 'sent' && age > 1500 + Math.random() * 2500) {
        aChanged = true
        const failed = Math.random() < 0.04
        return { ...d, status: failed ? ('failed' as const) : ('delivered' as const), updatedAt: now }
      }
      return d
    })

    // 2. Eskalation
    const log = [...alarm.log]
    let escalationStage = alarm.escalationStage
    let nextDeliveries = deliveries
    const nextLevel = alarm.escalation[escalationStage]
    const ackDone = alarm.requireAck && alarm.deliveries.length > 0 &&
      uniqueUserIds(alarm.deliveries).every((uidX) => alarm.deliveries.some((d) => d.userId === uidX && d.ack === 'acknowledged'))
    if (nextLevel && !ackDone && now - alarm.triggeredAt > nextLevel.afterMinutes * 60_000) {
      escalationStage += 1
      aChanged = true
      const recipients = resolveRecipients(state, nextLevel.groupIds, alarm.locationIds)
      nextDeliveries = [...deliveries, ...buildDeliveries(recipients, nextLevel.channels)]
      log.push({
        ts: now,
        message: `Eskalationsstufe ${escalationStage} gezündet: ${recipients.length} weitere Empfänger (${nextLevel.channels.map((c) => CHANNEL_LABELS[c]).join(', ')})${nextLevel.notifyEmergencyServices ? ' – Blaulichtorganisationen benachrichtigt' : ''}`,
      })
    }

    if (!aChanged) return alarm
    changed = true
    return { ...alarm, deliveries: nextDeliveries, log, escalationStage }
  })

  // 3. Alleinarbeits-Timer: abgelaufen -> Alarm auslösen
  let loneWorkSessions = state.loneWorkSessions
  let newAlarms: Alarm[] = []
  let newAudit = state.audit
  const expired = state.loneWorkSessions.filter((s) => s.status === 'running' && now > s.expiresAt)
  if (expired.length > 0) {
    changed = true
    loneWorkSessions = state.loneWorkSessions.map((s) =>
      expired.some((e) => e.id === s.id) ? { ...s, status: 'alarm' as const } : s,
    )
    for (const session of expired) {
      const user = state.users.find((u) => u.id === session.userId)
      const alarm = createAlarm(state, {
        scenarioId: 'sc-medizin',
        message: `ALLEINARBEIT: Timer von ${user ? user.firstName + ' ' + user.lastName : session.userId} abgelaufen (Tätigkeit: ${session.activity}). Keine Rückmeldung – bitte sofort prüfen!`,
        silent: session.silent,
        requireAck: true,
        channels: ['push', 'sms', 'voice'],
        groupIds: ['gr-ersthelfer', 'gr-sicherheit'],
        locationIds: [session.locationId],
        triggeredByUserId: session.userId,
        triggeredVia: 'timer',
        escalation: [{ afterMinutes: 5, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true }],
      })
      newAlarms = [alarm, ...newAlarms]
      newAudit = [{ id: uid('audit'), ts: now, type: 'alarm', message: `Automatischer Alleinarbeiter-Alarm: Timer abgelaufen (${user?.firstName} ${user?.lastName})`, userId: session.userId }, ...newAudit].slice(0, 300)
    }
  }

  if (!changed) return state
  return { ...state, alarms: [...newAlarms, ...alarms], loneWorkSessions, audit: newAudit }
}

function uniqueUserIds(deliveries: Delivery[]): string[] {
  return [...new Set(deliveries.map((d) => d.userId))]
}

// ---------- Reducer ----------

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId }
    case 'UPSERT_USER': {
      const exists = state.users.some((u) => u.id === action.user.id)
      return {
        ...state,
        users: exists ? state.users.map((u) => (u.id === action.user.id ? action.user : u)) : [...state.users, action.user],
        audit: audit(state, 'admin', `${exists ? 'Benutzer aktualisiert' : 'Benutzer erstellt'}: ${action.user.firstName} ${action.user.lastName}`),
      }
    }
    case 'DELETE_USER':
      return { ...state, users: state.users.filter((u) => u.id !== action.userId), audit: audit(state, 'admin', 'Benutzer gelöscht') }
    case 'IMPORT_USERS':
      return { ...state, users: [...state.users, ...action.users], audit: audit(state, 'admin', `CSV-Import: ${action.users.length} Benutzer importiert`) }
    case 'UPSERT_GROUP': {
      const exists = state.groups.some((g) => g.id === action.group.id)
      return {
        ...state,
        groups: exists ? state.groups.map((g) => (g.id === action.group.id ? action.group : g)) : [...state.groups, action.group],
        audit: audit(state, 'admin', `Gruppe ${exists ? 'aktualisiert' : 'erstellt'}: ${action.group.name}`),
      }
    }
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.groupId),
        users: state.users.map((u) => ({ ...u, groupIds: u.groupIds.filter((g) => g !== action.groupId) })),
        audit: audit(state, 'admin', 'Gruppe gelöscht'),
      }
    case 'UPSERT_LOCATION': {
      const exists = state.locations.some((l) => l.id === action.location.id)
      return {
        ...state,
        locations: exists ? state.locations.map((l) => (l.id === action.location.id ? action.location : l)) : [...state.locations, action.location],
        audit: audit(state, 'admin', `Standort ${exists ? 'aktualisiert' : 'erstellt'}: ${action.location.name}`),
      }
    }
    case 'DELETE_LOCATION':
      return { ...state, locations: state.locations.filter((l) => l.id !== action.locationId), audit: audit(state, 'admin', 'Standort gelöscht') }
    case 'UPSERT_SCENARIO': {
      const exists = state.scenarios.some((s) => s.id === action.scenario.id)
      return {
        ...state,
        scenarios: exists ? state.scenarios.map((s) => (s.id === action.scenario.id ? action.scenario : s)) : [...state.scenarios, action.scenario],
        audit: audit(state, 'cms', `Szenario ${exists ? 'aktualisiert' : 'erstellt'}: ${action.scenario.title} – Änderung sofort an alle Apps verteilt`),
      }
    }
    case 'DELETE_SCENARIO':
      return { ...state, scenarios: state.scenarios.filter((s) => s.id !== action.scenarioId), audit: audit(state, 'cms', 'Szenario gelöscht') }
    case 'UPSERT_PLAN': {
      const exists = state.plans.some((p) => p.id === action.plan.id)
      return {
        ...state,
        plans: exists ? state.plans.map((p) => (p.id === action.plan.id ? action.plan : p)) : [...state.plans, action.plan],
        audit: audit(state, 'admin', `Alarmplan ${exists ? 'aktualisiert' : 'erstellt'}: ${action.plan.name}`),
      }
    }
    case 'DELETE_PLAN':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.planId), audit: audit(state, 'admin', 'Alarmplan gelöscht') }
    case 'TRIGGER_ALARM':
      return { ...state, alarms: [action.alarm, ...state.alarms], audit: audit(state, 'alarm', action.audit, action.alarm.triggeredByUserId) }
    case 'END_ALARM':
      return {
        ...state,
        alarms: state.alarms.map((a) =>
          a.id === action.alarmId
            ? { ...a, status: 'ended' as const, endedAt: Date.now(), log: [...a.log, { ts: Date.now(), message: 'Alarm beendet – Entwarnung an alle Empfänger versendet.' }] }
            : a,
        ),
        audit: audit(state, 'alarm', 'Alarm beendet (Entwarnung)', action.byUserId),
      }
    case 'ACK_ALARM':
      return {
        ...state,
        alarms: state.alarms.map((a) => {
          if (a.id !== action.alarmId) return a
          const user = state.users.find((u) => u.id === action.userId)
          return {
            ...a,
            deliveries: a.deliveries.map((d) => (d.userId === action.userId ? { ...d, ack: action.ack } : d)),
            log: [...a.log, { ts: Date.now(), message: `${user ? user.firstName + ' ' + user.lastName : action.userId} hat ${action.ack === 'acknowledged' ? 'quittiert (nimmt teil)' : 'abgelehnt (nicht verfügbar)'}` }],
          }
        }),
      }
    case 'TICK':
      return tick(state, action.now)
    case 'UPSERT_BUTTON': {
      const exists = state.buttons.some((b) => b.id === action.button.id)
      return {
        ...state,
        buttons: exists ? state.buttons.map((b) => (b.id === action.button.id ? action.button : b)) : [...state.buttons, action.button],
        audit: audit(state, 'hardware', `Alarmknopf ${exists ? 'aktualisiert' : 'registriert'}: ${action.button.name} (${action.button.serial})`),
      }
    }
    case 'DELETE_BUTTON':
      return { ...state, buttons: state.buttons.filter((b) => b.id !== action.buttonId), audit: audit(state, 'hardware', 'Alarmknopf entfernt') }
    case 'START_LONE_WORK': {
      const user = state.users.find((u) => u.id === action.session.userId)
      return {
        ...state,
        loneWorkSessions: [action.session, ...state.loneWorkSessions],
        audit: audit(state, 'alleinarbeit', `Alleinarbeit gestartet: ${user?.firstName} ${user?.lastName}, Timer ${action.session.durationMin} Min.`, action.session.userId),
      }
    }
    case 'EXTEND_LONE_WORK':
      return {
        ...state,
        loneWorkSessions: state.loneWorkSessions.map((s) =>
          s.id === action.sessionId ? { ...s, expiresAt: s.expiresAt + action.minutes * 60_000 } : s,
        ),
        audit: audit(state, 'alleinarbeit', `Alleinarbeits-Timer verlängert (+${action.minutes} Min. – Lebenszeichen erhalten)`),
      }
    case 'COMPLETE_LONE_WORK':
      return {
        ...state,
        loneWorkSessions: state.loneWorkSessions.map((s) => (s.id === action.sessionId ? { ...s, status: 'completed' as const } : s)),
        audit: audit(state, 'alleinarbeit', 'Alleinarbeit sicher beendet'),
      }
    case 'UPDATE_INTEGRATIONS':
      return { ...state, integrations: action.integrations, audit: audit(state, 'integration', 'Integrations-Einstellungen aktualisiert') }
    case 'UPSERT_WEBHOOK': {
      const exists = state.integrations.webhooks.some((w) => w.id === action.webhook.id)
      return {
        ...state,
        integrations: {
          ...state.integrations,
          webhooks: exists
            ? state.integrations.webhooks.map((w) => (w.id === action.webhook.id ? action.webhook : w))
            : [...state.integrations.webhooks, action.webhook],
        },
        audit: audit(state, 'integration', `Webhook ${exists ? 'aktualisiert' : 'erstellt'}: ${action.webhook.name}`),
      }
    }
    case 'DELETE_WEBHOOK':
      return {
        ...state,
        integrations: { ...state.integrations, webhooks: state.integrations.webhooks.filter((w) => w.id !== action.webhookId) },
        audit: audit(state, 'integration', 'Webhook gelöscht'),
      }
    case 'ADD_ACCESS_CODE': {
      const loc = state.locations.find((l) => l.id === action.locationId)
      const prefix = (loc?.name.slice(0, 2) ?? 'XX').toUpperCase()
      const code = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      return {
        ...state,
        integrations: {
          ...state.integrations,
          accessCodes: [{ code, locationId: action.locationId, role: 'mitarbeiter', createdAt: Date.now(), used: 0 }, ...state.integrations.accessCodes],
        },
        audit: audit(state, 'integration', `Zugangscode für Rollout erstellt: ${code}`),
      }
    }
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.contact], audit: audit(state, 'admin', `Notfallkontakt hinzugefügt: ${action.contact.name}`) }
    case 'DELETE_CONTACT':
      return { ...state, contacts: state.contacts.filter((c) => c.id !== action.contactId), audit: audit(state, 'admin', 'Notfallkontakt gelöscht') }
    case 'AUDIT':
      return { ...state, audit: audit(state, action.entryType, action.message, action.userId) }
    case 'RESET_DEMO':
      return createInitialState()
    default:
      return state
  }
}

// ---------- Context / Provider ----------

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null)

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.users && parsed.scenarios) {
        // Migration: früher gespeicherte Emoji-Icons auf Icon-Schlüssel umstellen
        parsed.scenarios = parsed.scenarios.map((s) =>
          LEGACY_EMOJI_TO_ICON[s.icon] ? { ...s, icon: LEGACY_EMOJI_TO_ICON[s.icon] } : s,
        )
        return parsed
      }
    }
  } catch {
    // korrupte Daten -> Neustart mit Seed
  }
  return createInitialState()
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Speicher voll – Offline-Cache nicht kritisch
    }
  }, [state])

  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 1000)
    return () => clearInterval(interval)
  }, [])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return ctx
}
