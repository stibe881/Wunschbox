import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff, Info, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react'
import { useStore } from '../store'
import { DEMO_PASSWORD, LIVE_INITIAL_PASSWORD } from '../data/seed'
import { MIN_PASSWORD_LENGTH, authenticate, passwordProblem } from '../lib/auth'
import type { User } from '../types'

const fieldClass =
  'w-full rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 px-10 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition'

function Shell({ children, subtitle, showModeSwitch = false }: { children: React.ReactNode; subtitle: string; showModeSwitch?: boolean }) {
  const { state, dispatch } = useStore()
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-brand-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={30} />
          </div>
          <h1 className="text-xl font-bold text-white">SOBE Notfall</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Modus vor der Anmeldung wählbar – Demo und Live haben getrennte Konten */}
        {showModeSwitch && (
          <div className="flex rounded-xl bg-slate-800 p-1 mb-4">
            {(['demo', 'live'] as const).map((m) => (
              <button
                key={m}
                onClick={() => dispatch({ type: 'SET_MODE', mode: m })}
                className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wide transition ${
                  state.mode === m
                    ? m === 'live'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'demo' ? 'Demo' : 'Live'}
              </button>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/** Anmeldung mit E-Mail und Passwort */
export default function LoginScreen() {
  const { state, dispatch } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live-Erstinbetriebnahme: solange nur das ausgelieferte Admin-Konto besteht,
  // wird der Erstzugang angezeigt – nach der Passwortänderung verschwindet der Hinweis
  const liveFirstRun =
    state.mode === 'live' && state.users.length === 1 && state.users[0].mustChangePassword === true

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const result = authenticate(state.users, email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    dispatch({ type: 'LOGIN', userId: result.user.id })
  }

  return (
    <Shell subtitle="Kompetenzzentrum Baar · Menzingen · Kloten" showModeSwitch>
      <form onSubmit={submit} className="rounded-2xl bg-slate-800/60 border border-slate-800 p-5 space-y-3.5">
        <label className="block">
          <span className="text-xs text-slate-400">E-Mail-Adresse</span>
          <div className="relative mt-1.5">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              autoComplete="username"
              autoFocus
              className={fieldClass}
              placeholder="vorname.name@sonnenberg-baar.ch"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">Passwort</span>
          <div className="relative mt-1.5">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className={fieldClass + ' pr-11'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300"
              aria-label={show ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-600/15 border border-brand-600/40 px-3 py-2.5 text-sm text-brand-200" role="alert">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 text-sm transition"
        >
          <LogIn size={16} /> Anmelden
        </button>
      </form>

      {state.mode === 'demo' && (
        <div className="mt-4 rounded-2xl bg-slate-800/40 border border-slate-800 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
            <Info size={14} /> Demo-Zugänge
          </div>
          <p className="mb-2">
            Passwort für alle Demo-Konten: <code className="text-slate-200 font-semibold">{DEMO_PASSWORD}</code>
          </p>
          <ul className="space-y-1">
            {state.users.slice(0, 4).map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setError(null) }}
                  className="text-left hover:text-slate-200 transition"
                >
                  <span className="text-slate-300">{u.email}</span> · {u.role}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {liveFirstRun && (
        <div className="mt-4 rounded-2xl bg-slate-800/40 border border-emerald-800/60 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
            <ShieldCheck size={14} /> Erstzugang Live-Betrieb
          </div>
          <p>
            <span className="text-slate-300">{state.users[0].email}</span> mit dem Erstpasswort{' '}
            <code className="text-slate-200 font-semibold">{LIVE_INITIAL_PASSWORD}</code>. Das Passwort muss bei der
            ersten Anmeldung geändert werden; danach wird dieser Hinweis nicht mehr angezeigt.
          </p>
        </div>
      )}

      <p className="text-center text-[11px] text-slate-600 mt-5 leading-relaxed">
        Anmeldung über Microsoft Entra ID (SSO) ist vorbereitet und kann unter Integrationen aktiviert werden,
        sobald der Verzeichnisdienst angebunden ist.
      </p>
    </Shell>
  )
}

/** Erzwungene Passwortänderung nach der ersten Anmeldung */
export function ForcePasswordChange({ user }: { user: User }) {
  const { dispatch } = useStore()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== repeat) return setError('Die beiden Passwörter stimmen nicht überein.')
    dispatch({ type: 'SET_PASSWORD', userId: user.id, password })
  }

  return (
    <Shell subtitle={`Willkommen, ${user.firstName}`}>
      <form onSubmit={submit} className="rounded-2xl bg-slate-800/60 border border-slate-800 p-5 space-y-3.5">
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/40 px-3 py-2.5 text-sm text-amber-200">
          <ShieldCheck size={16} className="shrink-0 mt-0.5" />
          Bitte vergeben Sie ein eigenes Passwort, bevor Sie fortfahren.
        </div>

        <label className="block">
          <span className="text-xs text-slate-400">Neues Passwort (mind. {MIN_PASSWORD_LENGTH} Zeichen, mit Ziffer)</span>
          <input
            type="password" autoComplete="new-password" autoFocus
            className={fieldClass.replace('px-10', 'px-3.5') + ' mt-1.5'}
            value={password} onChange={(e) => { setPassword(e.target.value); setError(null) }}
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">Passwort wiederholen</span>
          <input
            type="password" autoComplete="new-password"
            className={fieldClass.replace('px-10', 'px-3.5') + ' mt-1.5'}
            value={repeat} onChange={(e) => { setRepeat(e.target.value); setError(null) }}
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-600/15 border border-brand-600/40 px-3 py-2.5 text-sm text-brand-200" role="alert">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button type="submit" className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 text-sm transition">
          Passwort speichern
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'LOGOUT' })}
          className="w-full text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Abmelden
        </button>
      </form>
    </Shell>
  )
}
