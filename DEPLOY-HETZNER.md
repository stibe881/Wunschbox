# Umzug auf das Hetzner-Webhosting

Ziel: Portal und Alarmserver laufen unter **einer** Adresse, erreichbar aus
jedem Netz – Schulhaus, Mobilfunk, Homeoffice.

```
https://temp-gross-ict.ch/          -> Portal
https://temp-gross-ict.ch/api/...   -> Schnittstelle für Portal und App
```

Das ist im Hosting die einfachste Variante: ein Zertifikat, keine CORS-Fragen,
kein Mixed-Content, und die App braucht nur eine Adresse.

Rechnen Sie mit **60 bis 90 Minuten**. Die Schritte bauen aufeinander auf;
jeder endet mit einer Prüfung, die Sie sehen können.

---

## 0. Vorher klären

Drei Dinge müssen stimmen, sonst hilft alles Weitere nichts.

| Was | Warum | Wie prüfen |
| --- | --- | --- |
| **Node.js 22 oder 24** im Panel | `better-sqlite3` bringt fertige Binärdateien nur für bestimmte Versionen mit; ohne passende müsste auf dem Server kompiliert werden | `node -v` |
| **SSH-Zugang** | Ohne Konsole lässt sich nichts installieren und nichts prüfen | `ssh benutzer@server` |
| **Let's-Encrypt-Zertifikat** für die Domain | Ohne HTTPS gingen Passwörter im Klartext durchs Netz | Panel: SSL/TLS |

Sind alle drei da, weiter mit Schritt 1.

> **Ohne Node.js-Unterstützung geht es nicht.** Ein reines PHP-Webhosting kann
> keinen dauerhaft laufenden Node-Prozess veröffentlichen.

---

## 1. Projekt auf den Server holen

Nicht Dateien hochladen, sondern klonen: Nur mit einem Git-Arbeitsverzeichnis
funktioniert später der Knopf **Aktualisierung** im Portal.

```bash
ssh benutzer@server
cd ~/public_html/temp-gross-ict.ch

# Verzeichnis muss leer sein - sonst verweigert git clone
ls -A

git clone -b claude/e-mergency-webapp-5hc2yl \
  https://github.com/stibe881/Wunschbox.git .
```

**Prüfen:**

```bash
git log --oneline -1     # zeigt den letzten Commit
node -v                  # v22.x oder v24.x
pwd -P                   # den echten Pfad merken - für Schritt 3
```

`pwd -P` löst Verweise auf. Bei Hetzner ist `~/public_html/...` in der Regel ein
Verweis auf `/usr/www/users/BENUTZER/...`; in `server/.env` gehört der echte
Pfad.

Zeigt `node -v` eine ältere Version, liegen auf dem Server mehrere. Welche es
gibt, verrät `ls /usr/local/nodejs/`; im Panel lässt sich die richtige wählen.

---

## 1b. Nachsehen, ob der Projektordner offen im Netz liegt

Bei einem Webhosting ist `~/public_html/<domain>` in der Regel das
Wurzelverzeichnis der Domain. Solange die Node-Anwendung im Panel noch nicht
eingetragen ist, liefert der Webserver diesen Ordner womöglich direkt aus – und
damit alles, was Sie gerade geklont haben.

```bash
curl -sI https://temp-gross-ict.ch/server/.env.example | head -1
curl -sI https://temp-gross-ict.ch/package.json | head -1
```

Kommt zweimal `HTTP/1.1 404`, ist nichts offen. Kommt `200 OK`, greift die
Datei `.htaccess` aus dem Projekt – sie liegt seit dem Klonen bereits im
Verzeichnis und sperrt Quellcode, Konfiguration und Datenbank. Prüfen Sie dann
erneut; kommt weiterhin `200`, erlaubt der Hoster keine eigenen Regeln, und der
Ordner muss vor dem nächsten Schritt aus dem Wurzelverzeichnis der Domain
heraus.

> **Das ist keine Formalie.** Ohne diese Sperre wären `server/.env` und die
> Datenbank mit Passwort-Hashes und Sitzungs-Token für jeden abrufbar, der die
> Adresse errät.

---

## 2. Abhängigkeiten installieren und bauen

Beides braucht die Entwicklungspakete: `npm run build` ruft TypeScript und Vite
auf, und der Update-Knopf tut später dasselbe.

```bash
cd ~/public_html/temp-gross-ict.ch
npm install --no-audit --no-fund
npm run build                       # erzeugt dist/ - das Portal

cd server
npm install --no-audit --no-fund
npm run build                       # erzeugt server/dist/
```

**Prüfen** – die dritte Zeile muss **im Verzeichnis `server`** laufen, denn dort
liegt das Paket:

