import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AlertTriangle, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react-native'
import { useStore } from './store'
import { DEMO_PASSWORD, LIVE_INITIAL_PASSWORD } from './seed'
import { MIN_PASSWORD_LENGTH, authenticate, passwordProblem } from './auth'
import type { User } from './types'
import { colors } from './ui'

function Shell({ subtitle, children, showModeSwitch = false }: { subtitle: string; children: React.ReactNode; showModeSwitch?: boolean }) {
  const { state, switchMode } = useStore()
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.dark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.screen} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <AlertTriangle size={30} color={colors.brand} />
        </View>
        <View style={s.titleRow}>
          <Text style={s.title}>SOBE Notfall</Text>
        </View>
        <Text style={s.subtitle}>{subtitle}</Text>

        {/* Modus vor der Anmeldung wählbar – Demo und Live haben getrennte Konten */}
        {showModeSwitch && (
          <View style={s.modeSwitch}>
            {(['demo', 'live'] as const).map((m) => {
              const aktiv = state.mode === m
              return (
                <Pressable
                  key={m}
                  style={[s.modeOption, aktiv && { backgroundColor: m === 'live' ? colors.green : '#f59e0b' }]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.modeOptionText, aktiv && { color: m === 'live' ? '#fff' : '#0f172a' }]}>
                    {m === 'demo' ? 'DEMO' : 'LIVE'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/** Anmeldung mit E-Mail und Passwort */
export default function LoginScreen() {
  const { state, dispatch } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const liveFirstRun = state.mode === 'live' && state.users.length === 1 && state.users[0].mustChangePassword === true

  function submit() {
    const result = authenticate(state.users, email, password)
    if (!result.ok) return setError(result.error)
    setError(null)
    dispatch({ type: 'LOGIN', userId: result.user.id })
  }

  return (
    <Shell subtitle="Kompetenzzentrum Baar · Menzingen · Kloten" showModeSwitch>
      <View style={s.card}>
        <Text style={s.label}>E-Mail-Adresse</Text>
        <TextInput
          style={s.input}
          placeholder="vorname.name@sonnenberg-baar.ch"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null) }}
        />

        <Text style={[s.label, { marginTop: 14 }]}>Passwort</Text>
        <View>
          <TextInput
            style={[s.input, { paddingRight: 46 }]}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!show}
            textContentType="password"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null) }}
            onSubmitEditing={submit}
          />
          <Pressable style={s.eye} onPress={() => setShow((v) => !v)} hitSlop={8}>
            {show ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
          </Pressable>
        </View>

        {error && (
          <View style={s.error}>
            <AlertTriangle size={15} color="#fecaca" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <Pressable style={s.primary} onPress={submit}>
          <LogIn size={16} color="#fff" />
          <Text style={s.primaryText}>Anmelden</Text>
        </Pressable>
      </View>

      {state.mode === 'demo' && (
        <View style={s.hint}>
          <Text style={s.hintTitle}>Demo-Zugänge</Text>
          <Text style={s.hintText}>Passwort für alle Demo-Konten: {DEMO_PASSWORD}</Text>
          {state.users.slice(0, 4).map((u) => (
            <Pressable key={u.id} onPress={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setError(null) }}>
              <Text style={s.hintLink}>{u.email} · {u.role}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {liveFirstRun && (
        <View style={[s.hint, { borderColor: '#065f46' }]}>
          <View style={s.hintRow}>
            <ShieldCheck size={14} color={colors.green} />
            <Text style={[s.hintTitle, { color: colors.green }]}>Erstzugang Live-Betrieb</Text>
          </View>
          <Text style={s.hintText}>
            {state.users[0].email} mit dem Erstpasswort {LIVE_INITIAL_PASSWORD}. Das Passwort muss bei der ersten
            Anmeldung geändert werden.
          </Text>
        </View>
      )}
    </Shell>
  )
}

/** Erzwungene Passwortänderung nach der ersten Anmeldung */
export function ForcePasswordChange({ user }: { user: User }) {
  const { dispatch } = useStore()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== repeat) return setError('Die beiden Passwörter stimmen nicht überein.')
    dispatch({ type: 'SET_PASSWORD', userId: user.id, password })
  }

  return (
    <Shell subtitle={`Willkommen, ${user.firstName}`}>
      <View style={s.card}>
        <View style={s.notice}>
          <ShieldCheck size={15} color="#fcd34d" />
          <Text style={s.noticeText}>Bitte vergeben Sie ein eigenes Passwort, bevor Sie fortfahren.</Text>
        </View>

        <Text style={s.label}>Neues Passwort (mind. {MIN_PASSWORD_LENGTH} Zeichen, mit Ziffer)</Text>
        <TextInput
          style={s.input} secureTextEntry autoCapitalize="none" textContentType="newPassword"
          value={password} onChangeText={(t) => { setPassword(t); setError(null) }}
        />
        <Text style={[s.label, { marginTop: 14 }]}>Passwort wiederholen</Text>
        <TextInput
          style={s.input} secureTextEntry autoCapitalize="none" textContentType="newPassword"
          value={repeat} onChangeText={(t) => { setRepeat(t); setError(null) }}
          onSubmitEditing={submit}
        />

        {error && (
          <View style={s.error}>
            <AlertTriangle size={15} color="#fecaca" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <Pressable style={s.primary} onPress={submit}>
          <Text style={s.primaryText}>Passwort speichern</Text>
        </Pressable>
        <Pressable onPress={() => dispatch({ type: 'LOGOUT' })}>
          <Text style={s.link}>Abmelden</Text>
        </Pressable>
      </View>
    </Shell>
  )
}

const s = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingBottom: 40 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 16 },
  modeOption: { flex: 1, borderRadius: 9, paddingVertical: 9, alignItems: 'center' },
  modeOptionText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: '#94a3b8' },
  subtitle: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 22 },
  card: { backgroundColor: '#1e293b99', borderWidth: 1, borderColor: '#1e293b', borderRadius: 18, padding: 18 },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#fff' },
  eye: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#7f1d1d55', borderWidth: 1, borderColor: '#991b1b', borderRadius: 12, padding: 11, marginTop: 14 },
  errorText: { color: '#fecaca', fontSize: 13, flex: 1 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#78350f55', borderWidth: 1, borderColor: '#b45309', borderRadius: 12, padding: 11, marginBottom: 16 },
  noticeText: { color: '#fde68a', fontSize: 13, flex: 1 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 14 },
  hint: { backgroundColor: '#1e293b66', borderWidth: 1, borderColor: '#1e293b', borderRadius: 18, padding: 16, marginTop: 16 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintTitle: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  hintText: { color: '#94a3b8', fontSize: 12, marginBottom: 8, lineHeight: 17 },
  hintLink: { color: '#cbd5e1', fontSize: 12, paddingVertical: 3 },
})
