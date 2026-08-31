# Alarme hörbar machen: zeitkritische Mitteilungen und Critical Alerts

Nicht stille Alarme sollen auf dem iPhone durchkommen, auch wenn das Gerät
stummgeschaltet ist oder ein Fokus läuft. iOS kennt dafür zwei Stufen, und beide
brauchen eine Berechtigung von Apple.

| Stufe | Fokus / Nicht stören | Stummschalter | Antrag bei Apple |
| --- | --- | --- | --- |
| normal (heute aktiv) | wird zurückgehalten | stumm | – |
| **zeitkritisch** | durchbricht | stumm | nein, aber einmalige Einrichtung |
| **Critical Alert** | durchbricht | **klingelt** | ja, Formular |

Die App schickt bereits die passende Stufe mit. Solange die Berechtigung fehlt,
ignoriert iOS sie schlicht – es gibt keine Fehlermeldung, der Alarm kommt nur
leiser an.

---

## Stufe 1: zeitkritische Mitteilungen

Kein Antrag nötig, aber die Berechtigung muss ins Bereitstellungsprofil. Genau
daran ist ein Build gescheitert:

```
Provisioning profile "…" does not support the Time Sensitive Notifications capability.
Entitlements file defines the value "com.apple.developer.usernotifications.time-sensitive"
which is not registered for profile
```

Grund: Der Update-Knopf baut ohne Rückfragen. In diesem Betrieb kann EAS sich
nicht am Apple Developer Portal anmelden und die Berechtigung dort nicht
nachtragen – es verwendet das vorhandene Profil, und dem fehlt sie.

### Einmalig einrichten

Der Eintrag steht bereits in `mobile/app.json`:

```json
"entitlements": {
  "com.apple.developer.usernotifications.time-sensitive": true
}
```

Damit ein Build gelingt, muss die Berechtigung noch im Bereitstellungsprofil
verankert werden. Dafür genügt ein einziger Build vom eigenen Rechner aus, mit
Rückfragen: Dabei meldet sich EAS bei Apple an, trägt die Berechtigung ein und
erneuert das Profil.

1. Vom eigenen Rechner bauen – **ohne** `--non-interactive`:

   ```bash
   cd mobile
   npx eas-cli build --platform ios --profile production --auto-submit
   ```

   Bei der Frage nach den Apple-Zugangsdaten anmelden. EAS meldet dann
   «Syncing capabilities» und erstellt ein neues Profil.

2. Läuft dieser Build durch, funktioniert der Update-Knopf ab sofort auch mit
   der Berechtigung – das erneuerte Profil wird wiederverwendet.

> **Bis dieser eine Build gelaufen ist, schlägt der iOS-Build über den
> Update-Knopf fehl.** «Nur Server» ist davon nicht betroffen.

---

## Übermittlung an TestFlight

Der Update-Knopf baut mit `--auto-submit`: Nach dem Build soll Expo die App
selbständig an TestFlight übergeben. Dafür braucht Expo Zugangsdaten für App
Store Connect. Fehlen sie, sieht es so aus:

- Der Build wird angelegt und läuft bei Expo durch.
- Der Schritt danach scheitert, weil die CLI ohne Rückfragen keine Zugangsdaten
  erfragen kann.
- In TestFlight erscheint nichts.

Das Portal erkennt diesen Fall inzwischen: Der Schritt gilt als erfolgreich,
und darunter steht ein Hinweis auf die fehlende Übermittlung. Der Server
startet dann wie vorgesehen neu.

### Einmalig einrichten

Denselben Build **einmal mit Rückfragen** vom eigenen Rechner starten. Dabei
fragt EAS nach den Apple-Zugangsdaten, legt die Übermittlungsdaten beim Projekt
ab und verwendet sie danach auch ohne Rückfragen:

```bash
cd mobile
npx eas-cli build --platform ios --profile production --auto-submit
```

Das ist derselbe Lauf, der weiter oben die Berechtigung für zeitkritische
Mitteilungen ins Bereitstellungsprofil einträgt. **Ein Durchgang erledigt
beides.**

Prüfen lässt sich der Stand mit:

```bash
npx eas-cli credentials
```

### Bis dahin von Hand übermitteln

```bash
cd mobile
npx eas-cli submit --platform ios --latest
```

Oder im Expo-Dashboard beim fertigen Build auf «Submit to App Store» gehen.

---

## Stufe 2: Critical Alerts

Zusätzlich zur zeitkritischen Stufe: Ton auch bei stummgeschaltetem Telefon, mit
eigener Lautstärke.

### Bewilligung beantragen

Formular: <https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/>
mit der Bundle-ID `ch.sonnenberg.notfall`.

**App Type:** Public Safety

**Describe your app**

> SOBE Notfall is the internal emergency alerting app of SONNENBERG
> Kompetenzzentrum, a Swiss special-needs school for children and young people
> with disabilities, operating three sites. Staff use it to raise and receive
> alarms and to follow guided emergency procedures for fire, evacuation, medical
> emergencies, incidents in the therapy pool and security incidents. It is
> distributed only to the school's employees.

**What type of notifications will you send as Critical Alerts?**

> Only alarms requiring an immediate physical response: fire and building
> evacuation, medical emergencies including cardiac arrest, drowning in the
> therapy pool, and situations requiring the crisis team. All other
> notifications are sent at normal priority. Alarms that must stay inaudible for
> the safety of those involved are delivered silently by design.

**How frequently will you send Critical Alerts?** Die seltenste zutreffende
Option wählen – echte Notfälle sind selten.

**Explain why you need this entitlement**

> Staff supervise children with severe disabilities during lessons and therapy
> and keep their phones silenced so as not to disturb the group. Many work alone
> in therapy rooms, in the pool or in outlying buildings where they cannot hear
> a building alarm. The people affected cannot help themselves: children with
> impaired mobility depend on a named staff member to evacuate them, and a
> drowning or cardiac arrest allows only minutes to act. A missed alarm
> therefore directly endangers lives. Critical Alerts are used exclusively for
> these emergencies, never for information or reminders.

### Nach der Bewilligung

Zweiten Eintrag ergänzen und wieder **einmal mit Rückfragen** bauen (wie oben):

```json
"entitlements": {
  "com.apple.developer.usernotifications.time-sensitive": true,
  "com.apple.developer.usernotifications.critical-alerts": true
}
```

Beim ersten Start fragt iOS zusätzlich nach der Zustimmung für kritische
Hinweise – diese muss bestätigt werden.

---

## Wie die App damit umgeht

Am Code ist nichts zu ändern. Die App fragt beim Start nach der Berechtigung und
prüft danach, ob sie erteilt wurde:

- **erteilt** → `interruptionLevel: 'critical'`, Systemton `defaultCritical`; das
  Gerät meldet dem Alarmserver, dass es Critical Alerts empfangen darf, und
  bekommt Pushs mit derselben Stufe.
- **nicht erteilt** → `timeSensitive` mit normalem Ton.

Der Server entscheidet pro Gerät. Ein Gerät ohne Berechtigung bekommt nie einen
Critical Alert – Apple würde die Nachricht abweisen.

**Stille Alarme** bleiben unverändert stumm und lösen gar keinen Push aus.

## Android

Der Kanal `alarme` wird beim Start mit höchster Wichtigkeit angelegt und umgeht
«Nicht stören». Dort braucht es keine Bewilligung.
