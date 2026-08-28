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

Beim ersten Start werden Standorte, Gruppen, Szenarien, Alarmplan-Vorlagen und
Notrufnummern angelegt sowie ein Administratorkonto mit erzwungenem
Passwortwechsel. Beispiel-Benutzer gibt es bewusst keine – der Server ist der
Live-Betrieb.

Es existiert immer mindestens ein anmeldefähiger Administrator: Der letzte lässt
sich weder löschen noch herabstufen, und fehlt er, wird er beim Start wiederhergestellt.

## Vom Telefon aus erreichbar machen

Im selben Netz genügt die IP-Adresse des Rechners, auf dem der Server läuft:

```
# Windows
ipconfig        # IPv4-Adresse suchen, z. B. 192.168.1.42
```

In der App wird dann `http://192.168.1.42:3001` als Serveradresse eingetragen.
Für den Betrieb ausserhalb des Schulnetzes gehört der Server hinter HTTPS
(Reverse Proxy mit Zertifikat) – Passwörter und Token dürfen nicht unverschlüsselt
über fremde Netze gehen.

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

## Tests

```bash
npm run dev                                    # in einem Fenster
SOBE_TEST_URL=http://localhost:3001 npm test   # in einem zweiten
```

46 Integrationstests über Anmeldung, Rechte, Benutzerverwaltung, Alarme,
Alleinarbeit und Push-Registrierung.

## Push-Nachrichten

Der Server sendet über `https://exp.host/--/api/v2/push/send`. Damit ein Telefon
Nachrichten empfängt, muss die App ihr Push-Token über `/push/register` melden.
Das funktioniert nur in einem eigenen App-Build (TestFlight oder App Store);
Expo Go kann seit SDK 53 keine Remote-Push-Nachrichten mehr empfangen.
