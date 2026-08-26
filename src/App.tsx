import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import {
  AlertTriangle, BellRing, BookOpen, Building2, ClipboardList, FileClock, LayoutDashboard,
  MapPin, Phone, Plug, Radio, Siren, Smartphone, Timer, Users, UsersRound,
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
import EmployeeApp from './pages/EmployeeApp'

const NAV = [
  { section: 'Gefahrenabwehr' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alarm', label: 'Alarm auslösen', icon: Siren },
  { to: '/monitor', label: 'Alarmzentrale', icon: BellRing },
  { to: '/app', label: 'Mitarbeiter-App', icon: Smartphone },
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

export default function App() {
  const { state, dispatch } = useStore()
  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
  const activeAlarms = state.alarms.filter((a) => a.status === 'active')

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <AlertTriangle className="text-brand-500" size={22} />
            Sonnenberg Notfall
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Kompetenzzentrum Baar · Menzingen · Kloten</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((item, i) =>
            'section' in item ? (
              <div key={i} className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-5 py-2 text-sm transition ${
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
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-xs">
          <div className="text-slate-500 mb-1">Angemeldet als</div>
          <select
            className="w-full bg-slate-800 text-slate-200 rounded-lg px-2 py-1.5 text-sm"
            value={currentUser.id}
            onChange={(e) => dispatch({ type: 'SET_CURRENT_USER', userId: e.target.value })}
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {activeAlarms.length > 0 && (
          <div className="bg-brand-600 text-white px-6 py-2 text-sm font-medium flex items-center gap-2">
            <Siren size={16} className="animate-pulse" />
            {activeAlarms.length} aktiver Alarm{activeAlarms.length > 1 ? 'e' : ''} –{' '}
            <NavLink to="/monitor" className="underline">
              zur Alarmzentrale
            </NavLink>
          </div>
        )}
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alarm" element={<TriggerAlarm />} />
            <Route path="/monitor" element={<AlarmMonitor />} />
            <Route path="/app" element={<EmployeeApp />} />
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
