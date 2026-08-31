import type { Response } from 'express'

/**
 * Live-Aktualisierung der Clients über Server-Sent Events.
 * Jede Änderung am Datenbestand wird an alle offenen Verbindungen gemeldet;
 * die Clients laden daraufhin den aktuellen Stand. Damit sehen Portal und App
 * dieselben Daten, ohne dass jemand neu laden muss.
 */

interface Verbindung {
  id: number
  res: Response
}

const verbindungen = new Set<Verbindung>()
let naechsteId = 1

export function addClient(res: Response): () => void {
  const verbindung: Verbindung = { id: naechsteId++, res }
  verbindungen.add(verbindung)
  res.write(': verbunden\n\n')
  return () => verbindungen.delete(verbindung)
}

export function broadcast(typ: string, nutzlast: unknown = {}): void {
  const zeile = `event: ${typ}\ndata: ${JSON.stringify(nutzlast)}\n\n`
  for (const v of verbindungen) {
    try {
      v.res.write(zeile)
    } catch {
      verbindungen.delete(v)
    }
  }
}

/** Verbindungen offen halten – Proxys trennen sonst nach kurzer Zeit */
export function startHeartbeat(): NodeJS.Timeout {
  return setInterval(() => {
    for (const v of verbindungen) {
      try {
        v.res.write(': ping\n\n')
      } catch {
        verbindungen.delete(v)
      }
    }
  }, 25_000)
}

export const clientCount = () => verbindungen.size
