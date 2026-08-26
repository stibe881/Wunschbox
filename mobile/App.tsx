import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { BellRing, BookOpen, CheckCircle2, MapPin, Phone, Siren, Timer, User, WifiOff } from 'lucide-react-native'
import { StoreProvider, useStore } from './src/store'
import { ensurePermissions } from './src/notifications'
import { SEED_LOCATIONS, SEED_USERS } from './src/seed'
import type { Scenario } from './src/types'
import { colors } from './src/ui'
import { ContactsScreen, LoneWorkScreen, ProfileScreen, ScenarioDetailScreen, ScenariosScreen, StartScreen } from './src/screens'

type Tab = 'start' | 'szenarien' | 'alleinarbeit' | 'notruf' | 'profil'

const TABS: { key: Tab; label: string; icon: typeof Siren }[] = [
  { key: 'start', label: 'Start', icon: Siren },
  { key: 'szenarien', label: 'Szenarien', icon: BookOpen },
  { key: 'alleinarbeit', label: 'Alleinarbeit', icon: Timer },
  { key: 'notruf', label: 'Notruf', icon: Phone },
  { key: 'profil', label: 'Profil', icon: User },
]

function Root() {
  const { state, toasts, hydrated } = useStore()
  const [tab, setTab] = useState<Tab>('start')

  useEffect(() => {
    if (hydrated) ensurePermissions()
  }, [hydrated])
  const [openScenario, setOpenScenario] = useState<Scenario | null>(null)

  const me = SEED_USERS.find((u) => u.id === state.currentUserId) ?? SEED_USERS[0]
  const myLocation = SEED_LOCATIONS.find((l) => l.id === me.locationId)
  const myAlarms = state.alarms.filter(
    (a) => a.status === 'active' && (a.deliveries.some((d) => d.userId === me.id) || a.triggeredByUserId === me.id),
  )

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: colors.dark }} />

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Siren size={20} color={colors.brandLight} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>SONNENBERG Notfall</Text>
          <View style={styles.headerSubRow}>
            <Text style={styles.headerSub}>{me.firstName} {me.lastName} · </Text>
            <MapPin size={10} color="#94a3b8" />
            <Text style={styles.headerSub} numberOfLines={1}> {myLocation?.name}</Text>
          </View>
        </View>
        <View style={styles.headerBadge}>
          <WifiOff size={11} color="#94a3b8" />
          <Text style={styles.headerSub}> offline-fähig</Text>
        </View>
      </View>

      {myAlarms.length > 0 && tab !== 'start' && !openScenario && (
        <Pressable style={styles.alarmBanner} onPress={() => { setTab('start'); setOpenScenario(null) }}>
          <BellRing size={15} color="#fff" />
          <Text style={styles.alarmBannerText}>
            {myAlarms.length} aktiver Alarm{myAlarms.length > 1 ? 'e' : ''} – antippen
          </Text>
        </Pressable>
      )}

      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {openScenario ? (
          <ScenarioDetailScreen scenario={openScenario} onBack={() => setOpenScenario(null)} />
        ) : tab === 'start' ? (
          <StartScreen onOpenScenario={setOpenScenario} />
        ) : tab === 'szenarien' ? (
          <ScenariosScreen onOpen={setOpenScenario} />
        ) : tab === 'alleinarbeit' ? (
          <LoneWorkScreen />
        ) : tab === 'notruf' ? (
          <ContactsScreen />
        ) : (
          <ProfileScreen />
        )}
      </View>

      {toasts.length > 0 && (
        <View style={styles.toastWrap} pointerEvents="none">
          {toasts.map((t) => (
            <View key={t.id} style={[styles.toast, t.kind === 'alarm' && { backgroundColor: colors.brand }]}>
              {t.kind === 'alarm'
                ? <Siren size={15} color="#fff" />
                : <CheckCircle2 size={15} color="#34d399" />}
              <Text style={styles.toastText}>{t.message}</Text>
            </View>
          ))}
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key && !openScenario
            return (
              <Pressable key={key} style={styles.tabItem} onPress={() => { setTab(key); setOpenScenario(null) }}>
                <View>
                  <Icon size={21} color={active ? colors.brand : colors.faint} />
                  {key === 'start' && myAlarms.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{myAlarms.length}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, active && { color: colors.brand, fontWeight: '700' }]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      </SafeAreaView>
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.dark,
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center' },
  headerSub: { color: '#94a3b8', fontSize: 11 },
  headerBadge: { flexDirection: 'row', alignItems: 'center' },
  alarmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brandLight,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  alarmBannerText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  toastWrap: { position: 'absolute', bottom: 96, left: 16, right: 16, gap: 8 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  tabBarWrap: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  tabBar: { flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8 },
  tabLabel: { fontSize: 10, color: colors.faint },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -9,
    backgroundColor: colors.brandLight,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
})
