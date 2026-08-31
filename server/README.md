# SOBE Notfall – Alarmserver

Gemeinsamer Datenbestand für Webportal und iOS-App. Ohne diesen Server sind beide
getrennte Welten: Ein im Portal angelegter Benutzer existiert auf dem Telefon nicht,
und ein Alarm erreicht nur das Gerät, auf dem er ausgelöst wurde.

## Was der Server übernimmt

- **Konten und Anmeldung** – E-Mail und Passwort, Sitzungs-Token, Rollenprüfung.
  Passwörter liegen als PBKDF2-SHA256-Hash (210 000 Runden, Zufalls-Salt) in der
  Datenbank und verlassen den Server nie.
- **Gemeinsamer Datenbestand** – Benutzer, Gruppen, Standorte, Szenarien,
  Alarmpläne, Notrufnummern, Alarme, Alleinarbeits-Timer, Ereignisprotokoll.
- **Alarmverarbeitung** – Eskalationsstufen und abgelaufene Alleinarbeits-Timer
  werden serverseitig ausgewertet, auch wenn kein Gerät eingeschaltet ist.
- **Echte Push-Nachrichten** an alle registrierten iPhones über den Expo-Push-Dienst.
- **Live-Aktualisierung** über Server-Sent Events: Jede Änderung erreicht alle
  offenen Portale und Apps sofort, ohne Neuladen.
- **Aktualisierung per Knopfdruck** aus dem Portal – siehe unten.

## Starten

```bash
cd server
npm install
npm run dev      # Entwicklung mit automatischem Neustart
npm run build    # Übersetzen nach dist/
npm start        # Produktionsbetrieb
```

Der Server läuft auf `http://localhost:3001`. Die Datenbank ist eine einzelne
Datei unter `server/data/sobe-notfall.sqlite` – zum Sichern genügt es, diese Datei
zu kopieren.

### Einstellungen über Umgebungsvariablen

| Variable | Bedeutung | Standard |
| --- | --- | --- |
| `PORT` | Port des Servers | `3001` |
| `SOBE_DB_PATH` | Pfad der Datenbankdatei | `data/sobe-notfall.sqlite` |
| `SOBE_ADMIN_EMAIL` | Konto des ersten Administrators | `stefan.gross@sonnenberg-baar.ch` |
| `SOBE_ADMIN_PASSWORD` | Erstpasswort dieses Kontos | `SOBE-Start2026!` |
| `SOBE_REPO_ROOT` | Arbeitsverzeichnis für die Aktualisierung | ein Verzeichnis über `server/` |
| `SOBE_AUTO_RESTART` | Neustart nach der Aktualisierung (`false` schaltet ihn ab) | an |
| `EXPO_TOKEN` | Zugangstoken von expo.dev, nötig für den iOS-Build | – |

Beim ersten Start werden Standorte, Gruppen, Szenarien, Alarmplan-Vorlagen und
Notrufnummern angelegt sowie ein Administratorkonto mit erzwungenem
Passwortwechsel. Beispiel-Benutzer gibt es bewusst keine – der Server ist der
Live-Betrieb.

Es existiert immer mindestens ein anmeldefähiger Administrator: Der letzte lässt
sich weder löschen noch herabstufen, und fehlt er, wird er beim Start wiederhergestellt.

## Vom Telefon aus erreichbar machen

> Die App muss aus einem Build stammen, der die Serveranbindung enthält
> (ab Commit «iOS-App: Live-Modus läuft über den Alarmserver»). Ältere
> TestFlight-Builds prüfen die Anmeldung noch auf dem Gerät und kennen die
> Konten des Servers nicht – dort meldet die App «E-Mail-Adresse oder Passwort
> ist falsch», obwohl das Konto auf dem Server existiert. In diesem Fall ist ein
> neuer Build nötig.


Im selben Netz genügt die IP-Adresse des Rechners, auf dem der Server läuft:

```
# Windows
ipconfig        # IPv4-Adresse suchen, z. B. 192.168.1.42
```

