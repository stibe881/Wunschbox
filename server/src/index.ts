import cors from 'cors'
import express from 'express'
import { purgeExpiredSessions } from './auth.js'
import { startEngine } from './engine.js'
import { startHeartbeat } from './events.js'
import { router } from './routes.js'
import { INITIAL_ADMIN_EMAIL, seedDatabase } from './setup.js'

const PORT = Number(process.env.PORT ?? 3001)

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }))
app.use('/api', router)

// Fehler nie ungefiltert nach aussen geben
app.use((fehler: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api]', fehler)
  res.status(500).json({ error: 'Interner Serverfehler.' })
})

seedDatabase()
purgeExpiredSessions()
startEngine()
startHeartbeat()

app.listen(PORT, () => {
  console.log(`SOBE-Notfall-Alarmserver läuft auf http://localhost:${PORT}`)
  console.log(`Administrator: ${INITIAL_ADMIN_EMAIL}`)
})
