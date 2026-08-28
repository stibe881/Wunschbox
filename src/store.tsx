import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { CheckCircle2, Siren } from 'lucide-react'
import type { AppMode, AppState, Alarm, AlarmButton, AlarmPlan, Channel, Delivery, EscalationLevel, Group, Location, LoneWorkSession, Scenario, User, Webhook, AuditEntry } from './types'
import { CHANNEL_LABELS } from './types'
import { LIVE_INITIAL_PASSWORD, SCENARIO_CONTENT_VERSION, SEED_SCENARIOS, SEED_USERS, createInitialState, createLiveInitialState } from './data/seed'
import { hashPassword, randomSalt } from './lib/auth'
import { LEGACY_EMOJI_TO_ICON } from './components/ScenarioIcon'

/** Erhöhen, wenn gespeicherte Passwortdaten einmalig korrigiert werden müssen */
const AUTH_MIGRATION_VERSION = 1

// Demo und Live haben getrennte Speicherstände; der Modus selbst wird separat gemerkt
const MODE_KEY = 'e-mergency-mode'
const DATA_KEYS: Record<AppMode, string> = {
  demo: 'e-mergency-state-v2',
  live: 'e-mergency-state-live-v1',
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ---------- Actions ----------

export type Action =
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_PASSWORD'; userId: string; password: string; mustChange?: boolean }
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
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'ADOPT_EXTERNAL'; state: AppState }
  | { type: 'RESET_DEMO' }

/** Ist dieses Konto der einzige verbleibende Administrator? */
export function isLastAdmin(state: AppState, userId: string): boolean {
  const admins = state.users.filter((u) => u.role === 'admin')
  return admins.length === 1 && admins[0].id === userId
}

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
  /** Gezielte Empfänger (z. B. einzelnes Krisenteam-Mitglied) statt Gruppen-/Standortauflösung */
  recipientUserIds?: string[]
}

export function createAlarm(state: AppState, opts: TriggerOptions): Alarm {
  const recipients = opts.recipientUserIds
    ? state.users.filter((u) => opts.recipientUserIds!.includes(u.id))
    : resolveRecipients(state, opts.groupIds, opts.locationIds)
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

/** Zustellsimulation (nur Demo), Eskalationsstufen, Alleinarbeits-Timer */
function tick(state: AppState, now: number): AppState {
  let changed = false
  const simulate = state.mode === 'demo'

  // 1. Zustellungen fortschreiben (pending -> sent -> delivered) – nur im Demo-Modus;
  //    im Live-Modus bleiben Zustellungen offen, bis ein echtes Gateway angebunden ist
  const alarms = state.alarms.map((alarm) => {
    if (alarm.status !== 'active') return alarm
    let aChanged = false
    const deliveries = !simulate
      ? alarm.deliveries
      : alarm.deliveries.map((d) => {
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
    case 'LOGIN': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      return {
        ...state,
        session: { userId: user.id, loginAt: Date.now() },
        currentUserId: user.id,
        users: state.users.map((u) => (u.id === user.id ? { ...u, lastLoginAt: Date.now() } : u)),
        audit: audit(state, 'anmeldung', `Anmeldung im Webportal: ${user.firstName} ${user.lastName} (${user.email})`, user.id),
      }
    }
    case 'LOGOUT': {
      const user = state.users.find((u) => u.id === state.session?.userId)
      return {
        ...state,
        session: null,
        audit: user ? audit(state, 'anmeldung', `Abmeldung: ${user.firstName} ${user.lastName}`, user.id) : state.audit,
      }
    }
    case 'SET_PASSWORD': {
      const user = state.users.find((u) => u.id === action.userId)
      if (!user) return state
      const salt = randomSalt()
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId
            ? { ...u, passwordSalt: salt, passwordHash: hashPassword(action.password, salt), mustChangePassword: action.mustChange ?? false }
            : u,
        ),
        audit: audit(state, 'anmeldung', `Passwort gesetzt für ${user.firstName} ${user.lastName}`, action.userId),
      }
    }
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId }
    case 'UPSERT_USER': {
      const exists = state.users.some((u) => u.id === action.user.id)
      // Der letzte Administrator darf sich nicht selbst die Rechte entziehen
      if (exists && isLastAdmin(state, action.user.id) && action.user.role !== 'admin') return state
      return {
        ...state,
        users: exists ? state.users.map((u) => (u.id === action.user.id ? action.user : u)) : [...state.users, action.user],
        audit: audit(state, 'admin', `${exists ? 'Benutzer aktualisiert' : 'Benutzer erstellt'}: ${action.user.firstName} ${action.user.lastName}`),
      }
    }
    case 'DELETE_USER':
      // Ohne Administrator liesse sich der Datenbestand nicht mehr verwalten
      if (isLastAdmin(state, action.userId)) return state
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.userId),
        // Wer sich selbst löscht, wird abgemeldet
        session: state.session?.userId === action.userId ? null : state.session,
        audit: audit(state, 'admin', 'Benutzer gelöscht'),
      }
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
    case 'SET_MODE':
      return action.mode === state.mode ? state : loadStateFor(action.mode)
    case 'ADOPT_EXTERNAL': {
      // Änderungen aus einem anderen Browser-Tab übernehmen. Die Anmeldung dieses
      // Tabs bleibt bestehen, solange das Konto im übernommenen Bestand existiert –
      // so kann das Portal als Administrator und die App-Vorschau als Mitarbeitende
      // parallel offen sein.
      const incoming = action.state
      const sessionGiltNoch = state.session && incoming.users.some((u) => u.id === state.session!.userId)
      return {
        ...incoming,
        mode: state.mode,
        session: sessionGiltNoch ? state.session : incoming.session,
        currentUserId: incoming.users.some((u) => u.id === state.currentUserId)
          ? state.currentUserId
          : incoming.currentUserId,
      }
    }
    case 'RESET_DEMO': {
      const fresh = state.mode === 'live' ? createLiveInitialState() : createInitialState()
      // Angemeldet bleiben, sofern das eigene Konto im frischen Bestand existiert
      const keep = fresh.users.some((u) => u.id === state.session?.userId)
      return keep
        ? { ...fresh, session: state.session, currentUserId: state.session!.userId }
        : fresh
    }
    default:
      return state
  }
}

