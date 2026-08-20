import type { AppState, Scenario, User, Group, Location, AlarmPlan, AlarmButton, EmergencyContact, IntegrationSettings } from '../types'

// 16 vorkonfigurierte Best-Practice-Notfallszenarien
export const SEED_SCENARIOS: Scenario[] = [
  {
    id: 'sc-brand', icon: '🔥', title: 'Brand / Feuer', category: 'Gebäude', silentDefault: false,
    instructions: [
      'Ruhe bewahren – keine Panik verbreiten.',
      'Brand melden: Feuerwehr 118 alarmieren.',
      'Gefährdete Personen warnen und Gebäude über Fluchtwege verlassen.',
      'Keine Aufzüge benutzen.',
      'Türen schliessen (nicht abschliessen).',
      'Sammelplatz aufsuchen und auf Vollständigkeit prüfen.',
    ],
    checklist: ['Feuerwehr 118 alarmiert', 'Etage evakuiert', 'Türen geschlossen', 'Sammelplatz erreicht', 'Personen gezählt', 'Einsatzkräfte eingewiesen'],
  },
  {
    id: 'sc-evak', icon: '🚪', title: 'Evakuierung', category: 'Gebäude', silentDefault: false,
    instructions: [
      'Evakuierungsdurchsage abwarten bzw. auslösen.',
      'Arbeitsplatz sichern (Maschinen stoppen, Dokumente sichern).',
      'Besucher und hilfsbedürftige Personen mitnehmen.',
      'Nächstgelegenen Fluchtweg benutzen.',
      'Sammelplatz aufsuchen, nicht ins Gebäude zurückkehren.',
    ],
    checklist: ['Durchsage erfolgt', 'Bereich geräumt', 'Hilfsbedürftige begleitet', 'Sammelplatz erreicht', 'Zählung abgeschlossen'],
  },
  {
    id: 'sc-medizin', icon: '🚑', title: 'Medizinischer Notfall', category: 'Personen', silentDefault: false,
    instructions: [
      'Situation beurteilen – Eigenschutz beachten.',
      'Sanität 144 alarmieren.',
      'Erste Hilfe leisten (BLS-AED-Schema).',
      'Betriebssanität / Ersthelfer aufbieten.',
      'Zufahrt für Rettungsdienst freihalten und einweisen.',
    ],
    checklist: ['144 alarmiert', 'Ersthelfer vor Ort', 'AED geholt', 'Rettungsdienst eingewiesen', 'Angehörige informiert'],
  },
  {
    id: 'sc-amok', icon: '⚠️', title: 'Amok / Bedrohungslage', category: 'Sicherheit', silentDefault: true,
    instructions: [
      'Flüchten, wenn gefahrlos möglich.',
      'Verstecken: Türen verriegeln, Licht löschen, Handy stumm.',
      'Polizei 117 alarmieren, sobald sicher möglich.',
      'Keine Helden spielen – Konfrontation vermeiden.',
      'Anweisungen der Polizei strikt befolgen.',
    ],
    checklist: ['Polizei 117 informiert', 'Bereich verriegelt', 'Stiller Alarm ausgelöst', 'Personen in Sicherheit'],
  },
  {
    id: 'sc-bombe', icon: '💣', title: 'Bombendrohung', category: 'Sicherheit', silentDefault: true,
    instructions: [
      'Anruf ernst nehmen, Gespräch in die Länge ziehen.',
      'Wortlaut, Hintergrundgeräusche und Stimme notieren.',
      'Polizei 117 alarmieren.',
      'Krisenstab informieren – keine eigenmächtige Evakuierung.',
      'Verdächtige Gegenstände nicht berühren.',
    ],
    checklist: ['Drohungsprotokoll ausgefüllt', 'Polizei 117 informiert', 'Krisenstab einberufen', 'Entscheidung Evakuierung getroffen'],
  },
  {
    id: 'sc-einbruch', icon: '🔓', title: 'Einbruch / Diebstahl', category: 'Sicherheit', silentDefault: false,
    instructions: [
      'Tatort nicht verändern, nichts berühren.',
      'Polizei 117 alarmieren.',
      'Sicherheitsdienst informieren.',
      'Zeugen und Beobachtungen dokumentieren.',
    ],
    checklist: ['Polizei informiert', 'Tatort gesichert', 'Schadensliste erstellt', 'Versicherung gemeldet'],
  },
  {
    id: 'sc-gewalt', icon: '🥊', title: 'Gewalt / Übergriff', category: 'Personen', silentDefault: true,
    instructions: [
      'Eigenschutz hat Vorrang – Distanz halten.',
      'Stillen Alarm auslösen oder Kollegen alarmieren.',
      'Deeskalierend kommunizieren.',
      'Polizei 117 bei akuter Gefahr alarmieren.',
      'Betroffene betreuen, Vorfall dokumentieren.',
    ],
    checklist: ['Stiller Alarm ausgelöst', 'Sicherheitsdienst vor Ort', 'Betroffene betreut', 'Vorfall protokolliert'],
  },
  {
    id: 'sc-it', icon: '💻', title: 'IT-Ausfall / Cyberangriff', category: 'Technik', silentDefault: false,
    instructions: [
      'Betroffene Systeme nicht ausschalten, aber vom Netz trennen.',
      'IT-Notfallteam alarmieren.',
      'Keine Passwörter mehr eingeben.',
      'Vorfall dokumentieren (Screenshots, Zeitpunkte).',
      'Kommunikation über alternative Kanäle sicherstellen.',
    ],
    checklist: ['IT-Team alarmiert', 'Systeme isoliert', 'Behörden (NCSC) informiert', 'Notbetrieb aktiviert', 'Kommunikationsplan aktiv'],
  },
  {
    id: 'sc-strom', icon: '⚡', title: 'Stromausfall', category: 'Technik', silentDefault: false,
    instructions: [
      'Ruhe bewahren, Notbeleuchtung beachten.',
      'Technischer Dienst prüft Ursache und USV.',
      'Kritische Prozesse kontrolliert herunterfahren.',
      'Aufzüge auf eingeschlossene Personen prüfen.',
      'Energieversorger kontaktieren.',
    ],
    checklist: ['Technischer Dienst informiert', 'Aufzüge geprüft', 'Kritische Systeme gesichert', 'Versorger kontaktiert'],
  },
  {
    id: 'sc-wasser', icon: '💧', title: 'Wasserschaden', category: 'Gebäude', silentDefault: false,
    instructions: [
      'Hauptwasserhahn schliessen, wenn möglich.',
      'Elektrische Geräte im betroffenen Bereich vom Strom trennen.',
      'Technischen Dienst / Hauswart alarmieren.',
      'Wichtige Güter aus dem Gefahrenbereich entfernen.',
    ],
    checklist: ['Wasserzufuhr gestoppt', 'Strom getrennt', 'Bereich abgesperrt', 'Trocknungsfirma bestellt'],
  },
  {
    id: 'sc-gas', icon: '☣️', title: 'Gasaustritt / Chemieunfall', category: 'Gebäude', silentDefault: false,
    instructions: [
      'Keine offenen Flammen, keine elektrischen Schalter betätigen.',
      'Fenster öffnen (nur wenn gefahrlos), Bereich verlassen.',
      'Feuerwehr 118 alarmieren.',
      'Betroffene aus dem Gefahrenbereich bringen.',
      'Windrichtung beachten – Sammelplatz gegen den Wind.',
    ],
    checklist: ['118 alarmiert', 'Bereich evakuiert', 'Zündquellen eliminiert', 'Sicherheitsdatenblatt bereitgestellt'],
  },
  {
    id: 'sc-erdbeben', icon: '🌍', title: 'Erdbeben', category: 'Naturereignis', silentDefault: false,
    instructions: [
      'Im Gebäude: Schutz unter stabilen Möbeln suchen.',
      'Von Fenstern und Fassaden fernhalten.',
      'Nach dem Beben: Gebäude prüfen und ggf. evakuieren.',
      'Auf Nachbeben vorbereitet sein.',
    ],
    checklist: ['Personen geschützt', 'Gebäudeschäden erfasst', 'Evakuierung geprüft', 'Behördeninfos verfolgt'],
  },
  {
    id: 'sc-unwetter', icon: '🌪️', title: 'Unwetter / Sturm', category: 'Naturereignis', silentDefault: false,
    instructions: [
      'Aufenthalt im Freien vermeiden.',
      'Fenster und Türen schliessen, Storen einfahren.',
      'Lose Gegenstände im Aussenbereich sichern.',
      'Wetterwarnungen (MeteoSchweiz) verfolgen.',
    ],
    checklist: ['Aussenbereich gesichert', 'Mitarbeitende informiert', 'Gebäude gesichert', 'Lageupdates verfolgt'],
  },
  {
    id: 'sc-pandemie', icon: '😷', title: 'Pandemie / Infektionsfall', category: 'Personen', silentDefault: false,
    instructions: [
      'Betroffene Person isolieren und betreuen.',
      'Hygienemassnahmen verschärfen.',
      'Kontaktpersonen ermitteln und informieren.',
      'Behördliche Vorgaben (BAG) umsetzen.',
    ],
    checklist: ['Person isoliert', 'Kontakte informiert', 'Hygienekonzept aktiv', 'Homeoffice-Regelung kommuniziert'],
  },
  {
    id: 'sc-vermisst', icon: '🔍', title: 'Vermisste Person', category: 'Personen', silentDefault: false,
    instructions: [
      'Letzten bekannten Aufenthaltsort ermitteln.',
      'Suchtrupps koordinieren, Gelände absuchen.',
      'Polizei 117 informieren.',
      'Angehörige durch Krisenstab betreuen.',
    ],
    checklist: ['Suche organisiert', 'Polizei informiert', 'Angehörige betreut', 'Lagejournal geführt'],
  },
  {
    id: 'sc-krise', icon: '📉', title: 'Krisenstab einberufen', category: 'Organisation', silentDefault: false,
    instructions: [
      'Krisenstab über alle Kanäle aufbieten (mit Quittierung).',
      'Krisenraum vorbereiten (Lagekarte, Kommunikation).',
      'Lagebeurteilung durchführen.',
      'Kommunikationsstrategie festlegen (intern/extern).',
      'Massnahmen beschliessen und Lagejournal führen.',
    ],
    checklist: ['Krisenstab quittiert', 'Krisenraum bezogen', 'Lagebeurteilung erstellt', 'Medienstelle informiert', 'Lagejournal eröffnet'],
  },
]

