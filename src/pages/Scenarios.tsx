import { useMemo, useState } from 'react'
import { Pencil, Phone, Plus, Trash2, Users, WifiOff } from 'lucide-react'
import { uid, useStore } from '../store'
import type { Channel, Scenario, ScenarioPriority } from '../types'
import { CHANNEL_LABELS } from '../types'
import { Badge, Button, Card, Field, Modal, Toggle, inputClass } from '../components/ui'
import { SCENARIO_ICONS, ScenarioIcon } from '../components/ScenarioIcon'

const CATEGORIES = ['Schüler:innen', 'Gesundheit', 'Sicherheit', 'Gebäude & Technik', 'Naturereignis', 'Organisation']
const ALL_CHANNELS: Channel[] = ['push', 'sms', 'email', 'voice', 'conference', 'tts', 'teams']

const PRIORITY_META: Record<ScenarioPriority, { label: string; color: 'red' | 'amber' | 'slate' }> = {
  hoch: { label: 'Priorität hoch', color: 'red' },
  mittel: { label: 'Priorität mittel', color: 'amber' },
  tief: { label: 'Priorität tief', color: 'slate' },
}

export default function Scenarios() {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState<Scenario | null>(null)
  const [viewing, setViewing] = useState<Scenario | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')

  function newScenario(): Scenario {
    return {
      id: uid('sc'), icon: 'clipboard-list', title: '', category: 'Organisation', priority: 'mittel',
      instructions: [''], followUp: [], checklist: [''], silentDefault: false,
      defaultChannels: ['push'], responsibleGroupIds: [], contactIds: [], custom: true,
    }
  }

  const categories = useMemo(
    () => [...new Set([...CATEGORIES, ...state.scenarios.map((s) => s.category)])],
    [state.scenarios],
  )

  const filtered = state.scenarios.filter(
    (s) =>
      (!categoryFilter || s.category === categoryFilter) &&
      (!search || s.title.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Szenarien &amp; Checklisten</h1>
          <p className="text-sm text-slate-500">
            {state.scenarios.length} Notfallszenarien für das Sonnenberg Kompetenzzentrum · Content-Management ohne technische
            Vorkenntnisse · Änderungen werden sofort an alle Apps verteilt
          </p>
        </div>
        <Button onClick={() => setEditing(newScenario())}><Plus size={16} /> Neues Szenario</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className={inputClass + ' max-w-xs'} placeholder="Szenario suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${!categoryFilter ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          >
            Alle
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${c === categoryFilter ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <WifiOff size={14} className="text-emerald-600" />
        Offline-Verfügbarkeit: Alle Szenarien und Checklisten werden lokal auf den Endgeräten zwischengespeichert und sind auch ohne Netz abrufbar.
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="hover:shadow transition">
            <div className="flex items-start gap-3">
              <ScenarioIcon name={s.icon} size={28} className="text-slate-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{s.title}</div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <Badge>{s.category}</Badge>
                  <Badge color={PRIORITY_META[s.priority].color}>{PRIORITY_META[s.priority].label}</Badge>
                  {s.silentDefault && <Badge color="violet">stiller Alarm</Badge>}
                  {s.custom && <Badge color="blue">eigenes Szenario</Badge>}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {s.instructions.length} Sofortmassnahmen · {s.followUp.length} Folgemassnahmen · {s.checklist.length} Checklistenpunkte
                </div>
                {s.responsibleGroupIds.length > 0 && (
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Users size={11} />
                    {s.responsibleGroupIds.map((g) => state.groups.find((x) => x.id === g)?.name).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" onClick={() => setViewing(s)}>Ansehen</Button>
              <Button variant="ghost" onClick={() => setEditing(s)}><Pencil size={14} /></Button>
              <Button variant="ghost" onClick={() => { if (confirm(`Szenario «${s.title}» löschen?`)) dispatch({ type: 'DELETE_SCENARIO', scenarioId: s.id }) }}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-slate-400 py-8">Keine Szenarien gefunden.</div>
        )}
      </div>

      {viewing && <ScenarioDetail scenario={viewing} onClose={() => setViewing(null)} />}
      {editing && <ScenarioEditor scenario={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ScenarioDetail({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const { state } = useStore()
  const contacts = state.contacts.filter((c) => scenario.contactIds.includes(c.id))
  const groups = state.groups.filter((g) => scenario.responsibleGroupIds.includes(g.id))

  return (
    <Modal title={scenario.title} onClose={onClose} wide>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge>{scenario.category}</Badge>
        <Badge color={PRIORITY_META[scenario.priority].color}>{PRIORITY_META[scenario.priority].label}</Badge>
        {scenario.silentDefault && <Badge color="violet">stiller Alarm</Badge>}
        {scenario.defaultChannels.map((c) => <Badge key={c} color="blue">{CHANNEL_LABELS[c].split(' ')[0]}</Badge>)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Sofortmassnahmen</h4>
          <ol className="space-y-2">
            {scenario.instructions.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="text-slate-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          {scenario.followUp.length > 0 && (
            <>
              <h4 className="font-semibold text-slate-700 mt-5 mb-2">Weiterführende Massnahmen</h4>
              <ul className="space-y-1.5">
                {scenario.followUp.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-slate-400 shrink-0">–</span> {step}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Checkliste</h4>
          <ul className="space-y-1.5">
            {scenario.checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" /> {item}
              </li>
            ))}
          </ul>
          {groups.length > 0 && (
            <>
              <h4 className="font-semibold text-slate-700 mt-5 mb-2 flex items-center gap-1.5"><Users size={14} /> Zuständige Gruppen</h4>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => <Badge key={g.id} color={g.isCrisisTeam ? 'violet' : 'slate'}>{g.name}</Badge>)}
              </div>
            </>
          )}
          {contacts.length > 0 && (
            <>
              <h4 className="font-semibold text-slate-700 mt-5 mb-2 flex items-center gap-1.5"><Phone size={14} /> Relevante Notrufnummern</h4>
              <div className="space-y-1.5">
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-brand-600 w-12">{c.number}</span>
                    <span className="text-slate-700">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.description}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ScenarioEditor({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<Scenario>(JSON.parse(JSON.stringify(scenario)))

  function toggleIn<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  function save() {
    dispatch({
      type: 'UPSERT_SCENARIO',
      scenario: {
        ...draft,
        instructions: draft.instructions.filter((s) => s.trim()),
        followUp: draft.followUp.filter((s) => s.trim()),
        checklist: draft.checklist.filter((s) => s.trim()),
      },
    })
    onClose()
  }

  return (
    <Modal title={scenario.title ? `Szenario bearbeiten: ${scenario.title}` : 'Neues Szenario'} onClose={onClose} wide>
      <Field label="Titel">
        <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kategorie">
          <select className={inputClass} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Priorität">
          <select className={inputClass} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ScenarioPriority })}>
            <option value="hoch">Hoch – unmittelbare Gefahr</option>
            <option value="mittel">Mittel – rasches Handeln nötig</option>
            <option value="tief">Tief – geordnetes Vorgehen</option>
          </select>
        </Field>
      </div>
      <Field label="Symbol">
        <div className="grid grid-cols-7 sm:grid-cols-11 gap-2">
          {Object.entries(SCENARIO_ICONS).map(([key, { icon: Icon, label }]) => (
            <button
              key={key}
              type="button"
              title={label}
              onClick={() => setDraft({ ...draft, icon: key })}
              className={`flex items-center justify-center rounded-lg border p-2.5 transition ${
                draft.icon === key ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Sofortmassnahmen (eine pro Zeile – klar und präzise, unter Stress verständlich)">
        <textarea
          className={inputClass} rows={6}
          value={draft.instructions.join('\n')}
          onChange={(e) => setDraft({ ...draft, instructions: e.target.value.split('\n') })}
        />
      </Field>
      <Field label="Weiterführende Massnahmen nach der Akutphase (eine pro Zeile)">
        <textarea
          className={inputClass} rows={4}
          value={draft.followUp.join('\n')}
          onChange={(e) => setDraft({ ...draft, followUp: e.target.value.split('\n') })}
        />
      </Field>
      <Field label="Checkliste (ein Punkt pro Zeile)">
        <textarea
          className={inputClass} rows={4}
          value={draft.checklist.join('\n')}
          onChange={(e) => setDraft({ ...draft, checklist: e.target.value.split('\n') })}
        />
      </Field>
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Standard-Alarmkanäle">
          <div className="space-y-1">
            {ALL_CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.defaultChannels.includes(c)} onChange={() => setDraft({ ...draft, defaultChannels: toggleIn(draft.defaultChannels, c) })} />
                {CHANNEL_LABELS[c].split(' ')[0]}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Zuständige Gruppen (Vorauswahl beim Auslösen)">
          <div className="space-y-1">
            {state.groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.responsibleGroupIds.includes(g.id)} onChange={() => setDraft({ ...draft, responsibleGroupIds: toggleIn(draft.responsibleGroupIds, g.id) })} />
                {g.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Verknüpfte Notrufnummern">
          <div className="space-y-1">
            {state.contacts.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.contactIds.includes(c.id)} onChange={() => setDraft({ ...draft, contactIds: toggleIn(draft.contactIds, c.id) })} />
                {c.number} {c.name}
              </label>
            ))}
          </div>
        </Field>
      </div>
      <Toggle checked={draft.silentDefault} onChange={(v) => setDraft({ ...draft, silentDefault: v })} label="Standardmässig als stiller Alarm auslösen" />
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button onClick={save} disabled={!draft.title.trim()}>Speichern &amp; sofort verteilen</Button>
      </div>
    </Modal>
  )
}
