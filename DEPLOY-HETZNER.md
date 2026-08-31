# Betrieb auf dem Hetzner-Webhosting

Ziel: Portal und Alarmserver laufen unter **einer** Adresse. Der Node-Server
liefert die Schnittstelle unter `/api` und das gebaute Portal unter `/` aus.

Das ist auf einem Hosting die einfachste Variante — ein Zertifikat, keine
CORS-Fragen, kein Mixed-Content, und die iOS-App braucht nur eine Adresse.

```
https://temp-gross-ict.ch/            → Portal
https://temp-gross-ict.ch/api/…       → Schnittstelle
```

## 1. Vorbereitung auf dem eigenen Rechner

Portal bauen und alles einpacken, was auf den Server gehört:

```powershell
cd "C:\Webseiten und Apps\Wunschbox"
npm ci
npm run build          # erzeugt dist/

cd server
npm ci
npm run build          # erzeugt server/dist/
```

Auf den Server gehören:

| Vom Rechner | Auf den Server |
| --- | --- |
| `dist/` | `~/public_html/temp-gross-ict.ch/dist/` |
| `server/dist/` | `~/public_html/temp-gross-ict.ch/server/dist/` |
| `server/package.json`, `server/package-lock.json` | `~/public_html/temp-gross-ict.ch/server/` |

**Nicht** übertragen: `node_modules` (wird auf dem Server installiert),
`server/.env` (wird dort neu angelegt), `server/data/` (die Datenbank des
Testbetriebs).

Übertragen zum Beispiel mit WinSCP oder FileZilla per SFTP.

## 2. Abhängigkeiten auf dem Server installieren

```bash
cd ~/public_html/temp-gross-ict.ch/server
npm ci --omit=dev
```

`better-sqlite3` enthält einen kompilierten Teil. Schlägt die Installation fehl,
hilft meistens:

```bash
npm rebuild better-sqlite3 --build-from-source
```

## 3. Einstellungen hinterlegen

```bash
cd ~/public_html/temp-gross-ict.ch/server
cp .env.example .env
nano .env
```

Inhalt:

```
PORT=3001
HOST=127.0.0.1
SOBE_DB_PATH=/usr/home/jqviwy/public_html/temp-gross-ict.ch/server/data/sobe-notfall.sqlite
SOBE_WEB_ROOT=/usr/home/jqviwy/public_html/temp-gross-ict.ch/dist
SOBE_ADMIN_EMAIL=stefan.gross@sonnenberg-baar.ch
EXPO_TOKEN=
```

Den absoluten Pfad mit `pwd` ermitteln und einsetzen. `HOST=127.0.0.1` sorgt
dafür, dass der Server nur lokal lauscht und ausschliesslich über den Webserver
des Hosters erreichbar ist.

`EXPO_TOKEN` wird nur für den iOS-Build über den Update-Knopf gebraucht. Ob
dieser Knopf auf dem Hosting sinnvoll ist, hängt davon ab, ob dort ein
Git-Arbeitsverzeichnis liegt — siehe Abschnitt 6.

## 4. Server starten

```bash
cd ~/public_html/temp-gross-ict.ch/server
node dist/index.js
```

Erwartete Ausgabe:

```
[env] Einstellungen aus …/server/.env geladen
SOBE-Notfall-Alarmserver läuft auf http://localhost:3001
Webportal wird mit ausgeliefert aus …/dist
Administrator: stefan.gross@sonnenberg-baar.ch
```

Prüfen, solange der Server läuft (zweite Sitzung):

```bash
curl -s http://127.0.0.1:3001/api/health
curl -sI http://127.0.0.1:3001/ | head -1
```

## 5. Dauerbetrieb und Erreichbarkeit von aussen

Hier unterscheiden sich die Hosting-Pakete. Zwei Wege:

**a) Node.js-Anwendung im Hosting-Panel.** Bietet das Paket eine
Node.js-Anwendung an, wird dort eingetragen:

