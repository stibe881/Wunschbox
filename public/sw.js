// Service Worker: App-Shell und Assets für Offline-Betrieb zwischenspeichern
//
// Version erhöhen, wenn sich die Regeln ändern – beim Aktivieren werden alle
// älteren Caches gelöscht.
const CACHE = 'sonnenberg-notfall-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // Die Schnittstelle darf niemals aus dem Zwischenspeicher kommen. Liefert der
  // Alarmserver das Portal unter derselben Adresse aus, landen sonst Anmeldung,
  // Benutzerliste und Alarme im Cache – und die App zeigt dauerhaft einen alten
  // Stand. Der Ereignisstrom /api/events darf ohnehin nie abgefangen werden.
  if (url.pathname.startsWith('/api/')) return

  // Seitenaufrufe: Netz zuerst, offline aus dem Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('index.html', copy))
          return response
        })
        .catch(() => caches.match('index.html')),
    )
    return
  }

  // Assets: Cache zuerst (Vite-Assets sind inhalts-gehasht), sonst Netz und nachcachen
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
