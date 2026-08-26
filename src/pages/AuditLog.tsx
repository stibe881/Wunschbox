import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Button, Card, formatDateTime, inputClass, useConfirm } from '../components/ui'

const TYPE_COLORS: Record<string, 'red' | 'blue' | 'violet' | 'amber' | 'green' | 'slate'> = {
  alarm: 'red',
  admin: 'blue',
  cms: 'violet',
  alleinarbeit: 'amber',
  hardware: 'green',
  integration: 'slate',
  system: 'slate',
}

export default function AuditLog() {
  const { state, dispatch } = useStore()
  const [typeFilter, setTypeFilter] = useState('')
  const { ask, confirmEl } = useConfirm()

  const types = [...new Set(state.audit.map((e) => e.type))]
  const entries = state.audit.filter((e) => !typeFilter || e.type === typeFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ereignisprotokoll</h1>
          <p className="text-sm text-slate-500">Revisionssicheres Journal aller Aktionen – Alarme, Verwaltung, Konfiguration</p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            ask(
              state.mode === 'live'
                ? 'Live-Datenbestand vollständig zurücksetzen? Alle Benutzer, Gruppen und Einstellungen gehen verloren.'
                : 'Demo-Daten vollständig zurücksetzen? Alle Änderungen gehen verloren.',
              () => dispatch({ type: 'RESET_DEMO' }),
              'Zurücksetzen',
            )
          }
        >
          <RotateCcw size={14} /> {state.mode === 'live' ? 'Live-Daten zurücksetzen' : 'Demo zurücksetzen'}
        </Button>
      </div>

      {confirmEl}
      <Card>
        <select className={inputClass + ' max-w-xs mb-4'} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="space-y-1">
          {entries.map((e) => {
            const user = e.userId ? state.users.find((u) => u.id === e.userId) : undefined
            return (
              <div key={e.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0 text-sm">
                <span className="text-xs text-slate-400 whitespace-nowrap w-32 shrink-0 mt-0.5">{formatDateTime(e.ts)}</span>
                <Badge color={TYPE_COLORS[e.type] ?? 'slate'}>{e.type}</Badge>
                <span className="text-slate-700 flex-1">{e.message}</span>
                {user && <span className="text-xs text-slate-400">{user.firstName} {user.lastName}</span>}
              </div>
            )
          })}
          {entries.length === 0 && <div className="text-sm text-slate-400 py-6 text-center">Keine Einträge.</div>}
        </div>
      </Card>
    </div>
  )
}
