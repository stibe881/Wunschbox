import { broadcast } from './events.js'
import { sendPush } from './push.js'
import {
  addAudit, allAlarms, allLoneWork, allScenarios, allStoredUsers, buildDeliveries, createAlarm,
  integrations, resolveRecipients, saveAlarm, upsertDoc,
} from './store.js'
import type { Alarm, AlarmLogEntry } from './types.js'

/**
 * Serverseitige Alarmverarbeitung. Läuft unabhängig von geöffneten Geräten:
 * Eskalationsstufen greifen und abgelaufene Alleinarbeits-Timer lösen aus,
 * auch wenn niemand die App offen hat.
 */

/** Empfänger eines Alarms, die noch nicht quittiert haben */
function offeneEmpfaenger(alarm: Alarm): string[] {
  const alle = [...new Set(alarm.deliveries.map((d) => d.userId))]
  return alle.filter((id) => alarm.deliveries.every((d) => d.userId !== id || d.ack === 'none'))
}

/** Push an alle Empfänger eines Alarms */
export async function alarmPush(alarm: Alarm, empfaenger?: string[]): Promise<void> {
  if (alarm.silent) return
  const szenario = allScenarios().find((s) => s.id === alarm.scenarioId)
  const ids = empfaenger ?? [...new Set(alarm.deliveries.map((d) => d.userId))]
  await sendPush(ids, {
    title: szenario ? `Alarm: ${szenario.title}` : 'Alarm ausgelöst',
    body: alarm.message,
    data: { alarmId: alarm.id, scenarioId: alarm.scenarioId },
    critical: true,
  })
}

/** Ausgehende Webhooks benachrichtigen */
export async function ausgehendeWebhooks(alarm: Alarm): Promise<void> {
  const szenario = allScenarios().find((s) => s.id === alarm.scenarioId)
  const nutzlast = JSON.stringify({
    event: 'alarm.triggered',
    alarmId: alarm.id,
    scenario: szenario?.title ?? alarm.scenarioId,
    message: alarm.message,
    silent: alarm.silent,
    triggeredAt: new Date(alarm.triggeredAt).toISOString(),
    locations: alarm.locationIds,
    groups: alarm.groupIds,
    channels: alarm.channels,
  })
  for (const wh of integrations().webhooks?.filter((w) => w.active && w.direction === 'outbound') ?? []) {
    try {
      await fetch(wh.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: nutzlast })
    } catch {
      // Zielsystem nicht erreichbar – der Alarm bleibt trotzdem erfasst
    }
  }
}

/** Eine Runde Eskalationsprüfung und Timer-Überwachung */
export async function tick(): Promise<void> {
  const jetzt = Date.now()
  let veraendert = false

  // --- Eskalationsstufen ---
  for (const alarm of allAlarms().filter((a) => a.status === 'active')) {
    const stufe = alarm.escalation[alarm.escalationStage]
    if (!stufe) continue
    const quittiert = alarm.deliveries.some((d) => d.ack === 'acknowledged')
    if (quittiert || jetzt - alarm.triggeredAt <= stufe.afterMinutes * 60_000) continue

    const empfaenger = resolveRecipients(allStoredUsers(), stufe.groupIds, alarm.locationIds)
    const log: AlarmLogEntry[] = [
      ...alarm.log,
      {
        ts: jetzt,
        message: `Eskalationsstufe ${alarm.escalationStage + 1}: ${empfaenger.length} weitere Empfänger${
          stufe.notifyEmergencyServices ? ' – Blaulichtorganisationen benachrichtigt' : ''
        }`,
      },
    ]
    const aktualisiert: Alarm = {
      ...alarm,
      escalationStage: alarm.escalationStage + 1,
      deliveries: [...alarm.deliveries, ...buildDeliveries(empfaenger.map((e) => e.id), stufe.channels)],
      log,
    }
    saveAlarm(aktualisiert)
    addAudit('alarm', `Eskalation Stufe ${aktualisiert.escalationStage} für Alarm ${alarm.id}`)
    await alarmPush(aktualisiert, empfaenger.map((e) => e.id))
    veraendert = true
  }

  // --- Alleinarbeits-Timer abgelaufen ---
  const abgelaufen = allLoneWork().filter((s) => s.status === 'running' && jetzt > s.expiresAt)
  for (const sitzung of abgelaufen) {
    upsertDoc('lone_work', sitzung.id, { ...sitzung, status: 'alarm' })
    const person = allStoredUsers().find((u) => u.id === sitzung.userId)
    const alarm = createAlarm({
      scenarioId: 'sc-medizin',
      message: `ALLEINARBEIT: Timer von ${person ? `${person.firstName} ${person.lastName}` : '?'} abgelaufen (${sitzung.activity}). Keine Rückmeldung – bitte sofort prüfen!`,
      silent: sitzung.silent,
      requireAck: true,
      channels: ['push', 'sms', 'voice'],
      groupIds: ['gr-ersthelfer', 'gr-sicherheit'],
      locationIds: [sitzung.locationId],
      triggeredByUserId: sitzung.userId,
      triggeredVia: 'timer',
      escalation: [{ afterMinutes: 5, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true }],
    })
    saveAlarm(alarm)
    addAudit('alarm', `Automatischer Alleinarbeiter-Alarm: Timer abgelaufen (${person?.firstName} ${person?.lastName})`, sitzung.userId)
    await alarmPush(alarm)
    await ausgehendeWebhooks(alarm)
    veraendert = true
  }

  // --- Erinnerung an offene Quittierungen ---
  for (const alarm of allAlarms().filter((a) => a.status === 'active' && a.requireAck)) {
    const alter = jetzt - alarm.triggeredAt
    const faellig = alter > 120_000 && alter < 135_000
    if (!faellig) continue
    const offen = offeneEmpfaenger(alarm)
    if (offen.length > 0) await alarmPush(alarm, offen)
  }

  if (veraendert) broadcast('state')
}

export function startEngine(): NodeJS.Timeout {
  return setInterval(() => {
    tick().catch((fehler) => console.error('[engine] Fehler im Durchlauf:', fehler))
  }, 5_000)
}
