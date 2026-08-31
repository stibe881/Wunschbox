# Critical Alerts aktivieren

Nicht stille Alarme sollen auf dem iPhone klingeln, **auch wenn das Telefon
stummgeschaltet ist**. Apple nennt das *Critical Alerts* und gibt es nur nach
einer ausdrücklichen Bewilligung frei.

## Was heute schon funktioniert

Ohne Bewilligung verschickt die App nicht stille Alarme als **zeitkritische
Mitteilung** (`time-sensitive`). Die durchbricht Fokus-Modi wie «Nicht stören»
und erscheint sofort auf dem Sperrbildschirm — **nicht** aber den physischen
Stummschalter. Diese Stufe braucht keinen Antrag und ist bereits aktiv.

## Was Critical Alerts zusätzlich bringen

| | zeitkritisch (heute) | Critical Alert (nach Bewilligung) |
| --- | --- | --- |
| Fokus / Nicht stören | durchbricht | durchbricht |
| Stummschalter am Gerät | stumm | **klingelt** |
| Lautstärke | Systemlautstärke | eigene, bis 100 % |
| Zustimmung | normale Mitteilungsfreigabe | eigener Dialog beim ersten Start |

## Bewilligung beantragen

1. Antrag stellen unter
   <https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/>
   mit der Bundle-ID `ch.sonnenberg.notfall`.

   Begründung: Notfall- und Alarmierungssystem einer heilpädagogischen
   Sonderschule. Alarme betreffen Brand, Evakuierung, medizinische Notfälle und
   Bedrohungslagen; Mitarbeitende führen Unterricht und Therapie oft mit
   stummgeschaltetem Telefon durch. Ein überhörter Alarm gefährdet Menschen.

2. Apple antwortet erfahrungsgemäss innert einiger Tage bis Wochen.

## Nach der Bewilligung

In `mobile/app.json` den Eintrag ergänzen:

```json
"entitlements": {
  "com.apple.developer.usernotifications.time-sensitive": true,
  "com.apple.developer.usernotifications.critical-alerts": true
}
```

Danach neu bauen:

```bash
cd mobile
npx eas-cli build --platform ios --profile production --auto-submit
```

EAS gleicht die Berechtigung beim Build automatisch mit dem Apple Developer
Portal ab. Beim ersten Start nach der Installation fragt iOS zusätzlich nach der
Zustimmung für kritische Hinweise — diese muss bestätigt werden.

> **Nicht vorher eintragen.** Ohne Bewilligung von Apple lässt sich das
> Bereitstellungsprofil nicht ausstellen, und der Build schlägt mit einem
> Signierungsfehler fehl.

## Wie die App damit umgeht

Es ist nichts weiter zu tun: Die App fragt beim Start nach der Berechtigung und
prüft anschliessend, ob sie tatsächlich erteilt wurde.

- **erteilt** → lokale Alarme mit `interruptionLevel: 'critical'` und dem
  Systemton `defaultCritical`; das Gerät meldet dem Alarmserver, dass es
  Critical Alerts empfangen darf, und erhält Pushs mit derselben Stufe.
- **nicht erteilt** → `time-sensitive` mit dem normalen Ton.

Der Server entscheidet pro Gerät. Ein Gerät ohne Bewilligung bekommt nie einen
Critical Alert geschickt — Apple würde die Nachricht sonst abweisen.

**Stille Alarme** (herausforderndes Verhalten, verdächtige Person, Todesfall)
bleiben unverändert stumm. Sie lösen keinen Ton aus, unabhängig von dieser
Einstellung.

## Android

Der Kanal `alarme` wird beim Start mit höchster Wichtigkeit angelegt und
umgeht «Nicht stören» (`bypassDnd`). Dort braucht es keine Bewilligung.
