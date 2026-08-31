import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  AlertTriangle, BellRing, BookOpen, Building2, ClipboardList, ExternalLink, FileClock, LayoutDashboard,
  Download, Lock, LogOut, Menu, Phone, Plug, Radio, Siren, Smartphone, Timer, Users, UsersRound, X,
} from 'lucide-react'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import TriggerAlarm from './pages/TriggerAlarm'
import AlarmMonitor from './pages/AlarmMonitor'
import Scenarios from './pages/Scenarios'
import UsersPage from './pages/UsersPage'
import Groups from './pages/Groups'
import Locations from './pages/Locations'
import AlarmPlans from './pages/AlarmPlans'
import LoneWorker from './pages/LoneWorker'
import Buttons from './pages/Buttons'
import Integrations from './pages/Integrations'
import Contacts from './pages/Contacts'
import AuditLog from './pages/AuditLog'
import UserApp from './pages/UserApp'
import LoginScreen, { ForcePasswordChange } from './components/LoginScreen'
import UpdateDialog from './components/UpdateDialog'

const NAV = [
  { section: 'Gefahrenabwehr' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alarm', label: 'Alarm auslösen', icon: Siren },
  { to: '/monitor', label: 'Alarmzentrale', icon: BellRing },
  { to: '/app', label: 'App-Vorschau (iOS)', icon: Smartphone, newTab: true },
  { section: 'Alleinarbeiterschutz' },
  { to: '/alleinarbeit', label: 'Alleinarbeit (Timer)', icon: Timer },
  { to: '/alarmknoepfe', label: 'Alarmknöpfe', icon: Radio },
  { section: 'Vorbereitung (Admin-Web)' },
  { to: '/szenarien', label: 'Szenarien & Checklisten', icon: BookOpen },
  { to: '/alarmplaene', label: 'Alarmpläne', icon: ClipboardList },
  { to: '/benutzer', label: 'Benutzer', icon: Users },
  { to: '/gruppen', label: 'Gruppen & Krisenteams', icon: UsersRound },
  { to: '/standorte', label: 'Standorte', icon: Building2 },
  { to: '/notfallkontakte', label: 'Notfallkontakte', icon: Phone },
  { section: 'System' },
  { to: '/integrationen', label: 'Integrationen', icon: Plug },
  { to: '/protokoll', label: 'Ereignisprotokoll', icon: FileClock },
] as const

function ModeBadge({ mode }: { mode: 'demo' | 'live' }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
        mode === 'live' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-900'
      }`}
    >
      {mode === 'live' ? 'Live' : 'Demo'}
    </span>
  )
}

/** Mitarbeitende haben keinen Webportal-Zugriff – Verweis auf die iOS-App */
function NoWebAccess() {
  const { state, logout } = useStore()
  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-brand-500 flex items-center justify-center mx-auto mb-5">
          <Lock size={28} />
        </div>
        <h1 className="text-xl font-bold text-white">Kein Zugriff auf das Webportal</h1>
        <p className="text-sm text-slate-400 mt-2">
          Hallo {currentUser.firstName} – das Webportal ist der Schulleitung (Admin) und dem Krisenstab vorbehalten.
        </p>
        <div className="mt-6 rounded-2xl bg-slate-800 p-5 text-left">
          <div className="flex items-center gap-2.5 text-white font-semibold">
            <Smartphone size={18} className="text-brand-500" /> SOBE Notfall-App verwenden
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Als Mitarbeiter:in nutzen Sie die App auf dem iPhone: SOS-Alarm, Handlungsanweisungen zu allen
            Notfallszenarien, Alleinarbeits-Timer und Notrufnummern – auch offline verfügbar.
          </p>
          <NavLink
            to="/app"
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 transition"
          >
            <Smartphone size={16} /> App jetzt öffnen
          </NavLink>
        </div>
        <button
          onClick={logout}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-3 transition"
        >
          <LogOut size={16} /> Abmelden
        </button>
      </div>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, dispatch, logout, serverStatus } = useStore()
  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
  const activeAlarms = state.alarms.filter((a) => a.status === 'active')
  const [updateOffen, setUpdateOffen] = useState(false)
  // Aktualisieren betrifft den Server – im Demo-Modus gibt es keinen
  const zeigeUpdate = state.mode === 'live' && currentUser.role === 'admin'

  return (
    <div className="h-full w-72 lg:w-64 bg-slate-900 text-slate-300 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <AlertTriangle className="text-brand-500" size={22} />
          SOBE Notfall
          <ModeBadge mode={state.mode} />
        </div>
        <div className="text-xs text-slate-500 mt-0.5">Kompetenzzentrum Baar · Menzingen · Kloten</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((item, i) =>
          'section' in item ? (
            <div key={i} className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {item.section}
            </div>
          ) : 'newTab' in item && item.newTab ? (
            <a
              key={item.to}
              href={`#${item.to}`}
              target="_blank"
              rel="noopener"
              onClick={onNavigate}
              className="flex items-center gap-2.5 px-5 py-2.5 lg:py-2 text-sm transition hover:bg-slate-800/60 hover:text-white"
            >
              <item.icon size={16} />
              {item.label}
              <ExternalLink size={12} className="ml-auto text-slate-500" />
            </a>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-5 py-2.5 lg:py-2 text-sm transition ${
                  isActive ? 'bg-slate-800 text-white border-r-2 border-brand-500' : 'hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
              {item.to === '/monitor' && activeAlarms.length > 0 && (
                <span className="ml-auto bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5 alarm-pulse">{activeAlarms.length}</span>
              )}
            </NavLink>
          ),
        )}

        <div className="px-5 pt-5 pb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Modus</div>
          <div className="flex rounded-lg bg-slate-800 p-1">
            {(['demo', 'live'] as const).map((m) => (
              <button
                key={m}
                onClick={() => dispatch({ type: 'SET_MODE', mode: m })}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide transition ${
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
          {state.mode === 'live' && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus === 'verbunden' ? 'bg-emerald-500' : serverStatus === 'getrennt' ? 'bg-brand-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-500">
                {serverStatus === 'verbunden'
                  ? 'Mit Alarmserver verbunden'
                  : serverStatus === 'getrennt'
                    ? 'Alarmserver nicht erreichbar'
                    : 'Verbinde mit Alarmserver …'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2 leading-snug">
            {state.mode === 'demo'
              ? 'Beispieldaten, Zustellung wird simuliert. Beide Modi behalten ihre Daten.'
              : 'Echter Datenbestand ohne Demo-Daten. Versand erfordert ein Gateway (Integrationen); ausgehende Webhooks werden real aufgerufen.'}
          </p>
        </div>
      </nav>
      {zeigeUpdate && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setUpdateOffen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2.5 transition"
          >
            <Download size={15} /> Aktualisierung
          </button>
        </div>
      )}
      {updateOffen && <UpdateDialog onClose={() => setUpdateOffen(false)} />}

      <div className="px-5 py-4 border-t border-slate-800 text-xs">
        <div className="text-slate-500 mb-1">Angemeldet als</div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-slate-200 text-sm font-medium truncate">
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <div className="text-slate-500 truncate">{currentUser.email}</div>
          </div>
          <button
            onClick={logout}
            className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Abmelden"
            aria-label="Abmelden"
          >
            <LogOut size={16} />
          </button>
        </div>
        {state.mode === 'demo' && (
          <select
            className="mt-2.5 w-full bg-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-sm"
            value={currentUser.id}
            onChange={(e) => dispatch({ type: 'SET_CURRENT_USER', userId: e.target.value })}
            aria-label="Demo: Benutzer wechseln"
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                Demo-Ansicht: {u.firstName} {u.lastName} ({u.role})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { state } = useStore()
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const activeAlarms = state.alarms.filter((a) => a.status === 'active')
  const sessionUser = state.users.find((u) => u.id === state.session?.userId)

  // Ohne gültige Anmeldung ist nichts erreichbar
  if (!sessionUser) return <LoginScreen />
  // Erstpasswort muss geändert werden, bevor es weitergeht
  if (sessionUser.mustChangePassword) return <ForcePasswordChange user={sessionUser} />

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? sessionUser

  // Die App-Ansicht steht allen Rollen offen – sie ist die Oberfläche der Mitarbeitenden
  if (location.pathname === '/app') {
    return <UserApp />
  }
  // Das Verwaltungsportal bleibt Admin und Krisenstab vorbehalten
  if (sessionUser.role === 'mitarbeiter') {
    return <NoWebAccess />
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop-Sidebar */}
      <aside className="hidden lg:block shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile-Drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60" />
          <div className="absolute inset-y-0 left-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
          <button className="absolute top-3 right-3 text-white bg-slate-800/80 rounded-full p-2" onClick={() => setNavOpen(false)} aria-label="Menü schliessen">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile-Kopfzeile */}
        <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white px-3 py-2.5 flex items-center gap-2 shadow">
          <button onClick={() => setNavOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-800" aria-label="Menü öffnen">
            <Menu size={22} />
          </button>
          <span className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="text-brand-500" size={18} /> SOBE Notfall <ModeBadge mode={state.mode} />
          </span>
          {activeAlarms.length > 0 && location.pathname !== '/monitor' && (
            <NavLink to="/monitor" className="ml-auto bg-brand-600 text-white text-xs font-semibold rounded-full px-2.5 py-1 alarm-pulse">
              {activeAlarms.length} Alarm{activeAlarms.length > 1 ? 'e' : ''}
            </NavLink>
          )}
        </header>

        {activeAlarms.length > 0 && (
          <div className="hidden lg:flex bg-brand-600 text-white px-6 py-2 text-sm font-medium items-center gap-2">
            <Siren size={16} className="animate-pulse" />
            {activeAlarms.length} aktiver Alarm{activeAlarms.length > 1 ? 'e' : ''} –{' '}
            <NavLink to="/monitor" className="underline">
              zur Alarmzentrale
            </NavLink>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alarm" element={<TriggerAlarm />} />
            <Route path="/monitor" element={<AlarmMonitor />} />
            <Route path="/alleinarbeit" element={<LoneWorker />} />
            <Route path="/alarmknoepfe" element={<Buttons />} />
            <Route path="/szenarien" element={<Scenarios />} />
            <Route path="/alarmplaene" element={<AlarmPlans />} />
            <Route path="/benutzer" element={<UsersPage />} />
            <Route path="/gruppen" element={<Groups />} />
            <Route path="/standorte" element={<Locations />} />
            <Route path="/notfallkontakte" element={<Contacts />} />
            <Route path="/integrationen" element={<Integrations />} />
            <Route path="/protokoll" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