// ---------- Toasts: automatische Rückmeldung für Aktionen ----------

interface Toast {
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
    case 'UPSERT_USER':
      return 'Benutzer gespeichert'
    case 'DELETE_USER':
      return 'Benutzer gelöscht'
    case 'IMPORT_USERS':
      return `${action.users.length} Benutzer importiert`
    case 'UPSERT_GROUP':
      return 'Gruppe gespeichert'
    case 'DELETE_GROUP':
      return 'Gruppe gelöscht'
    case 'UPSERT_LOCATION':
      return 'Standort gespeichert'
    case 'DELETE_LOCATION':
      return 'Standort gelöscht'
    case 'UPSERT_SCENARIO':
      return 'Szenario gespeichert und an alle Apps verteilt'
    case 'DELETE_SCENARIO':
      return 'Szenario gelöscht'
    case 'UPSERT_PLAN':
      return 'Alarmplan gespeichert'
    case 'DELETE_PLAN':
      return 'Alarmplan gelöscht'
    case 'UPSERT_BUTTON':
      return 'Alarmknopf gespeichert'
    case 'DELETE_BUTTON':
      return 'Alarmknopf entfernt'
    case 'START_LONE_WORK':
      return 'Alleinarbeits-Timer gestartet'
    case 'EXTEND_LONE_WORK':
      return 'Lebenszeichen erhalten – Timer verlängert'
    case 'COMPLETE_LONE_WORK':
      return 'Alleinarbeit sicher beendet'
    case 'UPSERT_WEBHOOK':
      return 'Webhook gespeichert'
    case 'DELETE_WEBHOOK':
      return 'Webhook gelöscht'
    case 'ADD_ACCESS_CODE':
      return 'Zugangscode erstellt'
    case 'ADD_CONTACT':
      return 'Notfallkontakt gespeichert'
    case 'DELETE_CONTACT':
      return 'Notfallkontakt gelöscht'
    case 'UPDATE_INTEGRATIONS':
      return 'Einstellungen gespeichert'
    case 'SET_MODE':
      return action.mode === 'live'
        ? 'Live-Modus aktiv – eigener Datenbestand ohne Demo-Daten'
        : 'Demo-Modus aktiv – Beispieldaten und simulierte Zustellung'
    case 'RESET_DEMO':
      return 'Daten zurückgesetzt'
    default:
      return null
  }
}

