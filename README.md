# Sonnenberg Notfall- & Krisenmanagement

Webapp für das Notfall- und Krisenmanagement des Sonnenberg Kompetenzzentrums (heilpädagogische Schule)
mit den Standorten **Baar (Hauptsitz), Menzingen und Kloten** – inspiriert vom Funktionsumfang von e-mergency®:
Alarmserver, Multikanal-Alarmierung, Notfallszenarien mit Handlungsanweisungen und Alleinarbeiterschutz.

## Funktionsübersicht

### 01 Vorbereitung (Admin-Web)
- **Szenarien & Checklisten (CMS):** 22 vorkonfigurierte, heilpädagogisch-schulische Notfallszenarien (u. a. Brand, Evakuierung, vermisste Schüler:innen/Weglaufen, Krampfanfall/Epilepsie, allergische Reaktion, herausforderndes Verhalten/Eskalation, Medikamenten-Zwischenfall, Unfall Schülertransport, Todesfall, akute psychische Krise, Kindesschutz, Notfall im Therapiebad, Amok, Bombendrohung, IT-Ausfall u. v. m.). Jedes Szenario mit Priorität, Sofort- und Folgemassnahmen, Checkliste, zuständigen Gruppen, Standard-Alarmkanälen und verknüpften Notrufnummern – alles im Editor anpassbar, eigene Szenarien erstellbar.
- **Benutzerverwaltung:** manuelle Erfassung, CSV-Import (`Vorname;Nachname;E-Mail;Telefon;Rolle`), Rollen/Berechtigungen (Admin, Krisenstab, Mitarbeiter), Ferienabwesenheiten und Teilzeit, App-Sprache pro Nutzer (DE/EN/FR/IT).
- **Gruppen & Krisenteams:** Nutzergruppen mit Mitgliederverwaltung, Kennzeichnung als Krisenteam.
- **Standorte:** Baar (Hauptsitz, inkl. Wohngruppen rund um die Uhr), Menzingen und Kloten – mit Betriebszeiten und Geofencing (Koordinaten + Radius) zur automatischen Standortzuweisung.
- **Alarmpläne:** vorkonfigurierte Alarmierung (Szenario, Zielgruppen, Standorte, Kanäle, Quittierungspflicht, Betriebszeiten) mit mehrstufiger Eskalation inkl. Benachrichtigung von Blaulichtorganisationen.
- **Notfallkontakte:** externe Notrufnummern (117, 118, 144, 112, Tox Info 145, Rega 1414, Dargebotene Hand 143, Pro Juventute 147) – erweiterbar.

### 02 Gefahrenabwehr
- **Alarm auslösen:** Szenariowahl, zielgruppenspezifische Alarmierung nach Standort/Gruppe, Kanalwahl.
- **Alarmierungskanäle (simuliert):** Push mit Critical Alerts, SMS, E-Mail, Sprachanruf, Telefonkonferenz, Text-to-Speech-Durchsage, Microsoft Teams.
- **Stiller Alarm** (z. B. Bedrohungslage) und **Aufgebot mit Quittierfunktion** («Ich komme» / «Nicht verfügbar»).
- **Alarmzentrale:** Live-Monitoring mit Zustellstatus pro Empfänger und Kanal, Quittierungsübersicht, Alarmjournal, automatische Eskalationsstufen, Entwarnung.
- **Benutzeransicht (Mitarbeiter-App):** eigenständige, bildschirmfüllende App-Ansicht mit SOS-Taste (Halte-Geste), aktiven Alarmen mit Quittierung, offline verfügbaren Szenarien/Checklisten, eigenem Alleinarbeits-Timer und Notrufkontakten (direkt anrufbar). Wer mit der Rolle «Mitarbeiter» angemeldet ist, sieht ausschliesslich diese Ansicht; Admin und Krisenstab wechseln über «Benutzeransicht (App)» bzw. «Zur Verwaltung» hin und her.

### 03 Alleinarbeiterschutz
- **Timer-Funktion:** Überwachung mit Intervall, Lebenszeichen und automatischer Alarmauslösung bei Ablauf – wahlweise still.
- **Physische Alarmknöpfe:** Verwaltung von LoRaWAN- (Batterie > 4 Jahre) und GSM-Knöpfen mit GPS, individuellen Alarmnachrichten, Zielgruppen und automatischer Eskalation an Blaulichtorganisationen.

### System
- **Integrationen:** SMS-Gateway, VoIP, Microsoft Teams, interne Notfallnummer, SSO, Personalsystem-Synchronisation, IP/Webhook-Integration (ein- und ausgehend), Deployment via Zugangscodes, Mehrsprachigkeit, Geofencing.
- **Ereignisprotokoll:** revisionssicheres Journal aller Aktionen mit Filter.

## Technik

- React 18 + TypeScript + Vite + Tailwind CSS (Single-Page-App)
- Zustand wird im `localStorage` persistiert (auch als Demo der Offline-Verfügbarkeit)
- Ein Simulations-Ticker bildet den Alarmserver nach: Zustellstatus (pending → gesendet → zugestellt/fehlgeschlagen), Eskalationsstufen und Alleinarbeits-Timer laufen in Echtzeit
- **Hinweis:** Es werden keine echten SMS/Anrufe/Push-Nachrichten versendet – alle Kanäle sind simuliert. Für den Produktivbetrieb wären entsprechende Gateways (SMS-Provider, Push-Dienste, Telefonie) anzubinden.

## iOS / Smartphone (PWA)

Die App ist eine **Progressive Web App** und lässt sich auf dem iPhone wie eine native App installieren:

1. Die veröffentlichte URL in **Safari** öffnen
2. **Teilen-Symbol** antippen
3. **«Zum Home-Bildschirm»** wählen

Danach startet sie vollbildig mit eigenem App-Symbol (roter Warndreieck auf dunklem Grund) und funktioniert dank Service Worker auch **offline** (App-Shell und Szenarien werden lokal zwischengespeichert). Voraussetzung: Hosting über HTTPS im Wurzelpfad einer Domain.

**Native iOS-App (App Store):** Der Weg dazu führt über [Capacitor](https://capacitorjs.com) – das bestehende Web-Frontend wird dabei unverändert in eine native Hülle verpackt (`npx cap add ios`), in Xcode gebaut und mit einem Apple-Developer-Konto (CHF ~99/Jahr) signiert und eingereicht. Erst die native Hülle ermöglicht echte Critical-Alert-Pushes, die die Stummschaltung übersteuern (Apple-Sonderberechtigung nötig).

## Starten

```bash
npm install
npm run dev      # Entwicklung: http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
```

## Bedienung (Schnellstart)

1. **Alarm auslösen** → Szenario wählen (Kanäle und zuständige Gruppen werden automatisch vorbefüllt) → prüfen → auslösen.
2. In der **Alarmzentrale** den Live-Zustellstatus und das Alarmjournal beobachten.
3. In der **Benutzeransicht (App)** über Profil → «Demo: Benutzer wechseln» einen Mitarbeiter wählen und den Alarm quittieren.
4. Unter **Alleinarbeit** einen kurzen Timer (1 Min.) starten und ablaufen lassen – der automatische Alarm erscheint in der Alarmzentrale.
5. Über **Ereignisprotokoll → Demo zurücksetzen** lässt sich der Ausgangszustand wiederherstellen.