- Anwendungsverzeichnis: `public_html/temp-gross-ict.ch/server`
- Startdatei: `dist/index.js`
- Node-Version: 20 oder neuer

Das Panel startet den Prozess, überwacht ihn und leitet die Domain darauf um.

**b) Start über Cron.** Steht kein Panel-Eintrag zur Verfügung, hält ein
Cron-Eintrag den Prozess am Leben — dasselbe Vorgehen wie bei Ihren
bestehenden Node-Anwendungen (`cron-push.sh`, `app.log`):

```bash
# ~/public_html/temp-gross-ict.ch/server/start.sh
#!/bin/bash
cd "$(dirname "$0")"
pgrep -f "node dist/index.js" >/dev/null && exit 0
nohup node dist/index.js >> ../app.log 2>> ../node_error.log &
```

```bash
chmod +x start.sh
crontab -e
# alle fünf Minuten prüfen, ob der Server läuft
*/5 * * * * /usr/home/jqviwy/public_html/temp-gross-ict.ch/server/start.sh
```

Die Domain muss anschliessend auf `127.0.0.1:3001` weitergeleitet werden. Ohne
Node-Unterstützung im Panel geht das nur mit einem Reverse Proxy, den der Hoster
bereitstellen muss.

> **Ohne Weiterleitung ist der Server von aussen nicht erreichbar.** Ein reines
> PHP-Webhosting kann keinen Node-Prozess veröffentlichen. Klären Sie das vor
> dem Übertragen mit dem Hoster ab.

## 6. Update-Knopf auf dem Hosting

Der Knopf im Portal führt `git pull` und die Builds aus. Dafür muss auf dem
Server ein Git-Arbeitsverzeichnis liegen — statt Dateien zu übertragen, wird das
Projekt dort geklont:

```bash
cd ~/public_html/temp-gross-ict.ch
git clone -b claude/e-mergency-webapp-5hc2yl https://github.com/stibe881/Wunschbox.git .
npm ci && npm run build
cd server && npm ci && npm run build
```

Dann zeigt `SOBE_REPO_ROOT` auf dieses Verzeichnis, und der Update-Knopf
funktioniert wie lokal. Für den Neustart nach der Aktualisierung braucht es den
Cron-Eintrag aus Abschnitt 5 oder den Panel-Eintrag — beide starten den Prozess
von selbst neu.

Ohne Git-Verzeichnis bleibt der Weg über das Übertragen der gebauten Dateien;
setzen Sie dann `SOBE_AUTO_RESTART=false` und aktualisieren Sie von Hand.

## 7. Nach dem ersten Start

1. `https://temp-gross-ict.ch` aufrufen, oben auf **LIVE** stellen.
2. Mit `stefan.gross@sonnenberg-baar.ch` und dem Erstpasswort anmelden, sofort
   ein eigenes vergeben.
3. In der iOS-App unter «Alarmserver» `https://temp-gross-ict.ch` eintragen.

Ab hier kommen alle Konten und Daten vom Hosting, und Portal wie App sehen
denselben Stand — unabhängig davon, in welchem Netz sich ein Gerät befindet.

## Sicherung

Der gesamte Datenbestand liegt in einer Datei:

```bash
cp ~/public_html/temp-gross-ict.ch/server/data/sobe-notfall.sqlite \
   ~/sicherung-sobe-$(date +%F).sqlite
```

Das lohnt sich als täglicher Cron-Eintrag.

## Was noch fehlt

**HTTPS ist Pflicht.** Über `http` gehen Passwörter und Sitzungs-Token
unverschlüsselt durchs Netz. Das Zertifikat stellt der Hoster; die Domain muss
auf `https` erzwungen werden.

**Die App braucht einen neuen Build**, sobald die Adresse wechselt — nicht
zwingend, da die Serveradresse in der App eingetragen werden kann, aber
angenehmer: Die Vorgabe `DEFAULT_SERVER_URL` in `mobile/src/api.ts` lässt sich
auf `https://temp-gross-ict.ch` setzen, dann stimmt sie ab Installation.