function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed z-[60] bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            t.kind === 'alarm' ? 'bg-brand-600' : 'bg-slate-800'
          }`}
          role="status"
        >
          {t.kind === 'alarm' ? <Siren size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

/** Konto auf das Erstpasswort setzen, Änderung bei der nächsten Anmeldung erzwingen */
function withInitialPassword(user: User): User {
  const salt = randomSalt()
  return { ...user, passwordSalt: salt, passwordHash: hashPassword(LIVE_INITIAL_PASSWORD, salt), mustChangePassword: true }
}

/**
 * Sicherstellen, dass mindestens ein Konto anmeldefähig bleibt. Gibt es keines,
 * erhalten alle Administratoren das Erstpasswort mit erzwungener Änderung; fehlt
 * auch ein Administrator, wird das Konto aus der Grundkonfiguration wiederhergestellt.
 * Damit kann sich ein Datenbestand nie dauerhaft selbst aussperren.
 */
function ensureLoginPossible(users: User[]): User[] {
  if (users.some((u) => u.passwordHash && u.passwordSalt)) return users
  if (users.some((u) => u.role === 'admin')) {
    return users.map((u) => (u.role === 'admin' ? withInitialPassword(u) : u))
  }
  const rescue = createLiveInitialState().users[0]
  return [withInitialPassword(rescue), ...users.filter((u) => u.id !== rescue.id)]
}

/**
 * Bestehende Speicherstände auf die Anmeldung umstellen.
 * Im Demo-Modus erhalten Konten ohne Passwort das des gleichnamigen Beispielkontos,
 * damit die dokumentierten Demo-Zugänge auch für alte Stände gelten. Im Live-Modus
 * gilt das bewusst nicht – ein echter Datenbestand trägt nie ein Demo-Passwort.
 */
function migrateAuth(parsed: AppState): AppState {
  const seedById = new Map(SEED_USERS.map((u) => [u.id, u]))
  let users = parsed.users ?? []

  // Im Demo-Modus gelten die dokumentierten Beispiel-Passwörter auch für alte Stände
  if (parsed.mode === 'demo') {
    users = users.map((u) => {
      if (u.passwordHash && u.passwordSalt) return u
      const seed = seedById.get(u.id)
      return seed?.passwordHash && seed.passwordSalt
        ? { ...u, passwordSalt: seed.passwordSalt, passwordHash: seed.passwordHash }
        : u
    })
  }

  // Einmalige Korrektur: Eine frühere Fassung hat Live-Beständen die Demo-Passwörter
  // zugewiesen. Betroffene Konten erhalten direkt das Erstpasswort mit erzwungenem
  // Wechsel. Selbst vergebene Passwörter bleiben unberührt.
  if (parsed.mode === 'live' && (parsed.authVersion ?? 0) < AUTH_MIGRATION_VERSION) {
    const seedHashes = new Set(SEED_USERS.map((u) => u.passwordHash))
    users = users.map((u) =>
      u.passwordHash && seedHashes.has(u.passwordHash) ? withInitialPassword(u) : u,
    )
  }

  return {
    ...parsed,
    users: ensureLoginPossible(users),
    session: parsed.session ?? null,
    authVersion: AUTH_MIGRATION_VERSION,
  }
}

/** Live-Modus: aktive ausgehende Webhooks bei Alarmauslösung tatsächlich aufrufen */
function sendOutboundWebhooks(state: AppState, alarm: Alarm) {
  const scenario = state.scenarios.find((s) => s.id === alarm.scenarioId)
  const payload = JSON.stringify({
    event: 'alarm.triggered',
    alarmId: alarm.id,
    scenario: scenario?.title ?? alarm.scenarioId,
    message: alarm.message,
    silent: alarm.silent,
    triggeredAt: new Date(alarm.triggeredAt).toISOString(),
    locations: alarm.locationIds,
    groups: alarm.groupIds,
    channels: alarm.channels,
  })
  for (const wh of state.integrations.webhooks.filter((w) => w.active && w.direction === 'outbound')) {
    fetch(wh.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => {
      // Zielsystem nicht erreichbar – Alarm bleibt trotzdem erfasst
    })
  }
}

// ---------- Context / Provider ----------

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null)

function loadStateFor(mode: AppMode): AppState {
  try {
    const raw = localStorage.getItem(DATA_KEYS[mode])
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.users && parsed.scenarios) {
        parsed.mode = mode
        // Einmalige Inhalts-Aktualisierung: Standard-Szenarien auf neue Version heben,
        // selbst erstellte Szenarien (custom) bleiben unverändert erhalten
        if ((parsed.scenarioContentVersion ?? 1) < SCENARIO_CONTENT_VERSION) {
          const customScenarios = parsed.scenarios.filter((sc) => sc.custom)
          parsed.scenarios = [...SEED_SCENARIOS, ...customScenarios]
          parsed.scenarioContentVersion = SCENARIO_CONTENT_VERSION
        }
        // Migration: Emoji-Icons auf Icon-Schlüssel umstellen, fehlende Szenario-Felder auffüllen
        parsed.scenarios = parsed.scenarios.map((s) => ({
          ...s,
          priority: s.priority ?? 'mittel',
          followUp: s.followUp ?? [],
          defaultChannels: s.defaultChannels ?? [],
          responsibleGroupIds: s.responsibleGroupIds ?? [],
          contactIds: s.contactIds ?? [],
          icon: LEGACY_EMOJI_TO_ICON[s.icon] ?? s.icon,
        }))
        return migrateAuth(parsed)
      }
    }
  } catch {
    // korrupte Daten -> Neustart mit Seed
  }
  return mode === 'live' ? createLiveInitialState() : createInitialState()
}

function loadState(): AppState {
  let mode: AppMode = 'demo'
  try {
    if (localStorage.getItem(MODE_KEY) === 'live') mode = 'live'
  } catch {
    // kein Storage verfügbar -> Demo
  }
  return loadStateFor(mode)
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, loadState)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)
  const lastToast = useRef({ message: '', ts: 0 })

  const pushToast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const now = Date.now()
    if (lastToast.current.message === message && now - lastToast.current.ts < 1500) return
    lastToast.current = { message, ts: now }
    const id = ++toastId.current
    setToasts((t) => [...t.slice(-2), { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const stateRef = useRef(state)
  stateRef.current = state
  /** markiert einen Zustand, der aus einem anderen Tab stammt */
  const adopted = useRef(false)

  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action)
      if (action.type === 'TRIGGER_ALARM' && stateRef.current.mode === 'live') {
        sendOutboundWebhooks(stateRef.current, action.alarm)
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
    // Ein von aussen übernommener Zustand wird nicht zurückgeschrieben,
    // sonst schaukeln sich zwei Tabs gegenseitig hoch
    if (adopted.current) {
      adopted.current = false
      return
    }
    try {
      localStorage.setItem(DATA_KEYS[state.mode], JSON.stringify(state))
      localStorage.setItem(MODE_KEY, state.mode)
    } catch {
      // Speicher voll – Offline-Cache nicht kritisch
    }
  }, [state])

  // Portal und App-Vorschau laufen in getrennten Tabs auf demselben Speicher.
  // Ohne diesen Abgleich arbeitet jeder Tab auf einem veralteten Stand und
  // überschreibt beim nächsten Schreiben die Änderungen des anderen.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DATA_KEYS[stateRef.current.mode] || !e.newValue) return
      try {
        const incoming = JSON.parse(e.newValue) as AppState
        if (!incoming.users || !incoming.scenarios) return
        adopted.current = true
        rawDispatch({ type: 'ADOPT_EXTERNAL', state: incoming })
      } catch {
        // unlesbarer Fremdstand -> eigenen Zustand behalten
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => rawDispatch({ type: 'TICK', now: Date.now() }), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
      <ToastHost toasts={toasts} />
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden')
  return ctx
}