```bash
ls ~/public_html/temp-gross-ict.ch/dist/index.html
ls ~/public_html/temp-gross-ict.ch/server/dist/index.js

cd ~/public_html/temp-gross-ict.ch/server
node -e "const D=require('better-sqlite3'); new D(':memory:').prepare('select 1').get(); console.log('better-sqlite3 laeuft')"
```

Der Befehl öffnet bewusst eine Datenbank. Ein blosses `require` genügt nicht:
Es lädt nur den JavaScript-Teil und meldet auch dann Erfolg, wenn die
kompilierte Datei fehlt – der Fehler käme dann erst beim Start des Servers.

Diese Prüfung ist die wichtigste der ganzen Anleitung. `better-sqlite3` enthält
einen kompilierten Teil, und der muss zur Node-Version passen. Fertige
Binärdateien gibt es für:

| Node | fertige Binärdatei vorhanden |
| --- | --- |
| 20 | nein |
| 22 | ja |
| 24 | ja |

Kommt stattdessen ein Fehler, hilft dieser Dreischritt:

```bash
# 1. Welche Version liegt überhaupt da?
node -p "require('better-sqlite3/package.json').version"    # muss 12.x sein

# 2. Nachinstallieren und dabei zusehen
npm rebuild better-sqlite3 --foreground-scripts

# 3. Erneut prüfen
node -e "const D=require('better-sqlite3'); new D(':memory:').prepare('select 1').get(); console.log('better-sqlite3 laeuft')"
```

`--foreground-scripts` zeigt, woran es liegt. Die Zeile
`prebuild-install || node-gyp rebuild` bedeutet: Zuerst wird die fertige
Binärdatei geladen; klappt das nicht, wird kompiliert.

| Was in der Ausgabe steht | Was zu tun ist |
| --- | --- |
| Version ist 11.x | `npm install` lief vor dem letzten `git pull`. Erneut `npm install` |
| `prebuild-install` findet nichts | Node-Version passt nicht – im Panel auf 22 oder 24 wechseln |
| Download scheitert am Netz | Der Server kommt nicht an github.com. Beim Hoster nachfragen |
| `node-gyp` bricht ab | Kein Compiler vorhanden. Dann muss die fertige Binärdatei kommen, also Punkt 2 oder 3 lösen |

### Drei Fehlerbilder auseinanderhalten

| Meldung | Bedeutung |
| --- | --- |
| `Cannot find module 'better-sqlite3'` | `npm install` fehlt oder falsches Verzeichnis |
| `Could not locate the bindings file` | JavaScript da, kompilierte Datei fehlt – der Dreischritt oben |
| `NODE_MODULE_VERSION ... does not match` | Kompilierte Datei da, aber für eine andere Node-Version |

---

## 3. Einstellungen hinterlegen

Die Pfade müssen absolut sein und dürfen keinen Verweis enthalten. Statt sie
abzutippen, lassen Sie sie ermitteln:

```bash
cd ~/public_html/temp-gross-ict.ch/server
BASIS=$(cd .. && pwd -P)
echo "$BASIS"                        # Kontrolle, bevor es in die Datei geht

cat > .env <<EOF
PORT=3001
HOST=127.0.0.1
SOBE_DB_PATH=$BASIS/server/data/sobe-notfall.sqlite
SOBE_WEB_ROOT=$BASIS/dist
SOBE_REPO_ROOT=$BASIS
SOBE_ADMIN_EMAIL=stefan.gross@sonnenberg-baar.ch
EXPO_TOKEN=
EOF

cat .env                             # so steht es jetzt in der Datei
```

Achten Sie darauf, dass in der ausgegebenen Datei echte Pfade stehen und nicht
`$BASIS` – sonst wurde der Block in einer Umgebung ausgeführt, die keine
Ersetzung vornimmt.

Was die Zeilen bedeuten:

- **`HOST=127.0.0.1`** – der Server lauscht nur lokal. Erreichbar ist er
  ausschliesslich über den Webserver des Hosters. Das ist die sicherere
  Einstellung und für den Panel-Betrieb die richtige.
- **Absolute Pfade** – das Panel startet den Prozess möglicherweise aus einem
  anderen Arbeitsverzeichnis. Relative Pfade zeigten dann ins Leere.
- **`SOBE_REPO_ROOT`** – ohne diese Zeile findet der Update-Knopf das
  Git-Verzeichnis nicht.
- **`EXPO_TOKEN`** bleibt vorerst leer; damit ist im Update-Dialog nur
  «Nur Server» wählbar. Siehe Schritt 9.

