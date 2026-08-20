# Notfall- & Krisenmanagement Webapp

Eine vollständige Webapp für betriebliches Notfall- und Krisenmanagement – inspiriert vom Funktionsumfang von e-mergency®:
Alarmserver, Multikanal-Alarmierung, Notfallszenarien mit Handlungsanweisungen und Alleinarbeiterschutz.

## Funktionsübersicht

### 01 Vorbereitung (Admin-Web)
- **Szenarien & Checklisten (CMS):** 16 vorkonfigurierte Best-Practice-Notfallszenarien (Brand, Evakuierung, medizinischer Notfall, Amok, Bombendrohung, IT-Ausfall/Cyberangriff, Stromausfall, u. v. m.) mit Handlungsanweisungen und Checklisten. Eigene Szenarien erstellen und bearbeiten – Änderungen werden sofort verteilt.
- **Benutzerverwaltung:** manuelle Erfassung, CSV-Import (`Vorname;Nachname;E-Mail;Telefon;Rolle`), Rollen/Berechtigungen (Admin, Krisenstab, Mitarbeiter), Ferienabwesenheiten und Teilzeit, App-Sprache pro Nutzer (DE/EN/FR/IT).
- **Gruppen & Krisenteams:** Nutzergruppen mit Mitgliederverwaltung, Kennzeichnung als Krisenteam.
- **Standorte:** Adressen, Betriebszeiten, Geofencing (Koordinaten + Radius) zur automatischen Standortzuweisung.
- **Alarmpläne:** vorkonfigurierte Alarmierung (Szenario, Zielgruppen, Standorte, Kanäle, Quittierungspflicht, Betriebszeiten) mit mehrstufiger Eskalation inkl. Benachrichtigung von Blaulichtorganisationen.
- **Notfallkontakte:** externe Notrufnummern (117, 118, 144, 112, 145, Rega 1414) – erweiterbar.

### 02 Gefahrenabwehr
- **Alarm auslösen:** Szenariowahl, zielgruppenspezifische Alarmierung nach Standort/Gruppe, Kanalwahl.
- **Alarmierungskanäle (simuliert):** Push mit Critical Alerts, SMS, E-Mail, Sprachanruf, Telefonkonferenz, Text-to-Speech-Durchsage, Microsoft Teams.
- **Stiller Alarm** (z. B. Bedrohungslage) und **Aufgebot mit Quittierfunktion** («Ich komme» / «Nicht verfügbar»).
- **Alarmzentrale:** Live-Monitoring mit Zustellstatus pro Empfänger und Kanal, Quittierungsübersicht, Alarmjournal, automatische Eskalationsstufen, Entwarnung.
- **Mitarbeiter-App (Vorschau):** Smartphone-Simulation mit SOS-Taste, aktiven Alarmen, Quittierung, offline verfügbaren Szenarien/Checklisten und Notrufkontakten.

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

## Starten

```bash
npm install
npm run dev      # Entwicklung: http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run preview  # Produktions-Build lokal testen
```

## Bedienung (Schnellstart)

1. **Alarm auslösen** → Szenario wählen (oder Alarmplan anwenden) → Zielgruppen/Kanäle prüfen → auslösen.
2. In der **Alarmzentrale** den Live-Zustellstatus und das Alarmjournal beobachten.
3. In der **Mitarbeiter-App** unten links den Nutzer wechseln und den Alarm quittieren.
4. Unter **Alleinarbeit** einen kurzen Timer (1 Min.) starten und ablaufen lassen – der automatische Alarm erscheint in der Alarmzentrale.
5. Über **Ereignisprotokoll → Demo zurücksetzen** lässt sich der Ausgangszustand wiederherstellen.
