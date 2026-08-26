# Sonnenberg Notfall – Mobile App (Expo)

Native React-Native-Version der Mitarbeiter-App (Expo SDK 54): SOS mit Halte-Geste und Live-Status,
22 Notfallszenarien mit Sofortmassnahmen/Checklisten, Alleinarbeits-Timer mit automatischer
Alarmauslösung und Notrufnummern (direkt anrufbar). Der Alarmserver wird lokal auf dem Gerät
simuliert (Zustellungen, Rückmeldungen der Einsatzkräfte, Eskalation) – es werden keine echten
Benachrichtigungen versendet.

## Mit Expo Go testen

1. **Expo Go** aus dem App Store / Play Store installieren
2. Auf dem Computer (gleiches WLAN wie das Handy):

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. Den angezeigten **QR-Code scannen** – iPhone: mit der Kamera-App, Android: in Expo Go –
   die App startet direkt auf dem Gerät. Änderungen am Code erscheinen live (Fast Refresh).

Falls Handy und Computer nicht im selben Netz sind: `npx expo start --tunnel`.

## Mit EAS publishen (für Teamkolleg:innen ohne laufenden Dev-Server)

Einmalig (kostenloses Expo-Konto nötig):

```bash
npm install -g eas-cli
eas login
cd mobile
eas init                # verknüpft das Projekt mit deinem Expo-Konto (setzt projectId)
eas update:configure    # richtet expo-updates ein
```

Publishen:

```bash
eas update --branch preview --message "Erste Version"
```

Die CLI zeigt danach einen Link/QR-Code. Wer mit demselben Expo-Konto (oder als eingeladenes
Teammitglied) in **Expo Go** eingeloggt ist, öffnet die publizierte App darüber – ganz ohne
lokalen Server.

## App-Store-Build (später)

```bash
eas build --platform ios --profile preview     # .ipa für interne Verteilung (TestFlight)
eas build --platform ios --profile production  # Store-Build
eas submit --platform ios                      # Einreichung (Apple-Developer-Konto nötig)
```

Hinweis: Echte Critical-Alert-Pushes (übersteuern die Stummschaltung) erfordern den nativen
Build plus eine Apple-Sonderberechtigung – in Expo Go sind keine Remote-Pushes möglich.

## Struktur

- `App.tsx` – Einstieg: Header, Tab-Navigation, Toasts
- `src/screens.tsx` – die fünf Screens (Start/SOS, Szenarien, Alleinarbeit, Notruf, Profil)
- `src/store.tsx` – Zustand mit AsyncStorage-Persistenz und Alarmserver-Simulation
- `src/seed.ts`, `src/types.ts` – Kopie der Daten/Typen aus der Web-App (`../src`)
- `src/ui.tsx` – Farben, Badges, Halte-Button
