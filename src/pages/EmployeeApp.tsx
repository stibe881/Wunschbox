import { useState } from 'react'
import { ArrowRight, BatteryFull, BellRing, BookOpen, Check, ChevronLeft, Phone, Signal, Siren, Volume2, WifiOff, X } from 'lucide-react'
import { createAlarm, useStore } from '../store'
import type { Scenario } from '../types'
import { Badge, formatTime } from '../components/ui'
import { ScenarioIcon } from '../components/ScenarioIcon'

type Tab = 'home' | 'scenarios' | 'contacts'

export default function EmployeeApp() {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [openScenario, setOpenScenario] = useState<Scenario | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const me = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0]
  const myAlarms = state.alarms.filter(
    (a) => a.status === 'active' && a.deliveries.some((d) => d.userId === me.id),
  )

  function sos() {
    if (!confirm('SOS-Alarm auslösen? Ersthelfer und Sicherheitsdienst werden sofort alarmiert.')) return
    const alarm = createAlarm(state, {
      scenarioId: 'sc-medizin',
      message: `SOS-Alarm von ${me.firstName} ${me.lastName} (App) – Standort: ${state.locations.find((l) => l.id === me.locationId)?.name ?? 'unbekannt'}`,
      silent: false,
      requireAck: true,
      channels: ['push', 'sms', 'voice'],
      groupIds: ['gr-ersthelfer', 'gr-sicherheit'],
      locationIds: [me.locationId],
      triggeredByUserId: me.id,
      triggeredVia: 'app',
      escalation: [{ afterMinutes: 3, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true }],
    })
    dispatch({ type: 'TRIGGER_ALARM', alarm, audit: `SOS-Alarm via Smartphone-App: ${me.firstName} ${me.lastName}` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mitarbeiter-App (Vorschau)</h1>
        <p className="text-sm text-slate-500">
          So sieht die Smartphone-App (Android, iOS, Huawei) für <strong>{me.firstName} {me.lastName}</strong> aus –
          Nutzer oben links in der Seitenleiste wechseln, um Alarme zu quittieren.
        </p>
      </div>

      <div className="flex gap-8 items-start flex-wrap">
        <div className="w-[360px] shrink-0 rounded-[2.2rem] border-8 border-slate-900 bg-slate-50 shadow-xl overflow-hidden">
          <div className="bg-slate-900 text-white text-xs px-5 py-1.5 flex justify-between">
            <span>{formatTime(Date.now()).slice(0, 5)}</span>
            <span className="flex items-center gap-1.5"><WifiOff size={11} /> offline-fähig <Signal size={11} /> <BatteryFull size={12} /></span>
          </div>

          <div className="bg-brand-600 text-white px-4 py-3">
            <div className="font-bold flex items-center gap-2"><Siren size={16} /> Notfall-App</div>
            <div className="text-xs opacity-80">{me.firstName} {me.lastName} · {state.locations.find((l) => l.id === me.locationId)?.name}</div>
          </div>

          <div className="h-[480px] overflow-y-auto p-4">
            {openScenario ? (
              <div>
                <button className="flex items-center gap-1 text-sm text-slate-500 mb-3" onClick={() => setOpenScenario(null)}>
                  <ChevronLeft size={14} /> Zurück
                </button>
                <ScenarioIcon name={openScenario.icon} size={30} className="text-brand-600 mb-1" />
                <h3 className="font-bold text-slate-800 text-lg mb-3">{openScenario.title}</h3>
                <ol className="space-y-2.5 mb-5">
                  {openScenario.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-slate-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                {openScenario.contactIds.length > 0 && (
                  <div className="mb-5 space-y-1.5">
                    {state.contacts
                      .filter((c) => openScenario.contactIds.includes(c.id))
                      .map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm">
                          <Phone size={14} className="text-brand-600" />
                          <span className="text-slate-700 flex-1">{c.name}</span>
                          <span className="font-bold text-brand-600">{c.number}</span>
                        </div>
                      ))}
                  </div>
                )}
                {openScenario.followUp.length > 0 && (
                  <>
                    <h4 className="font-semibold text-slate-700 text-sm mb-2">Danach</h4>
                    <ul className="space-y-1.5 mb-5">
                      {openScenario.followUp.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-slate-400 shrink-0">–</span> {step}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <h4 className="font-semibold text-slate-700 text-sm mb-2">Checkliste</h4>
                <ul className="space-y-1.5">
                  {openScenario.checklist.map((item, i) => {
                    const key = `${openScenario.id}-${i}`
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={checked[key] ?? false} onChange={() => setChecked({ ...checked, [key]: !checked[key] })} />
                        <span className={checked[key] ? 'line-through text-slate-400' : ''}>{item}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : tab === 'home' ? (
              <div className="space-y-4">
                {myAlarms.length > 0 && (
                  <div className="space-y-3">
                    {myAlarms.map((a) => {
                      const scenario = state.scenarios.find((s) => s.id === a.scenarioId)
                      const myAck = a.deliveries.find((d) => d.userId === me.id)?.ack ?? 'none'
                      return (
                        <div key={a.id} className={`rounded-xl border-2 p-3 ${a.silent ? 'border-violet-400 bg-violet-50' : 'border-brand-500 bg-brand-50 alarm-pulse'}`}>
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <BellRing size={16} className={a.silent ? 'text-violet-600' : 'text-brand-600 animate-pulse'} />
                            <ScenarioIcon name={scenario?.icon ?? ''} size={16} className="text-slate-500" /> {scenario?.title}
                            {a.silent && <Badge color="violet">still</Badge>}
                          </div>
                          <p className="text-sm text-slate-700 mt-1">{a.message}</p>
                          {!a.silent && (
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <Volume2 size={12} /> Critical Alert – auch bei stummgeschaltetem Gerät hörbar
                            </div>
                          )}
                          {scenario && (
                            <button className="mt-2 text-sm text-brand-700 underline inline-flex items-center gap-1" onClick={() => setOpenScenario(scenario)}>
                              Handlungsanweisungen öffnen <ArrowRight size={13} />
                            </button>
                          )}
                          {a.requireAck && myAck === 'none' && (
                            <div className="flex gap-2 mt-3">
                              <button
                                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                                onClick={() => dispatch({ type: 'ACK_ALARM', alarmId: a.id, userId: me.id, ack: 'acknowledged' })}
                              >
                                <Check size={15} /> Ich komme
                              </button>
                              <button
                                className="flex-1 bg-slate-300 text-slate-700 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                                onClick={() => dispatch({ type: 'ACK_ALARM', alarmId: a.id, userId: me.id, ack: 'declined' })}
                              >
                                <X size={15} /> Nicht verfügbar
                              </button>
                            </div>
                          )}
                          {a.requireAck && myAck !== 'none' && (
                            <div className="mt-2 text-sm">{myAck === 'acknowledged' ? <Badge color="green">quittiert – Sie nehmen teil</Badge> : <Badge>als nicht verfügbar gemeldet</Badge>}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {myAlarms.length === 0 && (
                  <div className="text-center text-sm text-slate-400 py-4">Keine aktiven Alarme für Sie.</div>
                )}
                <button className="w-full rounded-2xl bg-brand-600 text-white py-6 font-bold text-lg shadow-lg active:scale-95 transition" onClick={sos}>
                  <Siren className="inline mr-2" /> SOS – Alarm auslösen
                </button>
                <div className="text-xs text-center text-slate-400">
                  Interne Notfallnummer: {state.integrations.hotline.number}
                </div>
              </div>
            ) : tab === 'scenarios' ? (
              <div className="grid grid-cols-2 gap-2">
                {state.scenarios.map((s) => (
                  <button key={s.id} className="rounded-xl border border-slate-200 bg-white p-3 text-left" onClick={() => setOpenScenario(s)}>
                    <ScenarioIcon name={s.icon} size={22} className="text-brand-600" />
                    <div className="text-sm font-medium text-slate-800 leading-tight mt-1">{s.title}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {state.contacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 p-3">
                    <Phone size={18} className="text-brand-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.description}</div>
                    </div>
                    <span className="font-bold text-brand-600">{c.number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 border-t border-slate-200 bg-white text-xs">
            {([
              ['home', 'Alarm', Siren],
              ['scenarios', 'Szenarien', BookOpen],
              ['contacts', 'Notruf', Phone],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                className={`py-2.5 flex flex-col items-center gap-0.5 ${tab === key ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}
                onClick={() => { setTab(key); setOpenScenario(null) }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[260px] text-sm text-slate-600 space-y-3 max-w-md">
          <h3 className="font-semibold text-slate-800">Was hier simuliert wird</h3>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong>Critical Alerts:</strong> Push-Mitteilungen mit kritischen Signaltönen, auch bei stummgeschaltetem Gerät.</li>
            <li><strong>Stille Alarme</strong> erscheinen diskret ohne Ton (violett markiert).</li>
            <li><strong>Quittierfunktion:</strong> Aufgebotene melden per Knopfdruck «Ich komme» / «Nicht verfügbar» – live in der Alarmzentrale sichtbar.</li>
            <li><strong>Offline-Verfügbarkeit:</strong> Szenarien und Checklisten sind lokal gespeichert und ohne Netz nutzbar.</li>
            <li><strong>SOS-Taste:</strong> App-basierte Alarmauslösung mit automatischer Standortangabe und Eskalation.</li>
            <li><strong>Mehrsprachigkeit:</strong> Inhalte werden in der Sprache des Nutzerprofils angezeigt (DE/EN/FR/IT).</li>
          </ul>
          <p className="text-xs text-slate-400">
            Tipp: Alarm mit Quittierung auslösen, dann hier den Nutzer wechseln (Seitenleiste unten) und quittieren –
            der Status erscheint sofort in der Alarmzentrale.
          </p>
        </div>
      </div>
    </div>
  )
}