export const SEED_LOCATIONS: Location[] = [
  {
    id: 'loc-zh', name: 'Hauptsitz Zürich', address: 'Bahnhofstrasse 10, 8001 Zürich',
    geofence: { lat: 47.3769, lng: 8.5417, radiusM: 300 },
    operatingHours: { days: 'Mo–Fr', open: '07:00', close: '19:00' },
  },
  {
    id: 'loc-be', name: 'Werk Bern', address: 'Industriestrasse 25, 3018 Bern',
    geofence: { lat: 46.948, lng: 7.4474, radiusM: 500 },
    operatingHours: { days: 'Mo–Sa', open: '05:00', close: '23:00' },
  },
  {
    id: 'loc-bs', name: 'Labor Basel', address: 'Forschungsweg 3, 4056 Basel',
    geofence: { lat: 47.5596, lng: 7.5886, radiusM: 200 },
    operatingHours: { days: 'Mo–So', open: '00:00', close: '24:00' },
  },
]

export const SEED_GROUPS: Group[] = [
  { id: 'gr-krisenstab', name: 'Krisenstab', description: 'Führungsorgan für ausserordentliche Lagen', isCrisisTeam: true },
  { id: 'gr-ersthelfer', name: 'Ersthelfer / Betriebssanität', description: 'Ausgebildete Ersthelfer mit BLS-AED', isCrisisTeam: true },
  { id: 'gr-evak', name: 'Evakuierungshelfer', description: 'Etagenverantwortliche für Evakuierungen', isCrisisTeam: true },
  { id: 'gr-it', name: 'IT-Notfallteam', description: 'Incident Response und Systemwiederherstellung', isCrisisTeam: true },
  { id: 'gr-sicherheit', name: 'Sicherheitsdienst', description: 'Werkschutz und Empfang', isCrisisTeam: false },
  { id: 'gr-alle', name: 'Alle Mitarbeitenden', description: 'Gesamte Belegschaft', isCrisisTeam: false },
]