> **`server/.env` gehört niemandem sonst.** Die Datei ist von der
> Versionsverwaltung ausgenommen und darf nicht ins Web-Verzeichnis kopiert
> werden.

---

## 4. Erster Start von Hand

Bevor das Panel den Prozess übernimmt, einmal selbst starten – so sehen Sie
Fehlermeldungen direkt.

```bash
cd ~/public_html/temp-gross-ict.ch/server
node dist/index.js
```

Erwartete Ausgabe:

```
[env] Einstellungen aus .../server/.env geladen
SOBE-Notfall-Alarmserver läuft auf http://localhost:3001
Webportal wird mit ausgeliefert aus .../dist
Administrator: stefan.gross@sonnenberg-baar.ch
```

Steht dort **«Kein Webportal unter …»**, stimmt `SOBE_WEB_ROOT` nicht.

**Prüfen** – in einer zweiten SSH-Sitzung, während der Server läuft:

```bash
curl -s http://127.0.0.1:3001/api/health
# {"ok":true,"time":...}

curl -sI http://127.0.0.1:3001/ | head -1
# HTTP/1.1 200 OK

curl -s http://127.0.0.1:3001/api/setup
# {"freshInstall":true,"adminEmail":"stefan.gross@sonnenberg-baar.ch","userCount":1}
```

Danach den Server mit `Strg+C` beenden.

---

## 5. Als Anwendung im Panel eintragen

Jetzt übernimmt das Panel: Es startet den Prozess, überwacht ihn und leitet die
Domain darauf um. Die Feldnamen unterscheiden sich je nach Panel, die Werte sind
dieselben:

| Feld | Wert |
| --- | --- |
| Anwendungsverzeichnis / Application root | `public_html/temp-gross-ict.ch/server` |
| Startdatei / Startup file | `dist/index.js` |
| Node-Version | 22 oder 24 |
| Anwendungs-URL | `temp-gross-ict.ch` |
| Umgebungsvariablen | siehe unten |

Bietet das Panel ein Feld für Umgebungsvariablen, tragen Sie dort dieselben
Werte wie in `server/.env` ein. Beides zusammen schadet nicht – die `.env`
gewinnt nur dort, wo das Panel nichts vorgibt.

**Prüfen:** `https://temp-gross-ict.ch/api/health` im Browser aufrufen. Kommt
`{"ok":true,...}`, ist die Weiterleitung eingerichtet.

Kommt eine Fehlerseite des Hosters, läuft der Prozess nicht oder die Domain
zeigt woanders hin. Das Panel hat dafür ein Protokoll – zuerst dort nachsehen.

---

## 6. HTTPS erzwingen

Im Panel das Let's-Encrypt-Zertifikat ausstellen und die Weiterleitung von
`http` auf `https` einschalten.

**Prüfen:**

```bash
curl -sI http://temp-gross-ict.ch/ | head -1
# HTTP/1.1 301 Moved Permanently
```

> Ohne HTTPS gehen Passwörter und Sitzungs-Token unverschlüsselt durchs Netz.
> Dieser Schritt ist nicht optional.

---

## 7. Konten anlegen

Zwei Wege – wählen Sie einen.

### a) Frisch anfangen (empfohlen)

Der Server startet mit genau einem Administratorkonto und dem Erstpasswort
`SOBE-Start2026!`.

1. `https://temp-gross-ict.ch` aufrufen, oben auf **LIVE** stellen.
2. Mit `stefan.gross@sonnenberg-baar.ch` anmelden. Das System verlangt sofort
   ein eigenes Passwort.
3. Unter **Benutzer** die Mitarbeitenden erfassen – mit Startpasswort und
   gesetztem Häkchen bei «Passwortänderung bei der nächsten Anmeldung erzwingen».

### b) Den lokalen Datenbestand mitnehmen

Nur sinnvoll, wenn lokal bereits echte Konten und Alarme liegen. Der Bestand ist
**eine** Datei – aber sie darf nur im Stillstand kopiert werden, sonst fehlen
die zuletzt geschriebenen Daten.

Auf dem eigenen Rechner: den lokalen Server **beenden**, dann alle drei Dateien
übertragen (WinSCP oder FileZilla, per SFTP):

```
server\data\sobe-notfall.sqlite
server\data\sobe-notfall.sqlite-wal
server\data\sobe-notfall.sqlite-shm
```

Ziel: `~/public_html/temp-gross-ict.ch/server/data/`. Danach die Anwendung im
Panel neu starten und mit den bekannten Zugangsdaten anmelden.

---

## 8. Die App auf die neue Adresse bringen

Die Adresse `https://temp-gross-ict.ch` ist als Vorgabe im Quellcode
hinterlegt. Für Geräte gibt es zwei Fälle:

