import React, { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import {
  BellRing, Check, CheckCircle2, ChevronLeft, Clock, MapPin, Phone, Play, Search as SearchIcon,
  ShieldAlert, Siren, Timer, X,
} from 'lucide-react-native'
import { createAlarm, uid, useStore } from './store'
import { ScenarioIcon } from './ScenarioIcon'
import { cancelScheduled, ensurePermissions, getPushToken, remotePushAvailability, scheduleAt } from './notifications'
import { SEED_CONTACTS, SEED_LOCATIONS, SEED_SCENARIOS, SEED_USERS, SEED_GROUPS } from './seed'
import type { LoneWorkSession, Scenario } from './types'
import { Badge, Card, HoldButton, colors, formatDuration, formatRelative } from './ui'

// ---------- Start: Alarme + SOS ----------

export function StartScreen({ onOpenScenario }: { onOpenScenario: (s: Scenario) => void }) {
  const { state, dispatch } = useStore()
  const me = SEED_USERS.find((u) => u.id === state.currentUserId) ?? SEED_USERS[0]
  const mySos = state.alarms.filter((a) => a.status === 'active' && a.triggeredByUserId === me.id)
  const myAlarms = state.alarms.filter(
    (a) => a.status === 'active' && a.triggeredByUserId !== me.id && a.deliveries.some((d) => d.userId === me.id),
  )

  function sos() {
    const location = SEED_LOCATIONS.find((l) => l.id === me.locationId)
    dispatch({
      type: 'TRIGGER_ALARM',
      alarm: createAlarm({
        scenarioId: 'sc-medizin',
        message: `SOS-Alarm von ${me.firstName} ${me.lastName} (App) – Standort: ${location?.name ?? 'unbekannt'}`,
        silent: false,
        requireAck: true,
        channels: ['push', 'sms', 'voice'],
        groupIds: ['gr-ersthelfer', 'gr-sicherheit'],
        locationIds: [me.locationId],
        triggeredByUserId: me.id,
        triggeredVia: 'app',
        escalation: [{ afterMinutes: 3, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true }],
      }),
    })
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {mySos.map((a) => {
        const delivered = a.deliveries.filter((d) => d.status === 'delivered').length
        const helpers = [...new Set(a.deliveries.filter((d) => d.ack === 'acknowledged').map((d) => d.userId))]
          .map((id) => SEED_USERS.find((u) => u.id === id))
          .filter(Boolean)
        return (
          <Card key={a.id} style={{ borderColor: colors.brandLight, borderWidth: 2 }}>
            <View style={styles.row}>
              <Siren size={18} color={colors.brand} />
              <Text style={[styles.cardTitle, { color: colors.brand, flex: 1 }]}>Ihr Alarm ist aktiv</Text>
              <Text style={styles.faint}>{formatRelative(a.triggeredAt)}</Text>
            </View>
            <Text style={styles.body}>{delivered}/{a.deliveries.length} Benachrichtigungen zugestellt</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${a.deliveries.length ? (delivered / a.deliveries.length) * 100 : 0}%` }]} />
            </View>
            {helpers.length > 0 ? (
              <View style={[styles.row, { marginTop: 8 }]}>
                <CheckCircle2 size={15} color={colors.green} />
                <Text style={{ color: colors.green, fontWeight: '600', flex: 1 }}>
                  {helpers.map((u) => `${u!.firstName} ${u!.lastName}`).join(', ')} {helpers.length === 1 ? 'kommt' : 'kommen'}
                </Text>
              </View>
            ) : (
              <Text style={[styles.muted, { marginTop: 8 }]}>Warten auf Rückmeldung der Einsatzkräfte…</Text>
            )}
            <Pressable
              style={styles.outlineButton}
              onPress={() =>
                Alert.alert('Entwarnung', 'Entwarnung geben und den Alarm beenden?', [
                  { text: 'Abbrechen', style: 'cancel' },
                  { text: 'Entwarnung geben', style: 'destructive', onPress: () => dispatch({ type: 'END_ALARM', alarmId: a.id }) },
                ])
              }
            >
              <Text style={styles.outlineButtonText}>Entwarnung – mir geht es gut</Text>
            </Pressable>
          </Card>
        )
      })}

      {myAlarms.map((a) => {
        const scenario = SEED_SCENARIOS.find((s) => s.id === a.scenarioId)
        const myAck = a.deliveries.find((d) => d.userId === me.id)?.ack ?? 'none'
        return (
          <Card key={a.id} style={{ borderColor: a.silent ? colors.violet : colors.brandLight, borderWidth: 2 }}>
            <View style={styles.row}>
              <BellRing size={18} color={a.silent ? colors.violet : colors.brand} />
              <Text style={[styles.cardTitle, { flex: 1 }]}>{scenario?.title}</Text>
              {a.silent && <Badge label="still" color="violet" />}
            </View>
            <Text style={styles.body}>{a.message}</Text>
            {scenario && (
              <Pressable style={styles.darkButton} onPress={() => onOpenScenario(scenario)}>
                <Text style={styles.darkButtonText}>Handlungsanweisungen öffnen</Text>
              </Pressable>
            )}
            {a.requireAck && myAck === 'none' && (
              <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
                <Pressable
                  style={[styles.ackButton, { backgroundColor: colors.green }]}
                  onPress={() => dispatch({ type: 'ACK_ALARM', alarmId: a.id, userId: me.id, ack: 'acknowledged' })}
                >
                  <Check size={15} color="#fff" />
                  <Text style={styles.ackButtonText}>Ich komme</Text>
                </Pressable>
                <Pressable
                  style={[styles.ackButton, { backgroundColor: '#cbd5e1' }]}
                  onPress={() => dispatch({ type: 'ACK_ALARM', alarmId: a.id, userId: me.id, ack: 'declined' })}
                >
                  <X size={15} color={colors.text} />
                  <Text style={[styles.ackButtonText, { color: colors.text }]}>Nicht verfügbar</Text>
                </Pressable>
              </View>
            )}
            {a.requireAck && myAck !== 'none' && (
              <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                <Badge
                  label={myAck === 'acknowledged' ? 'quittiert – Sie nehmen teil' : 'als nicht verfügbar gemeldet'}
                  color={myAck === 'acknowledged' ? 'green' : 'slate'}
                />
              </View>
            )}
          </Card>
        )
      })}

      {myAlarms.length === 0 && mySos.length === 0 && (
        <Card style={{ alignItems: 'center' }}>
          <CheckCircle2 size={28} color={colors.green} />
          <Text style={[styles.cardTitle, { marginTop: 6 }]}>Keine aktiven Alarme</Text>
          <Text style={styles.faint}>Sie werden bei einem Ereignis sofort benachrichtigt.</Text>
        </Card>
      )}

      {mySos.length === 0 && (
        <>
          <HoldButton label="SOS" onTrigger={sos} />
          <Text style={[styles.faint, { textAlign: 'center' }]}>
            Alarmiert sofort Schulsanität und Hausdienst an Ihrem Standort – mit automatischer Eskalation.
          </Text>
        </>
      )}

      <Pressable style={styles.contactRow} onPress={() => Linking.openURL('tel:+41410001122')}>
        <Phone size={18} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Interne Notfallnummer</Text>
          <Text style={styles.faint}>Alarmauslösung per Anruf</Text>
        </View>
        <Text style={styles.contactNumber}>+41 41 000 11 22</Text>
      </Pressable>
    </ScrollView>
  )
}

// ---------- Szenarien ----------

export function ScenariosScreen({ onOpen }: { onOpen: (s: Scenario) => void }) {
  const [search, setSearch] = useState('')
  const filtered = SEED_SCENARIOS.filter((s) => !search || s.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.searchBox}>
        <SearchIcon size={16} color={colors.faint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szenario suchen…"
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.grid}>
        {filtered.map((s) => (
          <Pressable key={s.id} style={styles.tile} onPress={() => onOpen(s)}>
            <ScenarioIcon name={s.icon} size={22} color={s.priority === 'hoch' ? colors.brand : colors.muted} />
            <Text style={styles.tileTitle}>{s.title}</Text>
            <Text style={styles.faint}>{s.category}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

export function ScenarioDetailScreen({ scenario, onBack }: { scenario: Scenario; onBack: () => void }) {
  const { state, dispatch } = useStore()
  const [phase, setPhase] = useState<number | null>(null)
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})
  const [checkedList, setCheckedList] = useState<Record<number, boolean>>({})
  const [notifiedUserIds, setNotifiedUserIds] = useState<string[]>([])

  const me = SEED_USERS.find((u) => u.id === state.currentUserId) ?? SEED_USERS[0]
  const myLocation = SEED_LOCATIONS.find((l) => l.id === me.locationId)
  const contacts = SEED_CONTACTS.filter((c) => scenario.contactIds.includes(c.id))
  const responsibleGroups = SEED_GROUPS.filter((g) => scenario.responsibleGroupIds.includes(g.id))
  const crisisGroups = SEED_GROUPS.filter((g) => g.isCrisisTeam)
  const crisisMembers = SEED_USERS.filter((u) => u.id !== me.id && u.groupIds.some((g) => crisisGroups.some((cg) => cg.id === g)))

  const myScenarioAlarm = state.alarms.find(
    (a) => a.status === 'active' && a.scenarioId === scenario.id && a.triggeredByUserId === me.id && !a.message.startsWith('Info an') && !a.message.startsWith('Krisenteam-Aufgebot'),
  )
  const myCrisisAlarm = state.alarms.find(
    (a) => a.status === 'active' && a.triggeredByUserId === me.id && a.message.startsWith('Krisenteam-Aufgebot'),
  )

  const PHASES = [
    { title: 'Alarmieren', hint: 'Notruf & interne Alarmierung' },
    { title: 'Sofortmassnahmen', hint: `${scenario.instructions.length} Schritte` },
    { title: 'Informieren', hint: 'Krisenteam aufbieten & benachrichtigen' },
    { title: 'Weitere Massnahmen', hint: 'Nachbearbeitung & Checkliste' },
  ]

  function triggerGroupAlarm() {
    const groupIds = responsibleGroups.length > 0 ? responsibleGroups.map((g) => g.id) : ['gr-alle']
    dispatch({
      type: 'TRIGGER_ALARM',
      alarm: createAlarm({
        scenarioId: scenario.id,
        message: `${scenario.title}: Alarm aus Handlungsanweisung von ${me.firstName} ${me.lastName} – Standort ${myLocation?.name ?? 'unbekannt'}.`,
        silent: scenario.silentDefault,
        requireAck: true,
        channels: scenario.defaultChannels.length > 0 ? scenario.defaultChannels : ['push', 'sms'],
        groupIds,
        locationIds: [me.locationId],
        triggeredByUserId: me.id,
        triggeredVia: 'app',
        escalation: [{ afterMinutes: 5, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: false }],
      }),
    })
  }

  function triggerCrisisTeam() {
    dispatch({
      type: 'TRIGGER_ALARM',
      alarm: createAlarm({
        scenarioId: scenario.id,
        message: `Krisenteam-Aufgebot (${scenario.title}) durch ${me.firstName} ${me.lastName} – bitte quittieren.`,
        silent: false,
        requireAck: true,
        channels: ['push', 'sms', 'voice'],
        groupIds: crisisGroups.map((g) => g.id),
        locationIds: [],
        triggeredByUserId: me.id,
        triggeredVia: 'app',
      }),
    })
  }

  function notifyMember(userId: string) {
    const user = SEED_USERS.find((u) => u.id === userId)
    dispatch({
      type: 'TRIGGER_ALARM',
      alarm: createAlarm({
        scenarioId: scenario.id,
        message: `Info an ${user?.firstName} ${user?.lastName}: ${scenario.title} – bitte bei ${me.firstName} ${me.lastName} melden.`,
        silent: true,
        requireAck: true,
        channels: ['push', 'sms'],
        groupIds: [],
        locationIds: [],
        triggeredByUserId: me.id,
        triggeredVia: 'app',
        recipientUserIds: [userId],
      }),
    })
    setNotifiedUserIds((ids) => [...ids, userId])
  }

  function AlarmStatus({ alarm }: { alarm: NonNullable<typeof myScenarioAlarm> }) {
    const delivered = alarm.deliveries.filter((d) => d.status === 'delivered').length
    const acked = [...new Set(alarm.deliveries.filter((d) => d.ack === 'acknowledged').map((d) => d.userId))].length
    return (
      <View style={{ borderWidth: 2, borderColor: colors.green, backgroundColor: colors.greenBg, borderRadius: 14, padding: 13 }}>
        <View style={styles.row}>
          <CheckCircle2 size={16} color={colors.green} />
          <Text style={{ color: '#065f46', fontWeight: '700', fontSize: 14 }}>
            Alarm ausgelöst <Text style={{ fontWeight: '400' }}>{formatRelative(alarm.triggeredAt)}</Text>
          </Text>
        </View>
        <Text style={{ color: '#047857', fontSize: 13, marginTop: 4 }}>
          {delivered}/{alarm.deliveries.length} zugestellt · {acked} quittiert – Live-Status auf dem Start-Tab.
        </Text>
      </View>
    )
  }

  const header = (
    <View style={[styles.row, { marginBottom: 12 }]}>
      <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.brandBg, alignItems: 'center', justifyContent: 'center' }}>
        <ScenarioIcon name={scenario.icon} size={24} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.h1}>{scenario.title}</Text>
        {phase !== null && <Text style={styles.faint}>Phase {phase + 1} von {PHASES.length} · {PHASES[phase].title}</Text>}
      </View>
    </View>
  )

  if (phase === null) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Pressable onPress={onBack} style={[styles.row, { marginBottom: 4 }]}>
          <ChevronLeft size={18} color={colors.muted} />
          <Text style={styles.muted}>Zurück</Text>
        </Pressable>
        {header}
        {PHASES.map((p, i) => (
          <Pressable
            key={p.title}
            style={[styles.row, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 15 }]}
            onPress={() => setPhase(i)}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.faint}>{p.hint}</Text>
            </View>
            <ChevronLeft size={16} color={colors.faint} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        ))}
        <Pressable style={[styles.bigButton, { backgroundColor: colors.dark }]} onPress={() => setPhase(0)}>
          <Play size={16} color="#fff" />
          <Text style={styles.bigButtonText}>Geführt starten</Text>
        </Pressable>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={() => setPhase(null)} style={[styles.row, { marginBottom: 4 }]}>
        <ChevronLeft size={18} color={colors.muted} />
        <Text style={styles.muted}>Übersicht</Text>
      </Pressable>
      {header}

      {phase === 0 && (
        <>
          {contacts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Bei unmittelbarer Gefahr zuerst den Notruf wählen:</Text>
              {contacts.map((c) => (
                <Pressable key={c.id} style={styles.callButton} onPress={() => Linking.openURL(`tel:${c.number}`)}>
                  <Phone size={18} color="#fff" />
                  <Text style={styles.callButtonText}>{c.name} anrufen</Text>
                  <Text style={styles.callButtonNumber}>{c.number}</Text>
                </Pressable>
              ))}
            </>
          )}
          <Text style={styles.sectionTitle}>Interne Alarmierung{scenario.silentDefault ? ' (still)' : ''}</Text>
          <Text style={styles.faint}>
            Alarmiert {responsibleGroups.length > 0 ? responsibleGroups.map((g) => g.name).join(', ') : 'alle Mitarbeitenden'} an Ihrem Standort – mit Quittierung.
          </Text>
          {myScenarioAlarm ? (
            <AlarmStatus alarm={myScenarioAlarm} />
          ) : (
            <HoldButton
              label={`${responsibleGroups.length > 0 ? responsibleGroups.map((g) => g.name).join(' & ') : 'Alle'} alarmieren`}
              hint="Zum Alarmieren gedrückt halten"
              onTrigger={triggerGroupAlarm}
            />
          )}
        </>
      )}

      {phase === 1 && (
        <>
          <Text style={styles.faint}>Schritte antippen, wenn erledigt:</Text>
          {scenario.instructions.map((step, i) => (
            <Pressable key={i} style={styles.stepRow} onPress={() => setCheckedSteps({ ...checkedSteps, [i]: !checkedSteps[i] })}>
              <View style={[styles.stepNumber, checkedSteps[i] && { backgroundColor: colors.green }]}>
                {checkedSteps[i] ? <Check size={13} color="#fff" /> : <Text style={styles.stepNumberText}>{i + 1}</Text>}
              </View>
              <Text style={[styles.body, { flex: 1, marginTop: 2 }, checkedSteps[i] && { color: colors.faint, textDecorationLine: 'line-through' }]}>
                {step}
              </Text>
            </Pressable>
          ))}
        </>
      )}

      {phase === 2 && (
        <>
          {myCrisisAlarm ? (
            <AlarmStatus alarm={myCrisisAlarm} />
          ) : (
            <HoldButton label="Krisenteam aufbieten" hint="Zum Aufbieten gedrückt halten" onTrigger={triggerCrisisTeam} />
          )}
          <Text style={styles.faint}>
            Aufgebot per Push, SMS und Sprachanruf mit Quittierung – oder einzelne Mitglieder direkt kontaktieren:
          </Text>
          {crisisMembers.map((u) => {
            const memberGroups = SEED_GROUPS.filter((g) => g.isCrisisTeam && u.groupIds.includes(g.id))
            const notified = notifiedUserIds.includes(u.id)
            return (
              <View key={u.id} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 }}>
                <Text style={styles.cardTitle}>{u.firstName} {u.lastName}</Text>
                <Text style={styles.faint}>{memberGroups.map((g) => g.name).join(', ')}</Text>
                <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
                  <Pressable
                    style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 9 }}
                    onPress={() => Linking.openURL(`tel:${u.phone.replace(/\s/g, '')}`)}
                  >
                    <Phone size={13} color={colors.text} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>Anrufen</Text>
                  </Pressable>
                  <Pressable
                    style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 9, backgroundColor: notified ? colors.greenBg : colors.dark }}
                    disabled={notified}
                    onPress={() => notifyMember(u.id)}
                  >
                    {notified ? <Check size={13} color={colors.green} /> : <BellRing size={13} color="#fff" />}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: notified ? colors.green : '#fff' }}>
                      {notified ? 'Gesendet' : 'SMS & Push'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )
          })}
        </>
      )}

      {phase === 3 && (
        <>
          {scenario.followUp.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Nach der Akutphase</Text>
              {scenario.followUp.map((step, i) => (
                <Text key={i} style={[styles.body, { marginBottom: 4 }]}>– {step}</Text>
              ))}
            </>
          )}
          <Text style={styles.sectionTitle}>Checkliste</Text>
          {scenario.checklist.map((item, i) => (
            <Pressable key={i} style={styles.checkRow} onPress={() => setCheckedList({ ...checkedList, [i]: !checkedList[i] })}>
              <View style={[styles.checkbox, checkedList[i] && { backgroundColor: colors.green, borderColor: colors.green }]}>
                {checkedList[i] && <Check size={13} color="#fff" />}
              </View>
              <Text style={[styles.body, { flex: 1 }, checkedList[i] && { textDecorationLine: 'line-through', color: colors.faint }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </>
      )}

      <View style={[styles.row, { gap: 8, marginTop: 8 }]}>
        <Pressable
          style={{ flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}
          onPress={() => setPhase(phase === 0 ? null : phase - 1)}
        >
          <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }}>Zurück</Text>
        </Pressable>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.dark, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}
          onPress={() => (phase === PHASES.length - 1 ? setPhase(null) : setPhase(phase + 1))}
        >
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: 14 }}>{phase === PHASES.length - 1 ? 'Abschliessen' : 'Weiter'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

// ---------- Alleinarbeit ----------

// Geplante Timer-Benachrichtigungen pro Sitzung (überleben den App-Neustart als iOS-Planung;
// die Zuordnung hier genügt für Verlängern/Beenden innerhalb der laufenden App)
const loneWorkNotifIds = new Map<string, (string | null)[]>()

async function scheduleLoneWorkNotifications(sessionId: string, activity: string, expiresAt: number) {
  await cancelScheduled(loneWorkNotifIds.get(sessionId) ?? [])
  const warnAt = expiresAt - 5 * 60_000
  const ids = await Promise.all([
    scheduleAt('Alleinarbeit: Timer läuft bald ab', `Noch 5 Minuten (${activity}) – Lebenszeichen geben, sonst wird alarmiert.`, warnAt),
    scheduleAt('Alleinarbeit: Alarm ausgelöst', `Timer abgelaufen (${activity}) – Schulsanität und Hausdienst werden alarmiert.`, expiresAt),
  ])
  loneWorkNotifIds.set(sessionId, ids)
}

export function LoneWorkScreen() {
  const { state, dispatch } = useStore()
  const me = SEED_USERS.find((u) => u.id === state.currentUserId) ?? SEED_USERS[0]
  const [activity, setActivity] = useState('')
  const [durationMin, setDurationMin] = useState(30)
  const [silent, setSilent] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const mySessions = state.loneWorkSessions.filter((s) => s.userId === me.id)
  const running = mySessions.find((s) => s.status === 'running')

  function start() {
    const session: LoneWorkSession = {
      id: uid('lw'),
      userId: me.id,
      locationId: me.locationId,
      activity: activity || 'Alleinarbeit',
      startedAt: Date.now(),
      durationMin,
      expiresAt: Date.now() + durationMin * 60_000,
      silent,
      status: 'running',
    }
    dispatch({ type: 'START_LONE_WORK', session })
    scheduleLoneWorkNotifications(session.id, session.activity, session.expiresAt)
    setActivity('')
  }

  if (running) {
    const remaining = running.expiresAt - now
    const critical = remaining < 5 * 60_000
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Card style={{ alignItems: 'center', borderWidth: 2, borderColor: critical ? colors.brandLight : colors.border }}>
          <Text style={styles.muted}>{running.activity}</Text>
          <Text style={[styles.countdown, critical && { color: colors.brand }]}>{formatDuration(remaining)}</Text>
          <Text style={[styles.faint, { textAlign: 'center', marginBottom: 14 }]}>
            {critical ? 'Bald läuft der Timer ab – Lebenszeichen geben!' : 'Läuft der Timer ab, wird automatisch alarmiert.'}
          </Text>
          <Pressable
            style={[styles.bigButton, { backgroundColor: colors.green }]}
            onPress={() => {
              dispatch({ type: 'EXTEND_LONE_WORK', sessionId: running.id, minutes: running.durationMin })
              scheduleLoneWorkNotifications(running.id, running.activity, running.expiresAt + running.durationMin * 60_000)
            }}
          >
            <Clock size={18} color="#fff" />
            <Text style={styles.bigButtonText}>Lebenszeichen (+{running.durationMin} Min.)</Text>
          </Pressable>
          <Pressable
            style={[styles.bigButton, { backgroundColor: colors.dark, marginTop: 8 }]}
            onPress={() => {
              dispatch({ type: 'COMPLETE_LONE_WORK', sessionId: running.id })
              cancelScheduled(loneWorkNotifIds.get(running.id) ?? [])
              loneWorkNotifIds.delete(running.id)
            }}
          >
            <CheckCircle2 size={16} color="#fff" />
            <Text style={styles.bigButtonText}>Arbeit sicher beendet</Text>
          </Pressable>
        </Card>
        {running.silent && <Text style={[styles.faint, { textAlign: 'center' }]}>Stille Alarmauslösung aktiviert.</Text>}
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <View style={[styles.row, { marginBottom: 10 }]}>
          <Timer size={18} color={colors.text} />
          <Text style={styles.cardTitle}>Alleinarbeit starten</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Tätigkeit (z. B. Abendrundgang, Wartung)"
          placeholderTextColor={colors.faint}
          value={activity}
          onChangeText={setActivity}
        />
        <Text style={[styles.body, { marginTop: 12, fontWeight: '600' }]}>Timer: {durationMin} Minuten</Text>
        <View style={[styles.row, { marginTop: 8, flexWrap: 'wrap', gap: 8 }]}>
          {[5, 15, 30, 45, 60, 90].map((m) => (
            <Pressable
              key={m}
              onPress={() => setDurationMin(m)}
              style={[styles.chip, durationMin === m && { backgroundColor: colors.dark }]}
            >
              <Text style={[styles.chipText, durationMin === m && { color: '#fff' }]}>{m} Min.</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.row, { marginTop: 14 }]}>
          <Switch value={silent} onValueChange={setSilent} />
          <Text style={styles.body}>Stille Alarmauslösung</Text>
        </View>
        <Pressable style={[styles.bigButton, { backgroundColor: colors.dark, marginTop: 14 }]} onPress={start}>
          <Play size={16} color="#fff" />
          <Text style={styles.bigButtonText}>Timer starten</Text>
        </Pressable>
        <Text style={[styles.faint, { marginTop: 8 }]}>
          Melden Sie sich vor Ablauf zurück – sonst alarmiert das System automatisch Schulsanität und Hausdienst.
        </Text>
      </Card>

      {mySessions.length > 0 && (
        <Card>
          <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Verlauf</Text>
          {mySessions.slice(0, 6).map((s) => (
            <View key={s.id} style={[styles.row, { paddingVertical: 5 }]}>
              <Text style={[styles.body, { flex: 1 }]} numberOfLines={1}>{s.activity}</Text>
              {s.status === 'completed' && <Badge label="beendet" color="green" />}
              {s.status === 'alarm' && <Badge label="Alarm ausgelöst" color="red" />}
              {s.status === 'running' && <Badge label="läuft" color="amber" />}
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  )
}

// ---------- Notruf ----------

export function ContactsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {SEED_CONTACTS.map((c) => (
        <Pressable key={c.id} style={styles.contactRow} onPress={() => Linking.openURL(`tel:${c.number}`)}>
          <View style={styles.contactIcon}>
            <Phone size={17} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{c.name}</Text>
            <Text style={styles.faint} numberOfLines={1}>{c.description}</Text>
          </View>
          <Text style={styles.contactNumber}>{c.number}</Text>
        </Pressable>
      ))}
      <Text style={[styles.faint, { textAlign: 'center' }]}>Antippen ruft direkt an.</Text>
    </ScrollView>
  )
}

// ---------- Profil ----------

/** Demo/Live-Umschalter – nur für Admins sichtbar */
function ModeCard() {
  const { state, switchMode } = useStore()
  return (
    <Card>
      <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Modus</Text>
      <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 3 }}>
        {(['demo', 'live'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => switchMode(m)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: state.mode === m ? (m === 'live' ? '#059669' : '#f59e0b') : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                letterSpacing: 0.5,
                color: state.mode === m ? (m === 'live' ? '#fff' : '#0f172a') : colors.muted,
              }}
            >
              {m === 'demo' ? 'DEMO' : 'LIVE'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.faint, { marginTop: 8 }]}>
        {state.mode === 'demo'
          ? 'Beispieldaten, Zustellung und Rückmeldungen werden simuliert.'
          : 'Eigener Datenbestand ohne Simulation – Zustellungen bleiben offen, bis ein Versand-Gateway angebunden ist. Beide Modi behalten ihre Daten.'}
      </Text>
    </Card>
  )
}

function PushStatusCard() {
  const [granted, setGranted] = useState<boolean | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const remote = remotePushAvailability()

  useEffect(() => {
    ensurePermissions().then(setGranted)
  }, [])

  useEffect(() => {
    if (granted && remote.ok) getPushToken().then(setToken)
  }, [granted, remote.ok])

  return (
    <Card>
      <View style={styles.row}>
        <BellRing size={16} color={colors.muted} />
        <Text style={[styles.cardTitle, { flex: 1 }]}>Push-Benachrichtigungen</Text>
        <Badge
          label={granted === null ? 'prüfe…' : granted ? 'aktiv' : 'nicht erlaubt'}
          color={granted ? 'green' : 'amber'}
        />
      </View>
      <Text style={[styles.faint, { marginTop: 6 }]}>
        Lokale Benachrichtigungen (Alleinarbeits-Timer, SOS-Bestätigung) {granted ? 'sind aktiv – sie erscheinen auch bei gesperrtem Bildschirm.' : 'benötigen die Mitteilungs-Berechtigung (Einstellungen → Mitteilungen → Expo Go).'}
      </Text>
      {remote.ok ? (
        token ? (
          <>
            <Text style={[styles.faint, { marginTop: 8 }]}>Expo-Push-Token (für Test unter expo.dev/notifications):</Text>
            <Text selectable style={[styles.body, { fontSize: 12 }]}>{token}</Text>
          </>
        ) : (
          <Text style={[styles.faint, { marginTop: 8 }]}>
            Remote-Push bereit – Projekt mit «eas init» verknüpfen, dann erscheint hier der Push-Token.
          </Text>
        )
      ) : (
        <Text style={[styles.faint, { marginTop: 8 }]}>Remote-Push: {remote.reason}</Text>
      )}
    </Card>
  )
}

export function ProfileScreen() {
  const { state, dispatch } = useStore()
  const me = SEED_USERS.find((u) => u.id === state.currentUserId) ?? SEED_USERS[0]
  const myLocation = SEED_LOCATIONS.find((l) => l.id === me.locationId)
  const myGroups = SEED_GROUPS.filter((g) => me.groupIds.includes(g.id))

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{me.firstName[0]}{me.lastName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{me.firstName} {me.lastName}</Text>
            <Text style={styles.faint}>{me.email}</Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <MapPin size={14} color={colors.faint} />
          <Text style={styles.body}>{myLocation?.name}</Text>
        </View>
        <View style={[styles.row, { marginTop: 8, flexWrap: 'wrap', gap: 6 }]}>
          {myGroups.map((g) => <Badge key={g.id} label={g.name} />)}
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Demo: Benutzer wechseln</Text>
        {SEED_USERS.map((u) => (
          <Pressable
            key={u.id}
            style={[styles.row, { paddingVertical: 7 }]}
            onPress={() => dispatch({ type: 'SET_USER', userId: u.id })}
          >
            <View style={[styles.radio, u.id === me.id && { borderColor: colors.brand }]}>
              {u.id === me.id && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.body, { flex: 1 }]}>{u.firstName} {u.lastName}</Text>
            <Text style={styles.faint}>{u.role}</Text>
          </Pressable>
        ))}
      </Card>

      {me.role === 'admin' && <ModeCard />}

      <PushStatusCard />

      <Card>
        <View style={styles.row}>
          <ShieldAlert size={16} color={colors.muted} />
          <Text style={[styles.cardTitle, { flex: 1 }]}>Über diese App</Text>
        </View>
        <Text style={[styles.faint, { marginTop: 6 }]}>
          SOBE Notfall – Demo der Mitarbeiter-App (Expo). Der Alarmserver wird lokal simuliert:
          Zustellungen, Rückmeldungen der Einsatzkräfte und Eskalationen laufen auf dem Gerät.
          Es werden keine echten Benachrichtigungen versendet.
        </Text>
        <Pressable
          style={[styles.outlineButton, { marginTop: 12 }]}
          onPress={() =>
            Alert.alert('Zurücksetzen', 'Demo-Daten zurücksetzen?', [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Zurücksetzen', style: 'destructive', onPress: () => dispatch({ type: 'RESET' }) },
            ])
          }
        >
          <Text style={styles.outlineButtonText}>Demo zurücksetzen</Text>
        </Pressable>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 14, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 10, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text, marginTop: 4 },
  muted: { fontSize: 14, color: colors.muted },
  faint: { fontSize: 12, color: colors.faint },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: '#f1f5f9', marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green },
  darkButton: { backgroundColor: colors.dark, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  darkButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineButton: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  outlineButtonText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  ackButton: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 11 },
  ackButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bigButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, alignSelf: 'stretch' },
  bigButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13, gap: 3, flexGrow: 1 },
  tileTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  callButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.brandLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginTop: 6 },
  callButtonText: { color: '#fff', fontWeight: '700', flex: 1, fontSize: 14 },
  callButtonNumber: { color: '#fff', fontWeight: '800', fontSize: 18 },
  stepRow: { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 11, marginBottom: 8 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 11, marginBottom: 7 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandBg, alignItems: 'center', justifyContent: 'center' },
  contactNumber: { fontSize: 18, fontWeight: '800', color: colors.brand },
  countdown: { fontSize: 52, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'], marginVertical: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.card },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
})
