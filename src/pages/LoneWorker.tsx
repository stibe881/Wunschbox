import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Play, ShieldAlert } from 'lucide-react'
import { uid, useStore } from '../store'
import type { LoneWorkSession } from '../types'
import { Badge, Button, Card, EmptyState, Field, Toggle, formatDateTime, formatDuration, inputClass } from '../components/ui'

export default function LoneWorker() {
  const { state, dispatch } = useStore()
  const [userId, setUserId] = useState(state.currentUserId)
  const [locationId, setLocationId] = useState(state.locations[0]?.id ?? '')
  const [activity, setActivity] = useState('')
  const [durationMin, setDurationMin] = useState(30)
  const [silent, setSilent] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const running = state.loneWorkSessions.filter((s) => s.status === 'running')
  const past = state.loneWorkSessions.filter((s) => s.status !== 'running')

  function start() {
    const session: LoneWorkSession = {
      id: uid('lw'),
      userId,
      locationId,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Alleinarbeiterschutz</h1>
        <p className="text-sm text-slate-500">
          Timer-Funktion mit automatischer Alarmauslösung: Meldet sich die Person nicht rechtzeitig zurück, alarmiert der Server
          automatisch Ersthelfer und Sicherheitsdienst – auf Wunsch still und unauffällig.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={<span className="flex items-center gap-2"><Play size={16} /> Überwachung starten</span>}>
          <Field label="Person">
            <select className={inputClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
              {state.users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </Field>
          <Field label="Standort">
            <select className={inputClass} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              {state.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Tätigkeit">
            <input className={inputClass} placeholder="z. B. Wartung Heizzentrale, Nachtrundgang" value={activity} onChange={(e) => setActivity(e.target.value)} />
          </Field>
          <Field label={`Timer-Intervall: ${durationMin} Minuten`}>
            <input type="range" min={1} max={120} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-full" />
            <div className="text-xs text-slate-400">Vor Ablauf muss ein Lebenszeichen gegeben werden, sonst wird automatisch alarmiert.</div>
          </Field>
          <div className="mb-4">
            <Toggle checked={silent} onChange={setSilent} label="Stille Alarmauslösung (unauffälliger Schutz)" />
          </div>
          <Button onClick={start}><Play size={16} /> Timer starten</Button>
        </Card>

        <Card title={<span className="flex items-center gap-2"><Clock size={16} /> Laufende Überwachungen</span>}>
          {running.length === 0 && <EmptyState>Keine aktive Alleinarbeit.</EmptyState>}
          <div className="space-y-3">
            {running.map((s) => <RunningSession key={s.id} session={s} now={now} />)}
          </div>
        </Card>
      </div>

      {past.length > 0 && (
        <Card title="Verlauf">
          <div className="space-y-1.5">
            {past.slice(0, 15).map((s) => {
              const user = state.users.find((u) => u.id === s.userId)
              return (
                <div key={s.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400">{formatDateTime(s.startedAt)}</span>
                  <span className="text-slate-700 flex-1">{user?.firstName} {user?.lastName} · {s.activity}</span>
                  {s.status === 'completed'
                    ? <Badge color="green"><CheckCircle2 size={12} /> sicher beendet</Badge>
                    : <Badge color="red"><ShieldAlert size={12} /> Alarm ausgelöst</Badge>}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function RunningSession({ session, now }: { session: LoneWorkSession; now: number }) {
  const { state, dispatch } = useStore()
  const user = state.users.find((u) => u.id === session.userId)
  const location = state.locations.find((l) => l.id === session.locationId)
  const remaining = session.expiresAt - now
  const critical = remaining < 5 * 60_000

  return (
    <div className={`rounded-lg border p-3 ${critical ? 'border-alarm-500 bg-alarm-50' : 'border-slate-200'}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="font-medium text-slate-800 text-sm">
            {user?.firstName} {user?.lastName}
            {session.silent && <Badge color="violet">still</Badge>}
          </div>
          <div className="text-xs text-slate-500">{session.activity} · {location?.name}</div>
        </div>
        <div className={`text-2xl font-mono font-bold ${critical ? 'text-alarm-600' : 'text-slate-800'}`}>
          {formatDuration(remaining)}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="secondary" onClick={() => dispatch({ type: 'EXTEND_LONE_WORK', sessionId: session.id, minutes: session.durationMin })}>
          Lebenszeichen (+{session.durationMin} Min.)
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'COMPLETE_LONE_WORK', sessionId: session.id })}>
          <CheckCircle2 size={14} /> Sicher beendet
        </Button>
      </div>
    </div>
  )
}
