import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren } from 'lucide-react'
import { createAlarm, resolveRecipients, useStore } from '../store'
import type { Channel } from '../types'
import { CHANNEL_LABELS } from '../types'
import { Badge, Button, Card, Field, Toggle, inputClass } from '../components/ui'
import { ScenarioIcon } from '../components/ScenarioIcon'

const ALL_CHANNELS: Channel[] = ['push', 'sms', 'email', 'voice', 'conference', 'tts', 'teams']

export default function TriggerAlarm() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()

  const [scenarioId, setScenarioId] = useState(state.scenarios[0]?.id ?? '')
  const [planId, setPlanId] = useState('')
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState<Channel[]>(['push', 'sms'])
  const [groupIds, setGroupIds] = useState<string[]>(['gr-alle'])
  const [locationIds, setLocationIds] = useState<string[]>([])
  const [silent, setSilent] = useState(false)
  const [requireAck, setRequireAck] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const scenario = state.scenarios.find((s) => s.id === scenarioId)

  function applyPlan(id: string) {
    setPlanId(id)
    const plan = state.plans.find((p) => p.id === id)
    if (!plan) return
    if (plan.scenarioId) setScenarioId(plan.scenarioId)
    setChannels(plan.channels)
    setGroupIds(plan.groupIds)
    setLocationIds(plan.locationIds)
    setRequireAck(plan.requireAck)
  }

  const recipients = useMemo(() => resolveRecipients(state, groupIds, locationIds), [state, groupIds, locationIds])

  function toggle<T>(list: T[], value: T, set: (v: T[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  function fire() {
    const plan = state.plans.find((p) => p.id === planId)
    const alarm = createAlarm(state, {
      scenarioId,
      message: message || `${scenario?.title}: Bitte Handlungsanweisungen in der App befolgen.`,
      silent,
      requireAck,
      channels,
      groupIds,
      locationIds,
      triggeredByUserId: state.currentUserId,
      triggeredVia: 'web',
      planId: planId || undefined,
      escalation: plan?.escalation ?? [],
    })
    dispatch({ type: 'TRIGGER_ALARM', alarm, audit: `Alarm ausgelöst: ${scenario?.title} (${recipients.length} Empfänger)` })
    navigate('/monitor')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Alarm auslösen</h1>
        <p className="text-sm text-slate-500">
          Auslösung via Web-App · Alternativ: Smartphone-App, interne Notfallnummer {state.integrations.hotline.number}, Alarmknöpfe, Webhooks
        </p>
      </div>

      <Card title="1 · Szenario wählen">
        <Field label="Alarmplan anwenden (optional – füllt Kanäle, Zielgruppen und Eskalation vor)">
          <select className={inputClass} value={planId} onChange={(e) => applyPlan(e.target.value)}>
            <option value="">Kein Plan – manuell konfigurieren</option>
            {state.plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {state.scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setScenarioId(s.id)
                setSilent(s.silentDefault)
                if (s.defaultChannels.length > 0) setChannels(s.defaultChannels)
                if (s.responsibleGroupIds.length > 0) setGroupIds(s.responsibleGroupIds)
              }}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                s.id === scenarioId ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <ScenarioIcon name={s.icon} size={22} className={`mb-1 ${s.id === scenarioId ? 'text-brand-600' : 'text-slate-500'}`} />
              <div className="font-medium text-slate-800 leading-tight">{s.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.category}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="2 · Zielgruppen (standort- und funktionsbezogen)">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="text-sm font-medium text-slate-600 mb-2">Nutzergruppen</div>
            {state.groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" checked={groupIds.includes(g.id)} onChange={() => toggle(groupIds, g.id, setGroupIds)} />
                {g.name} {g.isCrisisTeam && <Badge color="violet">Krisenteam</Badge>}
              </label>
            ))}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-600 mb-2">Standorte (leer = alle)</div>
            {state.locations.map((l) => (
              <label key={l.id} className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" checked={locationIds.includes(l.id)} onChange={() => toggle(locationIds, l.id, setLocationIds)} />
                {l.name}
                <span className="text-xs text-slate-400">({l.operatingHours.days} {l.operatingHours.open}–{l.operatingHours.close})</span>
              </label>
            ))}
            <div className="text-xs text-slate-400 mt-2">
              Abwesende Personen (Ferien) werden automatisch übersprungen.
            </div>
          </div>
        </div>
      </Card>

      <Card title="3 · Alarmierungskanäle">
        <div className="grid md:grid-cols-2 gap-1">
          {ALL_CHANNELS.map((c) => (
            <label key={c} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={channels.includes(c)} onChange={() => toggle(channels, c, setChannels)} />
              {CHANNEL_LABELS[c]}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-5 mt-4 pt-4 border-t border-slate-100">
          <Toggle checked={silent} onChange={setSilent} label="Stiller Alarm (keine Signaltöne – z. B. Bedrohungslage)" />
          <Toggle checked={requireAck} onChange={setRequireAck} label="Aufgebot mit Quittierfunktion" />
        </div>
      </Card>

      <Card title="4 · Meldung">
        <textarea
          className={inputClass}
          rows={3}
          placeholder={`Standard: "${scenario?.title}: Bitte Handlungsanweisungen in der App befolgen."`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="text-xs text-slate-400 mt-1">
          Mehrsprachige Zustellung aktiv: Empfänger erhalten die Meldung gemäss ihrer App-Sprache (DE/EN/FR/IT).
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button
          variant="danger"
          className="text-base px-6 py-3 alarm-pulse"
          disabled={!scenarioId || channels.length === 0 || recipients.length === 0}
          onClick={() => setConfirming(true)}
        >
          <Siren size={20} /> Alarm jetzt auslösen
        </Button>
        <span className="text-sm text-slate-500">
          {recipients.length} Empfänger · {channels.length} Kanäle
          {silent && ' · still'}
        </span>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Siren className="text-brand-600" /> Alarm bestätigen
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              <strong>{scenario?.title}</strong> wird sofort an <strong>{recipients.length} Personen</strong> über{' '}
              {channels.map((c) => CHANNEL_LABELS[c]).join(', ')} ausgelöst.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Abbrechen</Button>
              <Button variant="danger" onClick={fire}>Jetzt auslösen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