export const SEED_USERS: User[] = [
  { id: 'u-admin', firstName: 'Stefan', lastName: 'Gross', email: 'stefan.gross@firma.ch', phone: '+41 79 100 10 01', role: 'admin', groupIds: ['gr-krisenstab', 'gr-alle'], locationId: 'loc-zh', language: 'de' },
  { id: 'u-mueller', firstName: 'Anna', lastName: 'Müller', email: 'anna.mueller@firma.ch', phone: '+41 79 100 10 02', role: 'krisenstab', groupIds: ['gr-krisenstab', 'gr-alle'], locationId: 'loc-zh', language: 'de' },
  { id: 'u-rossi', firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@firma.ch', phone: '+41 79 100 10 03', role: 'krisenstab', groupIds: ['gr-krisenstab', 'gr-ersthelfer', 'gr-alle'], locationId: 'loc-be', language: 'it' },
  { id: 'u-weber', firstName: 'Lea', lastName: 'Weber', email: 'lea.weber@firma.ch', phone: '+41 79 100 10 04', role: 'mitarbeiter', groupIds: ['gr-ersthelfer', 'gr-alle'], locationId: 'loc-zh', language: 'de' },
  { id: 'u-favre', firstName: 'Julien', lastName: 'Favre', email: 'julien.favre@firma.ch', phone: '+41 79 100 10 05', role: 'mitarbeiter', groupIds: ['gr-evak', 'gr-alle'], locationId: 'loc-be', language: 'fr' },
  { id: 'u-keller', firstName: 'Sandra', lastName: 'Keller', email: 'sandra.keller@firma.ch', phone: '+41 79 100 10 06', role: 'mitarbeiter', groupIds: ['gr-it', 'gr-alle'], locationId: 'loc-zh', language: 'de', partTimeNote: '60 %, Mo–Mi' },
  { id: 'u-huber', firstName: 'Thomas', lastName: 'Huber', email: 'thomas.huber@firma.ch', phone: '+41 79 100 10 07', role: 'mitarbeiter', groupIds: ['gr-sicherheit', 'gr-alle'], locationId: 'loc-be', language: 'de' },
  { id: 'u-brunner', firstName: 'Nicole', lastName: 'Brunner', email: 'nicole.brunner@firma.ch', phone: '+41 79 100 10 08', role: 'mitarbeiter', groupIds: ['gr-alle'], locationId: 'loc-bs', language: 'de', absence: { from: '2026-08-10', to: '2026-08-24' } },
  { id: 'u-meier', firstName: 'David', lastName: 'Meier', email: 'david.meier@firma.ch', phone: '+41 79 100 10 09', role: 'mitarbeiter', groupIds: ['gr-evak', 'gr-alle'], locationId: 'loc-bs', language: 'en' },
  { id: 'u-schmid', firstName: 'Petra', lastName: 'Schmid', email: 'petra.schmid@firma.ch', phone: '+41 79 100 10 10', role: 'mitarbeiter', groupIds: ['gr-ersthelfer', 'gr-alle'], locationId: 'loc-bs', language: 'de' },
]

export const SEED_PLANS: AlarmPlan[] = [
  {
    id: 'pl-brand-zh', name: 'Brandalarm Hauptsitz', scenarioId: 'sc-brand',
    locationIds: ['loc-zh'], groupIds: ['gr-alle'],
    channels: ['push', 'sms', 'tts'], requireAck: false, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 3, channels: ['voice'], groupIds: ['gr-evak'], notifyEmergencyServices: false },
      { afterMinutes: 10, channels: ['voice', 'sms'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true },
    ],
  },
  {
    id: 'pl-krisenstab', name: 'Aufgebot Krisenstab (mit Quittierung)', scenarioId: 'sc-krise',
    locationIds: ['loc-zh', 'loc-be', 'loc-bs'], groupIds: ['gr-krisenstab'],
    channels: ['push', 'sms', 'voice', 'conference'], requireAck: true, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 5, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: false },
    ],
  },
  {
    id: 'pl-medizin-be', name: 'Medizinischer Notfall Werk Bern', scenarioId: 'sc-medizin',
    locationIds: ['loc-be'], groupIds: ['gr-ersthelfer'],
    channels: ['push', 'voice'], requireAck: true, respectOperatingHours: true,
    escalation: [
      { afterMinutes: 2, channels: ['voice', 'sms'], groupIds: ['gr-sicherheit'], notifyEmergencyServices: true },
    ],
  },
  {
    id: 'pl-it', name: 'IT-Incident Response', scenarioId: 'sc-it',
    locationIds: ['loc-zh', 'loc-be', 'loc-bs'], groupIds: ['gr-it'],
    channels: ['push', 'email', 'teams'], requireAck: true, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 15, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: false },
    ],
  },
]