In der App wird dann `http://192.168.1.42:3001` als Serveradresse eingetragen –
auf der Anmeldemaske unter «Alarmserver».

Damit iOS diese Verbindung überhaupt zulässt, trägt `mobile/app.json` zwei
Einträge in die Info.plist ein: `NSAppTransportSecurity.NSAllowsLocalNetworking`
erlaubt unverschlüsselte Verbindungen ins lokale Netz (nicht ins Internet), und
`NSLocalNetworkUsageDescription` liefert den Text für die Nachfrage, die iOS beim
ersten Zugriff aufs lokale Netz stellt. Diese Nachfrage muss bestätigt werden –
wird sie abgelehnt, bleibt der Server für die App unerreichbar (Einstellungen →
SOBE Notfall → Lokales Netzwerk).
Für den Betrieb ausserhalb des Schulnetzes gehört der Server hinter HTTPS
(Reverse Proxy mit Zertifikat) – Passwörter und Token dürfen nicht unverschlüsselt
über fremde Netze gehen.

## Wenn die Anmeldung nicht klappt

Im Live-Modus kommen alle Konten vom Server – ohne laufenden Server gibt es keine
Anmeldung. Die Anmeldemaske sagt das inzwischen ausdrücklich und zeigt bei einer
frischen Installation Konto und Erstpasswort an.

Zwei Werkzeuge helfen weiter:

```bash
npm run accounts                                   # welche Konten kennt der Server?
npm run reset-admin                                # erstes Administratorkonto, neues Zufallspasswort
npm run reset-admin -- name@schule.ch              # bestimmtes Konto
npm run reset-admin -- name@schule.ch Neu2026sicher
```

`accounts` zeigt für jedes Konto, ob ein Passwort gesetzt ist, ob ein Wechsel
offen ist und wann die letzte Anmeldung war. `reset-admin` setzt ein neues
Passwort, beendet alle bestehenden Anmeldungen des Kontos und erzwingt den
Wechsel bei der nächsten Anmeldung.

Häufige Ursachen:

| Meldung | Ursache |
| --- | --- |
| «Der Alarmserver … ist nicht erreichbar» | Server läuft nicht oder die Adresse stimmt nicht – Adresse auf der Anmeldemaske prüfen |
| «E-Mail-Adresse oder Passwort ist falsch» | Passwort wurde bereits geändert, oder es ist eine andere Datenbankdatei im Einsatz (`SOBE_DB_PATH`) |
| «Für dieses Konto ist noch kein Passwort gesetzt» | Konto wurde ohne Passwort angelegt – in der Benutzerverwaltung eines vergeben |

## Aktualisierung per Knopfdruck

Administratoren finden im Portal in der Seitenleiste den Knopf **Aktualisierung**.
Dort ist der aktuelle Stand sichtbar (Branch, Commit, ob Änderungen offen sind),
und es gibt zwei Möglichkeiten:

| Auswahl | Was passiert | Dauer |
| --- | --- | --- |
| **Nur Server** | `git fetch` → `git pull --ff-only` → Abhängigkeiten von Portal und Server → beide bauen → Server neu starten | wenige Minuten |
| **Server und iOS-App** | zusätzlich Abhängigkeiten der App und `eas build --platform ios --profile production --auto-submit` (TestFlight) | 20 bis 45 Minuten |

Jeder Schritt wird mit Status und vollständiger Ausgabe angezeigt, auch wenn
etwas fehlschlägt. Bricht ein Schritt ab, werden die folgenden übersprungen und
es wird nicht neu gestartet.

Die Befehle liegen fest im Server (`src/update.ts`); der Client wählt nur den
Umfang. Die Endpunkte sind Administratoren vorbehalten.

### Voraussetzungen

**Neustart.** Der Server beendet sich nach einer erfolgreichen Aktualisierung
mit Code 0. Damit er mit dem neuen Stand wieder hochkommt, muss er unter einem
Dienstverwalter laufen:

```bash
npm run serve                  # Linux/macOS: mitgelieferte Neustart-Schleife
scripts\run.cmd                # Windows: dasselbe als Batch-Datei
```

