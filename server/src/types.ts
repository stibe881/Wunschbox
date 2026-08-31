export type Role = 'admin' | 'krisenstab' | 'mitarbeiter'

export type Channel = 'push' | 'sms' | 'email' | 'voice' | 'conference' | 'tts' | 'teams'

export const CHANNEL_LABELS: Record<Channel, string> = {
  push: 'Push-Mitteilung (Critical Alert)',
  sms: 'SMS',
  email: 'E-Mail',
  voice: 'Sprachanruf',
  conference: 'Telefonkonferenz',
  tts: 'Text-to-Speech-Durchsage',
  teams: 'Microsoft Teams',
}

/** Benutzer, wie er in der Datenbank liegt – mit Passwortfeldern */
export interface StoredUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: Role
  groupIds: string[]
  locationId: string
  language: 'de' | 'en' | 'fr' | 'it'
  absence?: { from: string; to: string }
  partTimeNote?: string
  passwordHash?: string
  passwordSalt?: string
  mustChangePassword?: boolean
  lastLoginAt?: number
}

/** Benutzer, wie ihn die Clients erhalten – ohne Passwortdaten */
export type User = Omit<StoredUser, 'passwordHash' | 'passwordSalt'> & { hasPassword: boolean }

export interface Group {
  id: string
  name: string
  description: string
  isCrisisTeam: boolean
}

export interface Location {
  id: string
  name: string
  address: string
  geofence?: { lat: number; lng: number; radiusM: number }
  operatingHours: { days: string; open: string; close: string }
}

export type ScenarioPriority = 'hoch' | 'mittel' | 'tief'

export interface Scenario {
  id: string
  icon: string
  title: string
  category: string
  priority: ScenarioPriority
  /** Sofortmassnahmen – Schritt für Schritt */
  instructions: string[]
  /** Weiterführende Massnahmen nach der Akutphase */
  followUp: string[]
  checklist: string[]
  silentDefault: boolean
  /** Vorauswahl der Alarmierungskanäle beim Auslösen */
  defaultChannels: Channel[]
  /** Zuständige Gruppen – werden beim Auslösen vorausgewählt */
  responsibleGroupIds: string[]
  /** Verknüpfte Notfallkontakte (extern) */
  contactIds: string[]
  /**
   * Was beim Notruf zu sagen ist und wann überhaupt einer nötig ist.
   * Gehört in die Phase «Alarmieren» – die Sofortmassnahmen enthalten deshalb
   * keine Anweisungen mehr zum Anrufen oder Auslösen.
   */
  callGuidance?: string[]
  /**
   * Schweizer Rechtsgrundlagen und Normen, die für dieses Szenario gelten.
   * Orientierungshilfe – keine Rechtsberatung.
   */
  legalBasis?: string[]
  /**
   * Nur aktive Szenarien erscheinen in der App und bei der Alarmauslösung.
   * Inaktive bleiben in der Verwaltung ausgegraut erhalten. Fehlt das Feld,
   * gilt das Szenario als aktiv.
   */
  active?: boolean
  custom?: boolean
}

export interface EscalationLevel {
  afterMinutes: number
  channels: Channel[]
  groupIds: string[]
  notifyEmergencyServices: boolean
}

export interface AlarmPlan {
  id: string
  name: string
  scenarioId?: string
  locationIds: string[]
  groupIds: string[]
  channels: Channel[]
  requireAck: boolean
  respectOperatingHours: boolean
  escalation: EscalationLevel[]
}

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed'
export type AckStatus = 'none' | 'acknowledged' | 'declined'

export interface Delivery {
  id: string
  userId: string
  channel: Channel
  status: DeliveryStatus
  ack: AckStatus
  updatedAt: number
}

export interface AlarmLogEntry {
  ts: number
  message: string
}

export interface Alarm {
  id: string
  scenarioId: string
  planId?: string
  message: string
  silent: boolean
  requireAck: boolean
  triggeredByUserId: string
  triggeredVia: 'app' | 'web' | 'hotline' | 'button' | 'timer' | 'webhook'
  triggeredAt: number
  locationIds: string[]
  groupIds: string[]
  channels: Channel[]
  status: 'active' | 'ended'
  endedAt?: number
  escalationStage: number
  escalation: EscalationLevel[]
  deliveries: Delivery[]
  log: AlarmLogEntry[]
}

export interface AlarmButton {
  id: string
  name: string
  type: 'lorawan' | 'gsm'
  serial: string
  locationId?: string
  assignedUserId?: string
  batteryPct: number
  lastSeen: number
  gps?: { lat: number; lng: number }
  messageTemplate: string
  targetGroupIds: string[]
  escalateToEmergencyServicesAfterMin: number
}

export interface LoneWorkSession {
  id: string
  userId: string
  locationId: string
  activity: string
  startedAt: number
  durationMin: number
  expiresAt: number
  silent: boolean
  status: 'running' | 'completed' | 'alarm'
}

export interface Webhook {
  id: string
  name: string
  url: string
  direction: 'inbound' | 'outbound'
  scenarioId?: string
  active: boolean
}

export interface AccessCode {
  code: string
  locationId: string
  role: Role
  createdAt: number
  used: number
}

export interface IntegrationSettings {
  smsGateway: { enabled: boolean; provider: string; senderId: string }
  voip: { enabled: boolean; sipServer: string }
  teams: { enabled: boolean; tenant: string }
  sso: { enabled: boolean; provider: string; entityId: string }
  hrSync: { enabled: boolean; system: string; lastSync?: number }
  hotline: { enabled: boolean; number: string }
  multiLanguage: boolean
  geofencing: boolean
  webhooks: Webhook[]
  accessCodes: AccessCode[]
}

export interface EmergencyContact {
  id: string
  name: string
  number: string
  description: string
}

export interface AuditEntry {
  id: string
  ts: number
  type: string
  message: string
  userId?: string
}

/** Vollständiger Datenbestand, wie ihn die Clients erhalten */
export interface ServerState {
  users: User[]
  groups: Group[]
  locations: Location[]
  scenarios: Scenario[]
  plans: AlarmPlan[]
  alarms: Alarm[]
  buttons: AlarmButton[]
  loneWorkSessions: LoneWorkSession[]
  integrations: IntegrationSettings
  contacts: EmergencyContact[]
  audit: AuditEntry[]
}