export const SEED_BUTTONS: AlarmButton[] = [
  {
    id: 'btn-1', name: 'Empfang EG', type: 'lorawan', serial: 'LW-8842-A1',
    locationId: 'loc-zh', assignedUserId: 'u-huber', batteryPct: 92,
    lastSeen: Date.now() - 5 * 60_000,
    messageTemplate: 'Stiller Alarm Empfang – Bedrohungslage möglich. Nicht zurückrufen.',
    targetGroupIds: ['gr-sicherheit', 'gr-krisenstab'], escalateToEmergencyServicesAfterMin: 5,
  },
  {
    id: 'btn-2', name: 'Nachtwächter mobil', type: 'gsm', serial: 'GSM-1207-B4',
    locationId: 'loc-be', assignedUserId: 'u-huber', batteryPct: 67,
    lastSeen: Date.now() - 42 * 60_000, gps: { lat: 46.9481, lng: 7.4466 },
    messageTemplate: 'Notfallknopf Nachtwächter ausgelöst – GPS-Position beachten.',
    targetGroupIds: ['gr-sicherheit'], escalateToEmergencyServicesAfterMin: 10,
  },
  {
    id: 'btn-3', name: 'Labor Reinraum', type: 'lorawan', serial: 'LW-8901-C7',
    locationId: 'loc-bs', batteryPct: 100,
    lastSeen: Date.now() - 2 * 60_000,
    messageTemplate: 'Alarmknopf Labor Reinraum ausgelöst – Chemieunfall möglich.',
    targetGroupIds: ['gr-ersthelfer', 'gr-krisenstab'], escalateToEmergencyServicesAfterMin: 5,
  },
]