Für den Dauerbetrieb ist systemd besser – eine Vorlage liegt unter
`scripts/sobe-notfall.service` (mit `Restart=always`). Alternativ pm2:

```bash
pm2 start dist/index.js --name sobe-notfall
```

Ohne Dienstverwalter setzen Sie `SOBE_AUTO_RESTART=false`; die Aktualisierung
läuft dann durch, der Neustart erfolgt von Hand.

**Git-Zugang.** `git pull` läuft unter dem Benutzer des Servers. Für ein
privates Repository muss dort ein Deploy-Key (SSH) oder ein Token im
Anmeldespeicher hinterlegt sein – sonst scheitert der Schritt mit einer
Zugriffsmeldung im Protokoll.

**iOS-Build.** Für die zweite Auswahl braucht der Server ein Zugangstoken von
expo.dev als `EXPO_TOKEN`:

1. Auf [expo.dev](https://expo.dev) unter *Account settings → Access tokens*
   ein Token erstellen.
2. Auf dem Server hinterlegen, z. B. in der systemd-Unit:
   `Environment=EXPO_TOKEN=...`
3. Server neu starten.

Ohne Token bleibt die Auswahl «Server und iOS-App» gesperrt und nennt den Grund.
Die Apple-Zugangsdaten für die Übermittlung an TestFlight verwaltet EAS selbst
(einmalig über `eas credentials` eingerichtet).

## Schnittstelle

Alle Endpunkte unter `/api`, Authentifizierung über `Authorization: Bearer <token>`.

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/auth/login` | Anmelden, liefert Token und Konto |
| POST | `/auth/logout` | Abmelden |
| GET | `/auth/me` | Eigenes Konto |
| POST | `/auth/password` | Eigenes Passwort ändern |
| GET | `/state` | Vollständiger Datenbestand |
| GET | `/events?token=` | Live-Aktualisierung (SSE) |
| POST/DELETE | `/users`, `/users/:id` | Benutzerverwaltung (nur Administration) |
| POST/DELETE | `/groups`, `/locations` | Stammdaten (nur Administration) |
| POST/DELETE | `/scenarios`, `/plans`, `/contacts`, `/buttons` | Konfiguration (Administration und Krisenstab) |
| POST | `/integrations` | Gateways und Webhooks (nur Administration) |
| POST | `/alarms` | Alarm auslösen |
| POST | `/alarms/:id/ack` | Quittieren oder ablehnen |
| POST | `/alarms/:id/end` | Entwarnung (Administration und Krisenstab) |
| POST | `/lone-work`, `/lone-work/:id/extend`, `/lone-work/:id/complete` | Alleinarbeit |
| POST | `/push/register`, `/push/unregister` | Push-Token eines Geräts |
| GET | `/setup` | Öffentlich: ist der Server frisch eingerichtet? (für die Anmeldemaske) |
| GET | `/update/status` | Stand und laufende Aktualisierung (nur Administration) |
| GET | `/update/job` | Fortschritt der laufenden Aktualisierung |
| POST | `/update` | Aktualisierung starten (`scope`: `server` oder `server+ios`) |

## Tests

```bash
npm run dev                                    # in einem Fenster
SOBE_TEST_URL=http://localhost:3001 npm test   # in einem zweiten
```

46 Integrationstests über Anmeldung, Rechte, Benutzerverwaltung, Alarme,
Alleinarbeit und Push-Registrierung. Die Aktualisierung ist zusätzlich gegen ein
eigenes Testrepository geprüft (Ablauf, Fehlschlag, Rechte, iOS-Sperre).

## Push-Nachrichten

Der Server sendet über `https://exp.host/--/api/v2/push/send`. Damit ein Telefon
Nachrichten empfängt, muss die App ihr Push-Token über `/push/register` melden.
Das funktioniert nur in einem eigenen App-Build (TestFlight oder App Store);
Expo Go kann seit SDK 53 keine Remote-Push-Nachrichten mehr empfangen.