**Bereits installierte Apps** behalten die alte Adresse, weil sie einmal
gespeichert wurde. Im Anmeldebildschirm unten auf **Alarmserver** tippen,
`https://temp-gross-ict.ch` eintragen, **Übernehmen**. Beim nächsten Versuch
steht dort «verbunden».

**Neue Installationen** sind ab dem nächsten Build sofort richtig eingestellt.

**Prüfen:** In der App auf **LIVE** stellen und mit einem im Portal angelegten
Konto anmelden. Gelingt das, sehen App und Portal denselben Bestand.

---

## 9. Update-Knopf scharfschalten

Der Knopf **Aktualisierung** unten in der Seitenleiste holt den neuen Stand,
baut Portal und Server neu und startet den Server neu.

**Voraussetzung 1 – Neustart nach dem Update.** Der Server beendet sich nach
einer erfolgreichen Aktualisierung mit Code 0 und verlässt sich darauf, dass
das Panel ihn wieder startet. Prüfen Sie das einmal bewusst:

```bash
# Anwendung im Panel starten, dann:
pkill -f "node dist/index.js"
sleep 20
curl -s https://temp-gross-ict.ch/api/health
```

Kommt wieder `{"ok":true,...}`, startet das Panel von selbst neu – dann ist
alles bereit. Bleibt es still, ergänzen Sie in `server/.env`:

```
SOBE_AUTO_RESTART=false
```

Der Update-Knopf baut dann alles neu, startet aber nicht neu; den Neustart
lösen Sie danach im Panel aus. Der Dialog sagt das auch.

**Voraussetzung 2 – iOS-Builds.** Für «Server und iOS-App» braucht der Server
einen Zugangstoken von expo.dev in `server/.env`:

```
EXPO_TOKEN=hier_einsetzen
```

Zu finden unter expo.dev → Account settings → Access tokens. Wie ein Passwort
behandeln. Solange die Zeile leer ist, bleibt die zweite Auswahl im Dialog
gesperrt und nennt genau das als Grund. «Nur Server» funktioniert unabhängig
davon.

> **Nicht während eines Ereignisses aktualisieren.** Der Alarmserver ist dabei
> kurz nicht erreichbar.

---

## 10. Sicherung einrichten

Der gesamte Datenbestand liegt in einer Datei. Ein täglicher Cron-Eintrag
genügt:

```bash
crontab -e
```

```
# täglich um 03:15 sichern, 30 Tage aufbewahren
15 3 * * * cd ~/public_html/temp-gross-ict.ch/server && cp data/sobe-notfall.sqlite ~/sicherung/sobe-$(date +\%F).sqlite && find ~/sicherung -name 'sobe-*.sqlite' -mtime +30 -delete
```

Vorher einmal `mkdir -p ~/sicherung`.

Die Kopie im laufenden Betrieb kann die letzten Sekunden verpassen – für eine
tägliche Sicherung ist das vertretbar. Vor einem Umzug oder Eingriff gilt
weiterhin: Server beenden, dann kopieren.

---

## Wenn etwas nicht geht

**`Error: Cannot find module '...better_sqlite3.node'`**
Die kompilierte Binärdatei passt nicht zur Node-Version.
`cd server && npm rebuild better-sqlite3 --build-from-source`.

**Der Browser zeigt die Startseite des Hosters**
Die Domain zeigt nicht auf die Node-Anwendung. Im Panel den Eintrag der
Anwendungs-URL prüfen.

**`{"ok":true}` kommt lokal, aber nicht über die Domain**
Der Prozess läuft, die Weiterleitung fehlt. Panel-Protokoll ansehen.

**Anmeldung schlägt fehl, obwohl die Daten stimmen**
Der Umschalter im Portal steht auf DEMO statt LIVE. Demo- und Live-Konten sind
getrennt.

**Das Portal aktualisiert sich nicht von selbst**
Der Server schickt Änderungen über einen offenen Datenstrom. Puffert der
Webserver des Hosters ihn, kommen sie verspätet an. Der Server setzt dagegen
bereits `X-Accel-Buffering: no`; hilft das nicht, muss der Hoster die Pufferung
für `/api/events` abschalten. Alarme gehen davon unabhängig raus – betroffen
ist nur die Anzeige im Portal.

**Nach einer Aktualisierung ist der Server weg**
Das Panel startet ihn nicht neu. Siehe Schritt 9, `SOBE_AUTO_RESTART=false`.

**Der Administrator ist ausgesperrt**

```bash
cd ~/public_html/temp-gross-ict.ch/server
npm run reset-admin
```

Das setzt das Administratorkonto auf ein neues Erstpasswort zurück und meldet
es auf der Konsole.
