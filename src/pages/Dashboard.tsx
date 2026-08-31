import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, BellRing, Radio, Server, Siren, Smartphone, Timer, Users } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Card, formatRelative } from '../components/ui'
import { ScenarioIcon } from '../components/ScenarioIcon'

export default function Dashboard() {
  const { state } = useStore()
  const activeAlarms = state.alarms.filter((a) => a.status === 'active')
  const runningLoneWork = state.loneWorkSessions.filter((s) => s.status === 'running')
  const lowBattery = state.buttons.filter((b) => b.batteryPct < 20)

  const stats = [
    { label: 'Aktive Alarme', value: activeAlarms.length, icon: Siren, to: '/monitor', highlight: activeAlarms.length > 0 },
    { label: 'Benutzer', value: state.users.length, icon: Users, to: '/benutzer' },
    { label: 'Laufende Alleinarbeit', value: runningLoneWork.length, icon: Timer, to: '/alleinarbeit' },
    { label: 'Alarmknöpfe online', value: state.buttons.length, icon: Radio, to: '/alarmknoepfe' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Lageübersicht Notfall- und Krisenmanagement</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/alarm"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 transition shadow-sm"
          >
            <Siren size={16} /> Alarm auslösen
          </Link>
          <Link
            to="/alleinarbeit"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 text-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition"
          >
            <Timer size={16} /> Alleinarbeit starten
          </Link>
          <a
            href="#/app"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 text-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 transition"
          >
            <Smartphone size={16} /> App-Vorschau
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to}>
            <div className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow transition ${s.highlight ? 'border-brand-500' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{s.label}</span>
                <s.icon size={18} className={s.highlight ? 'text-brand-600' : 'text-slate-400'} />
              </div>
              <div className={`text-3xl font-bold mt-2 ${s.highlight ? 'text-brand-600' : 'text-slate-800'}`}>{s.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={<span className="flex items-center gap-2"><Server size={16} /> Alarmserver-Status</span>}>
          <ul className="space-y-2.5 text-sm">
            <StatusRow label="Alarmserver (Cloud Schweiz)" ok detail="Auslösung in Sekunden" />
            <StatusRow label="SMS-Gateway" ok={state.integrations.smsGateway.enabled} detail={state.integrations.smsGateway.provider} />
            <StatusRow label="Sprachanrufe / Telefonkonferenz" ok detail="Parallelruf aktiv" />
            <StatusRow label="Push-Dienst (Critical Alerts)" ok detail="iOS · Android · Huawei" />
            <StatusRow label="Microsoft Teams" ok={state.integrations.teams.enabled} detail={state.integrations.teams.tenant || '–'} />
            <StatusRow label="LoRaWAN-Netz" ok detail={`${state.buttons.filter((b) => b.type === 'lorawan').length} Knöpfe verbunden`} />
            <StatusRow label="Interne Notfallnummer" ok={state.integrations.hotline.enabled} detail={state.integrations.hotline.number} />
          </ul>
          {lowBattery.length > 0 && (
            <div className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" /> {lowBattery.length} Alarmknopf/-knöpfe mit niedrigem Batteriestand
            </div>
          )}
        </Card>

        <Card title={<span className="flex items-center gap-2"><Activity size={16} /> Letzte Ereignisse</span>}>
          {state.audit.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0 text-sm">
              <span className="text-xs text-slate-400 whitespace-nowrap mt-0.5 w-20 shrink-0">{formatRelative(e.ts)}</span>
              <span className="text-slate-700">{e.message}</span>
            </div>
          ))}
          <Link to="/protokoll" className="inline-flex items-center gap-1 mt-3 text-sm text-slate-500 hover:text-slate-800 underline">
            Vollständiges Protokoll <ArrowRight size={13} />
          </Link>
        </Card>
      </div>

      {activeAlarms.length > 0 && (
        <Card title={<span className="flex items-center gap-2 text-brand-600"><BellRing size={16} /> Aktive Alarme</span>}>
          {activeAlarms.map((a) => {
            const scenario = state.scenarios.find((s) => s.id === a.scenarioId)
            return (
              <Link key={a.id} to="/monitor" className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0 text-sm hover:bg-slate-50 rounded px-2">
                <ScenarioIcon name={scenario?.icon ?? ''} size={22} className="text-brand-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{scenario?.title}</div>
                  <div className="text-slate-500 text-xs">{a.message}</div>
                </div>
                {a.silent && <Badge color="violet">still</Badge>}
                <Badge color="red">aktiv</Badge>
              </Link>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className="text-slate-700 flex-1">{label}</span>
      <span className="text-xs text-slate-400">{detail}</span>
      <Badge color={ok ? 'green' : 'slate'}>{ok ? 'online' : 'inaktiv'}</Badge>
    </li>
  )
}
