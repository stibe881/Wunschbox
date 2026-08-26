import React, { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import {
  BellRing, Check, CheckCircle2, ChevronLeft, Clock, MapPin, Phone, Play, Search as SearchIcon,
  ShieldAlert, Siren, Timer, X,
} from 'lucide-react-native'
import { createAlarm, uid, useStore } from './store'
import { ScenarioIcon } from './ScenarioIcon'
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
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const contacts = SEED_CONTACTS.filter((c) => scenario.contactIds.includes(c.id))

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={onBack} style={[styles.row, { marginBottom: 4 }]}>
        <ChevronLeft size={18} color={colors.muted} />
        <Text style={styles.muted}>Zurück</Text>
      </Pressable>
      <Text style={styles.h1}>{scenario.title}</Text>

      {contacts.map((c) => (
        <Pressable key={c.id} style={styles.callButton} onPress={() => Linking.openURL(`tel:${c.number}`)}>
          <Phone size={18} color="#fff" />
          <Text style={styles.callButtonText}>{c.name} anrufen</Text>
          <Text style={styles.callButtonNumber}>{c.number}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Sofortmassnahmen</Text>
      {scenario.instructions.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <Text style={[styles.body, { flex: 1, marginTop: 2 }]}>{step}</Text>
        </View>
      ))}

      {scenario.followUp.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Danach</Text>
          {scenario.followUp.map((step, i) => (
            <Text key={i} style={[styles.body, { marginBottom: 4 }]}>– {step}</Text>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Checkliste</Text>
      {scenario.checklist.map((item, i) => (
        <Pressable key={i} style={styles.checkRow} onPress={() => setChecked({ ...checked, [i]: !checked[i] })}>
          <View style={[styles.checkbox, checked[i] && { backgroundColor: colors.green, borderColor: colors.green }]}>
            {checked[i] && <Check size={13} color="#fff" />}
          </View>
          <Text style={[styles.body, { flex: 1 }, checked[i] && { textDecorationLine: 'line-through', color: colors.faint }]}>
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

// ---------- Alleinarbeit ----------

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
            onPress={() => dispatch({ type: 'EXTEND_LONE_WORK', sessionId: running.id, minutes: running.durationMin })}
          >
            <Clock size={18} color="#fff" />
            <Text style={styles.bigButtonText}>Lebenszeichen (+{running.durationMin} Min.)</Text>
          </Pressable>
          <Pressable
            style={[styles.bigButton, { backgroundColor: colors.dark, marginTop: 8 }]}
            onPress={() => dispatch({ type: 'COMPLETE_LONE_WORK', sessionId: running.id })}
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

      <Card>
        <View style={styles.row}>
          <ShieldAlert size={16} color={colors.muted} />
          <Text style={[styles.cardTitle, { flex: 1 }]}>Über diese App</Text>
        </View>
        <Text style={[styles.faint, { marginTop: 6 }]}>
          Sonnenberg Notfall – Demo der Mitarbeiter-App (Expo). Der Alarmserver wird lokal simuliert:
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
