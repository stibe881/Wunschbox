import { useState } from 'react'
import { KeyRound, Link2, Phone, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { uid, useStore } from '../store'
import type { IntegrationSettings, Webhook } from '../types'
import { Badge, Button, Card, Field, Modal, Toggle, formatDateTime, inputClass } from '../components/ui'

export default function Integrations() {
  const { state, dispatch } = useStore()
  const integ = state.integrations
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)

  function update(patch: Partial<IntegrationSettings>) {
    dispatch({ type: 'UPDATE_INTEGRATIONS', integrations: { ...integ, ...patch } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Integrationen &amp; Optionen</h1>
        <p className="text-sm text-slate-500">Anbindung von Drittanwendungen, Kommunikationskanälen und Deployment-Optionen</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Kommunikationskanäle">
          <div className="space-y-4">
            <div>
              <Toggle checked={integ.smsGateway.enabled} onChange={(v) => update({ smsGateway: { ...integ.smsGateway, enabled: v } })} label="SMS-Gateway (Anbindung Drittsysteme via SMS)" />
              {integ.smsGateway.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-2 pl-11">
                  <Field label="Provider">
                    <input className={inputClass} value={integ.smsGateway.provider} onChange={(e) => update({ smsGateway: { ...integ.smsGateway, provider: e.target.value } })} />
                  </Field>
                  <Field label="Absenderkennung">
                    <input className={inputClass} value={integ.smsGateway.senderId} onChange={(e) => update({ smsGateway: { ...integ.smsGateway, senderId: e.target.value } })} />
                  </Field>
                </div>
              )}
            </div>
            <div>
              <Toggle checked={integ.voip.enabled} onChange={(v) => update({ voip: { ...integ.voip, enabled: v } })} label="VoIP-Integration (Telefonanlage)" />
              {integ.voip.enabled && (
                <div className="mt-2 pl-11">
                  <Field label="SIP-Server">
                    <input className={inputClass} placeholder="sip.firma.ch" value={integ.voip.sipServer} onChange={(e) => update({ voip: { ...integ.voip, sipServer: e.target.value } })} />
                  </Field>
                </div>
              )}
            </div>
            <div>
              <Toggle checked={integ.teams.enabled} onChange={(v) => update({ teams: { ...integ.teams, enabled: v } })} label="Microsoft Teams-Integration" />
              {integ.teams.enabled && (
                <div className="mt-2 pl-11">
                  <Field label="Tenant">
                    <input className={inputClass} value={integ.teams.tenant} onChange={(e) => update({ teams: { ...integ.teams, tenant: e.target.value } })} />
                  </Field>
                </div>
              )}
            </div>
            <div>
              <Toggle checked={integ.hotline.enabled} onChange={(v) => update({ hotline: { ...integ.hotline, enabled: v } })} label="Interne Notfallnummer (Alarmauslösung per Anruf / Sprachnachricht)" />
              {integ.hotline.enabled && (
                <div className="mt-2 pl-11 flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} /> {integ.hotline.number}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Identität &amp; Personalsystem">
          <div className="space-y-4">
            <div>
              <Toggle checked={integ.sso.enabled} onChange={(v) => update({ sso: { ...integ.sso, enabled: v } })} label="Single Sign-On (SSO)" />
              {integ.sso.enabled && (
                <div className="grid grid-cols-2 gap-4 mt-2 pl-11">
                  <Field label="Provider">
                    <input className={inputClass} value={integ.sso.provider} onChange={(e) => update({ sso: { ...integ.sso, provider: e.target.value } })} />
                  </Field>
                  <Field label="Entity-ID">
                    <input className={inputClass} value={integ.sso.entityId} onChange={(e) => update({ sso: { ...integ.sso, entityId: e.target.value } })} />
                  </Field>
                </div>
              )}
              {!integ.sso.enabled && <div className="text-xs text-slate-400 pl-11 mt-1">Alternativ: Authentifizierung via SMS-/E-Mail-Code</div>}
            </div>
            <div>
              <Toggle checked={integ.hrSync.enabled} onChange={(v) => update({ hrSync: { ...integ.hrSync, enabled: v, lastSync: v ? Date.now() : integ.hrSync.lastSync } })} label="Automatische Synchronisation mit Personalsystem" />
              {integ.hrSync.enabled && (
                <div className="mt-2 pl-11 space-y-2">
                  <Field label="System">
                    <input className={inputClass} value={integ.hrSync.system} onChange={(e) => update({ hrSync: { ...integ.hrSync, system: e.target.value } })} />
                  </Field>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {integ.hrSync.lastSync && <span>Letzte Synchronisation: {formatDateTime(integ.hrSync.lastSync)}</span>}
                    <Button variant="secondary" onClick={() => update({ hrSync: { ...integ.hrSync, lastSync: Date.now() } })}>
                      <RefreshCw size={13} /> Jetzt synchronisieren
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <Toggle checked={integ.multiLanguage} onChange={(v) => update({ multiLanguage: v })} label="Mehrsprachige App-Inhalte (DE/EN/FR/IT)" />
              <Toggle checked={integ.geofencing} onChange={(v) => update({ geofencing: v })} label="Geofencing (automatische Standortzuweisung)" />
            </div>
          </div>
        </Card>

        <Card
          title={<span className="flex items-center gap-2"><Link2 size={16} /> IP- / Webhook-Integration</span>}
          actions={<Button variant="secondary" onClick={() => setEditingWebhook({ id: uid('wh'), name: '', url: '', direction: 'inbound', active: true })}><Plus size={14} /> Webhook</Button>}
        >
          <div className="space-y-2">
            {integ.webhooks.map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{w.name}</div>
                  <div className="text-xs text-slate-400 truncate">{w.url}</div>
                </div>
                <Badge color={w.direction === 'inbound' ? 'blue' : 'violet'}>{w.direction === 'inbound' ? 'eingehend' : 'ausgehend'}</Badge>
                <Badge color={w.active ? 'green' : 'slate'}>{w.active ? 'aktiv' : 'inaktiv'}</Badge>
                <Button variant="ghost" onClick={() => setEditingWebhook(w)}>Bearbeiten</Button>
                <Button variant="ghost" onClick={() => dispatch({ type: 'DELETE_WEBHOOK', webhookId: w.id })}><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-3">
            Eingehende Webhooks lösen Alarme automatisch aus (z. B. Brandmeldeanlage) – ausgehende melden Ereignisse an Drittsysteme.
          </div>
        </Card>

        <Card title={<span className="flex items-center gap-2"><KeyRound size={16} /> Deployment via Zugangscodes</span>}>
          <p className="text-sm text-slate-500 mb-3">
            Mitarbeitende installieren die App selbständig und konfigurieren sie mit einem Zugangscode – ohne MDM.
          </p>
          <div className="space-y-2">
            {integ.accessCodes.map((c) => (
              <div key={c.code} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                <code className="font-mono font-semibold text-slate-800">{c.code}</code>
                <span className="text-xs text-slate-400 flex-1">
                  {state.locations.find((l) => l.id === c.locationId)?.name} · erstellt {formatDateTime(c.createdAt)}
                </span>
                <Badge>{c.used}× verwendet</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {state.locations.map((l) => (
              <Button key={l.id} variant="secondary" onClick={() => dispatch({ type: 'ADD_ACCESS_CODE', locationId: l.id })}>
                <Plus size={13} /> Code für {l.name}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {editingWebhook && <WebhookEditor webhook={editingWebhook} onClose={() => setEditingWebhook(null)} />}
    </div>
  )
}

function WebhookEditor({ webhook, onClose }: { webhook: Webhook; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [draft, setDraft] = useState<Webhook>({ ...webhook })

  return (
    <Modal title={webhook.name ? `Webhook: ${webhook.name}` : 'Neuer Webhook'} onClose={onClose}>
      <Field label="Name">
        <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </Field>
      <Field label="URL / Endpunkt">
        <input className={inputClass} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
      </Field>
      <Field label="Richtung">
        <select className={inputClass} value={draft.direction} onChange={(e) => setDraft({ ...draft, direction: e.target.value as Webhook['direction'] })}>
          <option value="inbound">Eingehend (löst Alarm aus)</option>
          <option value="outbound">Ausgehend (meldet Ereignisse)</option>
        </select>
      </Field>
      {draft.direction === 'inbound' && (
        <Field label="Auszulösendes Szenario">
          <select className={inputClass} value={draft.scenarioId ?? ''} onChange={(e) => setDraft({ ...draft, scenarioId: e.target.value || undefined })}>
            <option value="">–</option>
            {state.scenarios.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.title}</option>)}
          </select>
        </Field>
      )}
      <div className="mb-4">
        <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} label="Aktiv" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button onClick={() => { dispatch({ type: 'UPSERT_WEBHOOK', webhook: draft }); onClose() }} disabled={!draft.name.trim() || !draft.url.trim()}>
          Speichern
        </Button>
      </div>
    </Modal>
  )
}