export const SEED_CONTACTS: EmergencyContact[] = [
  { id: 'ec-117', name: 'Polizei', number: '117', description: 'Polizeinotruf Schweiz' },
  { id: 'ec-118', name: 'Feuerwehr', number: '118', description: 'Feuerwehrnotruf Schweiz' },
  { id: 'ec-144', name: 'Sanität', number: '144', description: 'Sanitätsnotruf Schweiz' },
  { id: 'ec-112', name: 'Europäischer Notruf', number: '112', description: 'Internationale Notrufnummer' },
  { id: 'ec-145', name: 'Tox Info Suisse', number: '145', description: 'Vergiftungsnotfälle' },
  { id: 'ec-1414', name: 'Rega', number: '1414', description: 'Rettungsflugwacht' },
]

export const SEED_INTEGRATIONS: IntegrationSettings = {
  smsGateway: { enabled: true, provider: 'Swisscom Messaging', senderId: 'ALARM' },
  voip: { enabled: false, sipServer: '' },
  teams: { enabled: true, tenant: 'firma.onmicrosoft.com' },
  sso: { enabled: false, provider: 'Azure AD / SAML 2.0', entityId: '' },
  hrSync: { enabled: false, system: 'SAP SuccessFactors' },
  hotline: { enabled: true, number: '+41 58 000 11 22' },
  multiLanguage: true,
  geofencing: true,
  webhooks: [
    { id: 'wh-1', name: 'Brandmeldeanlage Hauptsitz', url: 'https://alarmserver.example/api/inbound/bma-zh', direction: 'inbound', scenarioId: 'sc-brand', active: true },
    { id: 'wh-2', name: 'Leitstellen-Export', url: 'https://leitstelle.example/api/events', direction: 'outbound', active: true },
  ],
  accessCodes: [
    { code: 'ZH-4X9K2M', locationId: 'loc-zh', role: 'mitarbeiter', createdAt: Date.now() - 86400_000 * 12, used: 34 },
    { code: 'BE-7Q1R8T', locationId: 'loc-be', role: 'mitarbeiter', createdAt: Date.now() - 86400_000 * 30, used: 58 },
  ],
}

export function createInitialState(): AppState {
  return {
    currentUserId: 'u-admin',
    users: SEED_USERS,
    groups: SEED_GROUPS,
    locations: SEED_LOCATIONS,
    scenarios: SEED_SCENARIOS,
    plans: SEED_PLANS,
    alarms: [],
    buttons: SEED_BUTTONS,
    loneWorkSessions: [],
    integrations: SEED_INTEGRATIONS,
    contacts: SEED_CONTACTS,
    audit: [
      { id: 'a-1', ts: Date.now() - 3600_000, type: 'system', message: 'System initialisiert – Alarmserver betriebsbereit (Cloud-Hosting Schweiz).' },
    ],
  }
}
