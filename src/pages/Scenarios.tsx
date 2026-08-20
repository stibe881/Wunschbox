import { useState } from 'react'
import { Pencil, Plus, Trash2, WifiOff } from 'lucide-react'
import { uid, useStore } from '../store'
import type { Scenario } from '../types'
import { Badge, Button, Card, Field, Modal, Toggle, inputClass } from '../components/ui'

export default function Scenarios() {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState<Scenario | null>(null)
  const [viewing, setViewing] = useState<Scenario | null>(null)

  function newScenario(): Scenario {
    return { id: uid('sc'), icon: '📋', title: '', category: 'Organisation', instructions: [''], checklist: [''], silentDefault: false, custom: true }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Szenarien &amp; Checklisten</h1>
          <p className="text-sm text-slate-500">
            {state.scenarios.length} Notfallszenarien mit Handlungsanweisungen · Content-Management ohne technische Vorkenntnisse ·
            Änderungen werden sofort an alle Apps verteilt
          </p>
        </div>
        <Button onClick={() => setEditing(newScenario())}><Plus size={16} /> Neues Szenario</Button>
      </div>

      <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <WifiOff size={14} className="text-emerald-600" />
        Offline-Verfügbarkeit: Alle Szenarien und Checklisten werden lokal auf den Endgeräten zwischengespeichert und sind auch ohne Netz abrufbar.
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.scenarios.map((s) => (
          <Card key={s.id} className="hover:shadow transition">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{s.title}</div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <Badge>{s.category}</Badge>
                  {s.silentDefault && <Badge color="violet">stiller Alarm</Badge>}
                  {s.custom && <Badge color="blue">eigenes Szenario</Badge>}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {s.instructions.length} Handlungsanweisungen · {s.checklist.length} Checklistenpunkte
                </div>
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
      </div>

      {viewing && (
        <Modal title={`${viewing.icon} ${viewing.title}`} onClose={() => setViewing(null)} wide>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Handlungsanweisungen</h4>
              <ol className="space-y-2">
                {viewing.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-slate-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Checkliste</h4>
              <ul className="space-y-1.5">
                {viewing.checklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {editing && <ScenarioEditor scenario={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ScenarioEditor({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const { dispatch } = useStore()
  const [draft, setDraft] = useState<Scenario>({ ...scenario })

  function save() {
    dispatch({
      type: 'UPSERT_SCENARIO',
      scenario: {
        ...draft,
        instructions: draft.instructions.filter((s) => s.trim()),
        checklist: draft.checklist.filter((s) => s.trim()),
      },
    })
    onClose()
  }

  return (
    <Modal title={scenario.title ? `Szenario bearbeiten: ${scenario.title}` : 'Neues Szenario'} onClose={onClose} wide>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Symbol (Emoji)">
          <input className={inputClass} value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
        </Field>
        <div className="col-span-2">
          <Field label="Titel">
            <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
        </div>
      </div>
      <Field label="Kategorie">
        <select className={inputClass} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
          {['Gebäude', 'Personen', 'Sicherheit', 'Technik', 'Naturereignis', 'Organisation'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Handlungsanweisungen (eine pro Zeile – klar und präzise, unter Stress verständlich)">
        <textarea
          className={inputClass} rows={6}
          value={draft.instructions.join('\n')}
          onChange={(e) => setDraft({ ...draft, instructions: e.target.value.split('\n') })}
        />
      </Field>
      <Field label="Checkliste (ein Punkt pro Zeile)">
        <textarea
          className={inputClass} rows={4}
          value={draft.checklist.join('\n')}
          onChange={(e) => setDraft({ ...draft, checklist: e.target.value.split('\n') })}
        />
      </Field>
      <Toggle checked={draft.silentDefault} onChange={(v) => setDraft({ ...draft, silentDefault: v })} label="Standardmässig als stiller Alarm auslösen" />
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button onClick={save} disabled={!draft.title.trim()}>Speichern &amp; sofort verteilen</Button>
      </div>
    </Modal>
  )
}
