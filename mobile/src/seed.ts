import type { AppState, Scenario, User, Group, Location, AlarmPlan, AlarmButton, EmergencyContact, IntegrationSettings } from './types'

// Vorkonfigurierte Notfallszenarien für das heilpädagogische Kompetenzzentrum Sonnenberg
export const SEED_SCENARIOS: Scenario[] = [
  {
    id: 'sc-brand', icon: 'flame', title: 'Brand / Feuer', category: 'Gebäude & Technik', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'tts'], responsibleGroupIds: ['gr-alle'], contactIds: ['ec-118', 'ec-144'],
    instructions: [
      'Ruhe bewahren – Schüler:innen nicht allein lassen.',
      'Brand melden: Feuerwehr 118 alarmieren.',
      'Klasse/Gruppe geschlossen über die Fluchtwege evakuieren – Klassenliste mitnehmen.',
      'Schüler:innen mit Mobilitätseinschränkung gemäss Evakuationsplan begleiten (Tragehilfen).',
      'Keine Aufzüge benutzen, Türen schliessen (nicht abschliessen).',
      'Sammelplatz aufsuchen und Vollständigkeit anhand der Klassenliste prüfen.',
    ],
    followUp: [
      'Fehlende Personen sofort der Einsatzleitung melden.',
      'Eltern/Erziehungsberechtigte durch die Schulleitung informieren.',
      'Betreuung und Beruhigung der Schüler:innen am Sammelplatz organisieren.',
      'Rückkehr ins Gebäude erst nach Freigabe durch die Feuerwehr.',
    ],
    checklist: ['Feuerwehr 118 alarmiert', 'Klassen evakuiert', 'Klassenlisten mitgenommen', 'Sammelplatz erreicht', 'Vollständigkeit geprüft', 'Einsatzkräfte eingewiesen', 'Eltern informiert'],
  },
  {
    id: 'sc-evak', icon: 'door-open', title: 'Evakuierung Schulhaus', category: 'Gebäude & Technik', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'tts'], responsibleGroupIds: ['gr-alle'], contactIds: [],
    instructions: [
      'Evakuierungsdurchsage abwarten bzw. auslösen.',
      'Klasse/Gruppe sammeln, zählen, Klassenliste mitnehmen.',
      'Schüler:innen mit besonderem Unterstützungsbedarf gemäss individuellem Evakuationsplan begleiten.',
      'Besucher und Therapiegäste mitnehmen.',
      'Nächstgelegenen Fluchtweg benutzen, Sammelplatz aufsuchen.',
      'Nicht ins Gebäude zurückkehren.',
    ],
    followUp: [
      'Zählung am Sammelplatz an Evakuationsleitung melden.',
      'Beschäftigung/Betreuung der Schüler:innen sicherstellen (Wartezeit).',
      'Bei längerer Dauer: Verlegung in Ausweichräumlichkeiten organisieren.',
    ],
    checklist: ['Durchsage erfolgt', 'Klassen gezählt', 'Individuelle Evakuationspläne umgesetzt', 'Sammelplatz erreicht', 'Zählung gemeldet'],
  },
  {
    id: 'sc-medizin', icon: 'heart-pulse', title: 'Medizinischer Notfall / Unfall', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144', 'ec-145', 'ec-1414'],
    instructions: [
      'Situation beurteilen – Eigenschutz beachten.',
      'Schulsanität alarmieren, bei Bedarf Sanität 144.',
      'Erste Hilfe leisten (BLS-AED-Schema), AED im Eingangsbereich.',
      'Andere Schüler:innen vom Geschehen wegführen und betreuen.',
      'Zufahrt für Rettungsdienst freihalten und einweisen.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte umgehend informieren (Schulleitung).',
      'Begleitung des Kindes ins Spital organisieren.',
      'Unfallprotokoll ausfüllen, Versicherung melden.',
      'Nachbetreuung der beteiligten Schüler:innen und Mitarbeitenden.',
    ],
    checklist: ['Schulsanität vor Ort', '144 alarmiert (falls nötig)', 'AED geholt', 'Schüler:innen betreut', 'Eltern informiert', 'Unfallprotokoll erstellt'],
  },
  {
    id: 'sc-epilepsie', icon: 'activity', title: 'Krampfanfall / Epilepsie', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144'],
    instructions: [
      'Ruhe bewahren, Zeit des Anfallsbeginns notieren.',
      'Gefährliche Gegenstände entfernen, Kopf weich lagern.',
      'Nichts in den Mund geben, Person nicht festhalten.',
      'Notfallmedikation gemäss individuellem Notfallplan des Kindes verabreichen (nur instruierte Personen).',
      'Sanität 144 alarmieren, wenn der Anfall länger als 5 Minuten dauert, sich wiederholt oder kein Notfallplan vorliegt.',
      'Nach dem Anfall: stabile Seitenlage, beruhigen, nicht allein lassen.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte informieren.',
      'Anfall im Anfallsprotokoll des Kindes dokumentieren.',
      'Klassensituation beruhigen, Mitschüler:innen altersgerecht auffangen.',
    ],
    checklist: ['Anfallsdauer erfasst', 'Notfallplan des Kindes beachtet', 'Notfallmedikation dokumentiert', '144 beurteilt/alarmiert', 'Eltern informiert', 'Protokoll ergänzt'],
  },
  {
    id: 'sc-allergie', icon: 'stethoscope', title: 'Allergische Reaktion / Anaphylaxie', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144', 'ec-145'],
    instructions: [
      'Auslöser wenn möglich entfernen (z. B. Lebensmittel).',
      'Individuellen Allergie-Notfallplan des Kindes anwenden.',
      'Bei schwerer Reaktion: Adrenalin-Autoinjektor (EpiPen) anwenden – nur instruierte Personen.',
      'Sanität 144 alarmieren.',
      'Person hinlegen, Beine hochlagern, zudecken, beruhigen.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte informieren.',
      'Vorfall dokumentieren, verabreichte Medikation festhalten.',
      'Auslöser-Abklärung mit Küche/Umfeld einleiten.',
    ],
    checklist: ['Notfallplan angewendet', 'EpiPen dokumentiert', '144 alarmiert', 'Eltern informiert', 'Auslöser abgeklärt'],
  },
  {
    id: 'sc-vermisst', icon: 'search', title: 'Vermisste:r Schüler:in / Weglaufen', category: 'Schüler:innen', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-alle'], contactIds: ['ec-117'],
    instructions: [
      'Letzten bekannten Aufenthaltsort und Zeitpunkt ermitteln.',
      'Beschreibung bereitstellen: Kleidung, Foto, besondere Merkmale, Verhaltensweisen (z. B. Weglauftendenz, Reaktion auf Ansprache).',
      'Sofortige Suche in Gebäude und Areal – Zuständigkeiten gemäss Suchplan (Gebäude, Aussenareal, bekannte Lieblingsorte).',
      'Gefahrenstellen zuerst absuchen (Strasse, Gewässer, Bahngleise).',
      'Aufsicht der übrigen Schüler:innen sicherstellen.',
      'Nach max. 15 Minuten erfolgloser Suche: Polizei 117 alarmieren.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte durch die Schulleitung informieren.',
      'Suchprotokoll führen (wer sucht wo, Zeiten).',
      'Nach dem Auffinden: medizinische Prüfung, ruhige Rückführung, keine Vorwürfe.',
      'Vorfall auswerten: Weglaufprävention und Aufsichtskonzept anpassen.',
    ],
    checklist: ['Aufenthaltsort ermittelt', 'Beschreibung/Foto verteilt', 'Suchbereiche zugeteilt', 'Gefahrenstellen geprüft', 'Polizei 117 (nach 15 Min.)', 'Eltern informiert', 'Suchprotokoll geführt'],
  },
  {
    id: 'sc-gewalt', icon: 'hand', title: 'Herausforderndes Verhalten / Eskalation', category: 'Schüler:innen', priority: 'mittel', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-paed', 'gr-sicherheit'], contactIds: ['ec-117'],
    instructions: [
      'Ruhe bewahren, deeskalierend kommunizieren (bekannte Strategien aus dem Verhaltensplan des Kindes).',
      'Stillen Alarm auslösen – Unterstützung durch das Deeskalationsteam anfordern.',
      'Andere Schüler:innen aus dem Raum bringen und beaufsichtigen.',
      'Gefährliche Gegenstände ausser Reichweite bringen.',
      'Körperliche Intervention nur als letztes Mittel, nur durch geschulte Personen, so kurz und schonend wie möglich.',
    ],
    followUp: [
      'Nachbesprechung mit dem Kind, sobald es beruhigt ist.',
      'Vorfall im Verlaufsjournal dokumentieren (Auslöser, Verlauf, Intervention).',
      'Eltern informieren, Verhaltensplan mit Fachteam überprüfen.',
      'Beteiligte Mitarbeitende entlasten (Kurzintervision).',
    ],
    checklist: ['Deeskalationsteam vor Ort', 'Mitschüler:innen in Sicherheit', 'Intervention dokumentiert', 'Eltern informiert', 'Verhaltensplan überprüft'],
  },
  {
    id: 'sc-amok', icon: 'shield-alert', title: 'Amok / Bedrohungslage', category: 'Sicherheit', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-alle'], contactIds: ['ec-117'],
    instructions: [
      'Flüchten nur, wenn gefahrlos möglich – sonst Klassenzimmer verriegeln.',
      'Türen verriegeln/verbarrikadieren, Licht löschen, vom Fenster weg, Geräte stumm.',
      'Schüler:innen ruhig halten – einfache, klare Ansagen, bekannte Beruhigungsrituale nutzen.',
      'Polizei 117 alarmieren, sobald sicher möglich.',
      'Tür erst auf eindeutige Ansage der Polizei öffnen.',
    ],
    followUp: [
      'Sammlung und Zählung nach Freigabe durch die Polizei.',
      'Eltern über offiziellen Kanal informieren (keine Einzelauskünfte).',
      'Care-Team/Notfallpsychologie für Schüler:innen und Mitarbeitende aufbieten.',
      'Medienanfragen ausschliesslich über die Schulleitung.',
    ],
    checklist: ['Räume verriegelt', 'Stiller Alarm ausgelöst', 'Polizei 117 informiert', 'Schüler:innen beruhigt', 'Zählung nach Freigabe', 'Care-Team aufgeboten'],
  },
  {
    id: 'sc-bombe', icon: 'bomb', title: 'Bombendrohung', category: 'Sicherheit', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-krisenstab', 'gr-sicherheit'], contactIds: ['ec-117'],
    instructions: [
      'Anruf ernst nehmen, Gespräch in die Länge ziehen.',
      'Wortlaut, Hintergrundgeräusche und Stimme notieren (Drohungsprotokoll neben dem Telefon).',
      'Polizei 117 alarmieren.',
      'Krisenstab informieren – keine eigenmächtige Evakuierung.',
      'Verdächtige Gegenstände nicht berühren.',
    ],
    followUp: [
      'Entscheidung über Evakuierung gemeinsam mit der Polizei.',
      'Bei Evakuierung: Ablauf wie Szenario «Evakuierung Schulhaus».',
      'Eltern nach Lagebeurteilung offiziell informieren.',
    ],
    checklist: ['Drohungsprotokoll ausgefüllt', 'Polizei 117 informiert', 'Krisenstab einberufen', 'Entscheidung Evakuierung getroffen'],
  },
  {
    id: 'sc-person', icon: 'lock-open', title: 'Verdächtige Person auf dem Areal', category: 'Sicherheit', priority: 'mittel', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-sicherheit'], contactIds: ['ec-117'],
    instructions: [
      'Person freundlich ansprechen und nach dem Anliegen fragen (nur zu zweit, kein Risiko eingehen).',
      'Hausdienst/Empfang still alarmieren.',
      'Schüler:innen unauffällig auf Distanz halten, Gruppen ins Gebäude begleiten.',
      'Bei Weigerung oder Bedrohung: Polizei 117 alarmieren, Person nicht festhalten.',
      'Personenbeschreibung und Fahrzeug notieren.',
    ],
    followUp: [
      'Vorfall dokumentieren und der Schulleitung melden.',
      'Bei wiederholten Vorfällen: Zutrittskonzept überprüfen.',
    ],
    checklist: ['Person angesprochen', 'Hausdienst informiert', 'Schüler:innen in Sicherheit', 'Polizei beurteilt/alarmiert', 'Beschreibung notiert'],
  },
  {
    id: 'sc-transport', icon: 'bus', title: 'Unfall Schülertransport', category: 'Schüler:innen', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'voice'], responsibleGroupIds: ['gr-krisenstab', 'gr-ersthelfer'], contactIds: ['ec-144', 'ec-117'],
    instructions: [
      'Fahrer:in/Begleitperson: Unfallstelle sichern, Warnblinker, Pannendreieck.',
      'Verletzte versorgen, Sanität 144 und Polizei 117 alarmieren.',
      'Schule informieren: Standort, Anzahl Kinder, Zustand, welche Kinder betroffen.',
      'Kinder beaufsichtigen und beruhigen – niemand verlässt die Gruppe.',
      'Schulleitung organisiert Ersatztransport und Betreuung vor Ort.',
    ],
    followUp: [
      'Eltern aller betroffenen Kinder durch die Schulleitung informieren.',
      'Begleitung ins Spital sicherstellen, Übergabe an Eltern dokumentieren.',
      'Transportunternehmen und Versicherung informieren.',
      'Nachbetreuung der Kinder in den Folgetagen (Fahrangst).',
    ],
    checklist: ['Unfallstelle gesichert', '144/117 alarmiert', 'Schule informiert', 'Kinderliste abgeglichen', 'Eltern informiert', 'Ersatztransport organisiert'],
  },
  {
    id: 'sc-medikament', icon: 'pill', title: 'Medikamenten-Zwischenfall', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer', 'gr-krisenstab'], contactIds: ['ec-145', 'ec-144'],
    instructions: [
      'Zwischenfall sofort melden: falsche Abgabe, falsche Dosis, vergessene oder verweigerte Einnahme, Einnahme fremder Medikamente.',
      'Tox Info Suisse 145 kontaktieren: Medikament, Dosis, Zeitpunkt, Gewicht des Kindes bereithalten.',
      'Anweisungen von Tox Info befolgen, bei Symptomen Sanität 144 alarmieren.',
      'Kind beobachten, nicht allein lassen, kein Erbrechen auslösen.',
      'Medikamentenpackung/Blister sicherstellen.',
    ],
    followUp: [
      'Eltern und behandelnde Ärztin/Arzt informieren.',
      'Zwischenfall im Medikamentenjournal dokumentieren (4-Augen-Prinzip prüfen).',
      'Abgabeprozess analysieren und Massnahmen festlegen.',
    ],
    checklist: ['Tox Info 145 kontaktiert', 'Kind unter Beobachtung', 'Packung sichergestellt', 'Eltern/Arzt informiert', 'Journal dokumentiert', 'Prozess überprüft'],
  },
  {
    id: 'sc-todesfall', icon: 'heart-crack', title: 'Todesfall in der Schulgemeinschaft', category: 'Organisation', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-krisenstab'], contactIds: ['ec-143'],
    instructions: [
      'Information zuerst verifizieren (Quelle, Angehörige, Behörden).',
      'Krisenstab einberufen – einheitliche Sprachregelung festlegen.',
      'Mitarbeitende vor den Schüler:innen informieren.',
      'Klassen altersgerecht und der kognitiven Entwicklung entsprechend informieren (einfache Sprache, Bilder, Rituale).',
      'Care-Team/Schulpsychologie aufbieten.',
    ],
    followUp: [
      'Kontakt mit der betroffenen Familie durch die Schulleitung (Beileid, Abstimmung Kommunikation).',
      'Trauerraum/Rituale einrichten, Abschied ermöglichen.',
      'Besonders betroffene Schüler:innen und Mitarbeitende längerfristig begleiten.',
      'Teilnahme an Abdankung koordinieren.',
    ],
    checklist: ['Information verifiziert', 'Krisenstab einberufen', 'Sprachregelung festgelegt', 'Team informiert', 'Klassen begleitet informiert', 'Care-Team vor Ort', 'Familie kontaktiert'],
  },
  {
    id: 'sc-psych', icon: 'life-buoy', title: 'Akute psychische Krise / Suizidalität', category: 'Schüler:innen', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-krisenstab', 'gr-paed'], contactIds: ['ec-144', 'ec-143', 'ec-147'],
    instructions: [
      'Person nicht allein lassen – ruhig, zugewandt und ernst nehmend bleiben.',
      'Gefährliche Gegenstände unauffällig entfernen.',
      'Äusserungen ernst nehmen, nicht bagatellisieren, offene Fragen stellen.',
      'Schulleitung und zuständige Fachperson (Schulpsychologie/KJPP) still beiziehen.',
      'Bei akuter Selbstgefährdung: Sanität 144 alarmieren, Person begleiten.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte einbeziehen (durch Fachperson/Schulleitung).',
      'Übergabe an KJPP/Notfallpsychiatrie dokumentieren.',
      'Wiedereinstieg planen (Absprachen, Betreuungsplan, Monitoring).',
      'Umfeld sensibilisieren, ohne Details zu verbreiten.',
    ],
    checklist: ['Person begleitet', 'Gegenstände entfernt', 'Fachperson beigezogen', '144 beurteilt/alarmiert', 'Eltern einbezogen', 'Wiedereinstieg geplant'],
  },
  {
    id: 'sc-kindesschutz', icon: 'shield-alert', title: 'Kindesschutz – Verdacht auf Gefährdung', category: 'Schüler:innen', priority: 'mittel', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-krisenstab'], contactIds: ['ec-147'],
    instructions: [
      'Beobachtungen sachlich dokumentieren (Datum, Situation, Wortlaut) – nicht selbst ermitteln oder konfrontieren.',
      'Dem Kind zuhören, ernst nehmen, nichts versprechen, was nicht gehalten werden kann.',
      'Meldung an die Kindesschutzgruppe/Schulleitung – Vertraulichkeit wahren.',
      'Keine Information an mutmasslich beteiligte Personen.',
    ],
    followUp: [
      'Kindesschutzgruppe beurteilt das weitere Vorgehen (Fachstelle, KESB-Gefährdungsmeldung).',
      'Schutz des Kindes im Schulalltag sicherstellen.',
      'Dokumentation vertraulich und revisionssicher ablegen.',
    ],
    checklist: ['Beobachtungen dokumentiert', 'Kindesschutzgruppe informiert', 'Vertraulichkeit gewahrt', 'Vorgehen festgelegt', 'Schutz sichergestellt'],
  },
  {
    id: 'sc-wasserunfall', icon: 'droplets', title: 'Notfall im Therapiebad', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144'],
    instructions: [
      'Person sofort aus dem Wasser retten – Eigenschutz beachten.',
      'Alarmknopf Therapiebad drücken / Schulsanität alarmieren.',
      'BLS-AED-Schema starten, bei Bewusstlosigkeit sofort 144.',
      'Übrige Schüler:innen aus dem Wasser und aus dem Bad begleiten.',
      'Rettungsdienst einweisen.',
    ],
    followUp: [
      'Eltern informieren, Spitalbegleitung organisieren.',
      'Unfallhergang dokumentieren, Badaufsichtskonzept überprüfen.',
      'Beteiligte nachbetreuen.',
    ],
    checklist: ['Person gerettet', '144 alarmiert', 'BLS-AED durchgeführt', 'Bad geräumt', 'Eltern informiert', 'Konzept überprüft'],
  },
  {
    id: 'sc-it', icon: 'server-crash', title: 'IT-Ausfall / Cyberangriff', category: 'Gebäude & Technik', priority: 'mittel', silentDefault: false,
    defaultChannels: ['push', 'email', 'teams'], responsibleGroupIds: ['gr-it'], contactIds: [],
    instructions: [
      'Betroffene Systeme nicht ausschalten, aber vom Netz trennen.',
      'IT-Support alarmieren, keine Passwörter mehr eingeben.',
      'Besonders schützen: Schülerdaten, Förderberichte, Gesundheitsdaten.',
      'Vorfall dokumentieren (Screenshots, Zeitpunkte).',
      'Kommunikation über alternative Kanäle sicherstellen (Telefonketten).',
    ],
    followUp: [
      'Meldung an NCSC und ggf. Datenschutzbehörde prüfen (Personendaten!).',
      'Betroffene informieren, wenn Datenabfluss möglich ist.',
      'Wiederherstellung aus Backups, Lessons Learned.',
    ],
    checklist: ['IT-Support alarmiert', 'Systeme isoliert', 'Datenlage beurteilt', 'Meldepflichten geprüft', 'Notbetrieb aktiv'],
  },
  {
    id: 'sc-strom', icon: 'zap-off', title: 'Stromausfall', category: 'Gebäude & Technik', priority: 'tief', silentDefault: false,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-sicherheit'], contactIds: [],
    instructions: [
      'Ruhe bewahren, Schüler:innen beruhigen (Dunkelheit kann Ängste auslösen).',
      'Hausdienst prüft Ursache, Sicherungen und Notbeleuchtung.',
      'Aufzüge auf eingeschlossene Personen prüfen.',
      'Hilfsmittel mit Akku prüfen (Lifter, Kommunikationsgeräte, Pflegebetten).',
      'Energieversorger kontaktieren.',
    ],
    followUp: [
      'Bei längerem Ausfall: Unterricht anpassen oder Schüler:innen abholen lassen.',
      'Kühlketten (Küche, Medikamente) prüfen.',
    ],
    checklist: ['Hausdienst informiert', 'Aufzüge geprüft', 'Akku-Hilfsmittel geprüft', 'Versorger kontaktiert', 'Eltern informiert (bei Bedarf)'],
  },
  {
    id: 'sc-wasser', icon: 'droplets', title: 'Wasserschaden', category: 'Gebäude & Technik', priority: 'tief', silentDefault: false,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-sicherheit'], contactIds: ['ec-118'],
    instructions: [
      'Hauptwasserhahn schliessen, wenn möglich.',
      'Elektrische Geräte im betroffenen Bereich vom Strom trennen.',
      'Hausdienst alarmieren, Bereich absperren (Rutschgefahr).',
      'Betroffene Räume räumen, Unterricht verlegen.',
    ],
    followUp: [
      'Trocknungsfirma und Versicherung aufbieten.',
      'Raumbelegung anpassen, Eltern bei Betriebseinschränkung informieren.',
    ],
    checklist: ['Wasserzufuhr gestoppt', 'Strom getrennt', 'Bereich abgesperrt', 'Räume verlegt', 'Versicherung gemeldet'],
  },
  {
    id: 'sc-unwetter', icon: 'cloud-lightning', title: 'Unwetter / Sturm', category: 'Naturereignis', priority: 'mittel', silentDefault: false,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-sicherheit', 'gr-alle'], contactIds: [],
    instructions: [
      'Pausen und Aktivitäten im Freien sofort beenden.',
      'Fenster und Türen schliessen, Storen einfahren.',
      'Lose Gegenstände im Aussenbereich sichern (Spielgeräte, Sonnenschirme).',
      'Wetterwarnungen (MeteoSchweiz) verfolgen.',
      'Schülertransporte prüfen: Abfahrten verschieben oder Eltern informieren.',
    ],
    followUp: [
      'Areal auf Schäden kontrollieren, Gefahrenstellen absperren.',
      'Transportplan und Heimweg der Schüler:innen koordinieren.',
    ],
    checklist: ['Aussenaktivitäten beendet', 'Gebäude gesichert', 'Transporte koordiniert', 'Eltern informiert', 'Areal kontrolliert'],
  },
  {
    id: 'sc-pandemie', icon: 'biohazard', title: 'Pandemie / Infektionsfall', category: 'Gesundheit', priority: 'mittel', silentDefault: false,
    defaultChannels: ['push', 'email'], responsibleGroupIds: ['gr-krisenstab'], contactIds: [],
    instructions: [
      'Betroffene Person isolieren und betreuen (nicht allein lassen).',
      'Hygienemassnahmen verschärfen (Händehygiene, Reinigung, Lüften).',
      'Kontaktpersonen ermitteln – besonders vulnerable Schüler:innen schützen.',
      'Behördliche Vorgaben (BAG/Kantonsarzt) umsetzen.',
      'Eltern über Massnahmen informieren.',
    ],
    followUp: [
      'Absenzenmonitoring führen, Schwellenwerte beachten.',
      'Fernbetreuungs-/Unterrichtskonzept aktivieren, falls nötig.',
    ],
    checklist: ['Person isoliert', 'Kontakte ermittelt', 'Hygienekonzept aktiv', 'Behörden einbezogen', 'Eltern informiert'],
  },
  {
    id: 'sc-krise', icon: 'users', title: 'Krisenstab einberufen', category: 'Organisation', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'voice', 'conference'], responsibleGroupIds: ['gr-krisenstab'], contactIds: [],
    instructions: [
      'Krisenstab über alle Kanäle aufbieten (mit Quittierung).',
      'Krisenraum im Hauptsitz Baar vorbereiten (Lagekarte, Telefonliste, Schülerlisten).',
      'Lagebeurteilung durchführen: Was ist passiert, wer ist betroffen, was ist zu tun?',
      'Kommunikationsstrategie festlegen (Mitarbeitende, Eltern, Behörden, Medien).',
      'Massnahmen beschliessen und Lagejournal führen.',
    ],
    followUp: [
      'Regelmässige Lage-Rapporte festlegen.',
      'Elterninformation über offizielle Kanäle sicherstellen.',
      'Einsatz nachbereiten: Debriefing und Verbesserungsmassnahmen.',
    ],
    checklist: ['Krisenstab quittiert', 'Krisenraum bezogen', 'Lagebeurteilung erstellt', 'Sprachregelung festgelegt', 'Lagejournal eröffnet', 'Debriefing geplant'],
  },
]

export const SEED_LOCATIONS: Location[] = [
  {
    id: 'loc-baar', name: 'Hauptsitz Baar', address: 'Sonnenberg Kompetenzzentrum, 6340 Baar',
    geofence: { lat: 47.1954, lng: 8.5289, radiusM: 400 },
    operatingHours: { days: 'Mo–So (inkl. Wohngruppen)', open: '00:00', close: '24:00' },
  },
  {
    id: 'loc-menzingen', name: 'Standort Menzingen', address: 'Schulstandort, 6313 Menzingen',
    geofence: { lat: 47.1773, lng: 8.5921, radiusM: 300 },
    operatingHours: { days: 'Mo–Fr', open: '07:00', close: '18:00' },
  },
  {
    id: 'loc-kloten', name: 'Standort Kloten', address: 'Schulstandort, 8302 Kloten',
    geofence: { lat: 47.4515, lng: 8.585, radiusM: 300 },
    operatingHours: { days: 'Mo–Fr', open: '07:00', close: '18:00' },
  },
]

export const SEED_GROUPS: Group[] = [
  { id: 'gr-krisenstab', name: 'Krisenstab', description: 'Schulleitung und Bereichsleitungen – Führungsorgan für ausserordentliche Lagen', isCrisisTeam: true },
  { id: 'gr-ersthelfer', name: 'Schulsanität / Ersthelfer', description: 'Ausgebildete Ersthelfer mit BLS-AED und Medikamentenschulung', isCrisisTeam: true },
  { id: 'gr-evak', name: 'Evakuationshelfer', description: 'Gebäude- und Etagenverantwortliche, Umsetzung individueller Evakuationspläne', isCrisisTeam: true },
  { id: 'gr-paed', name: 'Deeskalationsteam', description: 'Sozialpädagogisch geschulte Mitarbeitende für herausfordernde Situationen', isCrisisTeam: true },
  { id: 'gr-it', name: 'IT-Support', description: 'Incident Response und Systemwiederherstellung', isCrisisTeam: false },
  { id: 'gr-sicherheit', name: 'Hausdienst & Empfang', description: 'Technischer Dienst, Empfang und Arealsicherheit', isCrisisTeam: false },
  { id: 'gr-alle', name: 'Alle Mitarbeitenden', description: 'Gesamtes Personal aller Standorte', isCrisisTeam: false },
]

export const SEED_USERS: User[] = [
  { id: 'u-admin', firstName: 'Stefan', lastName: 'Gross', email: 'stefan.gross@sonnenberg-baar.ch', phone: '+41 79 100 10 01', role: 'admin', groupIds: ['gr-krisenstab', 'gr-alle'], locationId: 'loc-baar', language: 'de' },
  { id: 'u-mueller', firstName: 'Anna', lastName: 'Müller', email: 'anna.mueller@sonnenberg-baar.ch', phone: '+41 79 100 10 02', role: 'krisenstab', groupIds: ['gr-krisenstab', 'gr-alle'], locationId: 'loc-baar', language: 'de' },
  { id: 'u-rossi', firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@sonnenberg-baar.ch', phone: '+41 79 100 10 03', role: 'krisenstab', groupIds: ['gr-krisenstab', 'gr-paed', 'gr-alle'], locationId: 'loc-menzingen', language: 'it' },
  { id: 'u-weber', firstName: 'Lea', lastName: 'Weber', email: 'lea.weber@sonnenberg-baar.ch', phone: '+41 79 100 10 04', role: 'mitarbeiter', groupIds: ['gr-ersthelfer', 'gr-alle'], locationId: 'loc-baar', language: 'de' },
  { id: 'u-favre', firstName: 'Julien', lastName: 'Favre', email: 'julien.favre@sonnenberg-baar.ch', phone: '+41 79 100 10 05', role: 'mitarbeiter', groupIds: ['gr-paed', 'gr-evak', 'gr-alle'], locationId: 'loc-menzingen', language: 'fr' },
  { id: 'u-keller', firstName: 'Sandra', lastName: 'Keller', email: 'sandra.keller@sonnenberg-baar.ch', phone: '+41 79 100 10 06', role: 'mitarbeiter', groupIds: ['gr-it', 'gr-alle'], locationId: 'loc-baar', language: 'de', partTimeNote: '60 %, Mo–Mi' },
  { id: 'u-huber', firstName: 'Thomas', lastName: 'Huber', email: 'thomas.huber@sonnenberg-baar.ch', phone: '+41 79 100 10 07', role: 'mitarbeiter', groupIds: ['gr-sicherheit', 'gr-alle'], locationId: 'loc-baar', language: 'de' },
  { id: 'u-brunner', firstName: 'Nicole', lastName: 'Brunner', email: 'nicole.brunner@sonnenberg-baar.ch', phone: '+41 79 100 10 08', role: 'mitarbeiter', groupIds: ['gr-alle'], locationId: 'loc-kloten', language: 'de', absence: { from: '2026-08-10', to: '2026-08-24' } },
  { id: 'u-meier', firstName: 'David', lastName: 'Meier', email: 'david.meier@sonnenberg-baar.ch', phone: '+41 79 100 10 09', role: 'mitarbeiter', groupIds: ['gr-evak', 'gr-alle'], locationId: 'loc-kloten', language: 'en' },
  { id: 'u-schmid', firstName: 'Petra', lastName: 'Schmid', email: 'petra.schmid@sonnenberg-baar.ch', phone: '+41 79 100 10 10', role: 'mitarbeiter', groupIds: ['gr-ersthelfer', 'gr-paed', 'gr-alle'], locationId: 'loc-baar', language: 'de' },
]

export const SEED_PLANS: AlarmPlan[] = [
  {
    id: 'pl-brand-baar', name: 'Brandalarm Hauptsitz Baar', scenarioId: 'sc-brand',
    locationIds: ['loc-baar'], groupIds: ['gr-alle'],
    channels: ['push', 'sms', 'tts'], requireAck: false, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 3, channels: ['voice'], groupIds: ['gr-evak'], notifyEmergencyServices: false },
      { afterMinutes: 10, channels: ['voice', 'sms'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true },
    ],
  },
  {
    id: 'pl-krisenstab', name: 'Aufgebot Krisenstab (mit Quittierung)', scenarioId: 'sc-krise',
    locationIds: ['loc-baar', 'loc-menzingen', 'loc-kloten'], groupIds: ['gr-krisenstab'],
    channels: ['push', 'sms', 'voice', 'conference'], requireAck: true, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 5, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: false },
    ],
  },
  {
    id: 'pl-vermisst', name: 'Vermisste:r Schüler:in – Suchaktion', scenarioId: 'sc-vermisst',
    locationIds: [], groupIds: ['gr-alle'],
    channels: ['push', 'sms'], requireAck: true, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 10, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: false },
      { afterMinutes: 20, channels: ['voice', 'sms'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: true },
    ],
  },
  {
    id: 'pl-medizin', name: 'Medizinischer Notfall (Schulsanität)', scenarioId: 'sc-medizin',
    locationIds: [], groupIds: ['gr-ersthelfer'],
    channels: ['push', 'voice'], requireAck: true, respectOperatingHours: true,
    escalation: [
      { afterMinutes: 2, channels: ['voice', 'sms'], groupIds: ['gr-sicherheit'], notifyEmergencyServices: true },
    ],
  },
  {
    id: 'pl-eskalation', name: 'Deeskalationsteam (stiller Alarm)', scenarioId: 'sc-gewalt',
    locationIds: [], groupIds: ['gr-paed'],
    channels: ['push'], requireAck: true, respectOperatingHours: true,
    escalation: [
      { afterMinutes: 3, channels: ['push', 'voice'], groupIds: ['gr-sicherheit', 'gr-krisenstab'], notifyEmergencyServices: false },
    ],
  },
  {
    id: 'pl-it', name: 'IT-Incident Response', scenarioId: 'sc-it',
    locationIds: [], groupIds: ['gr-it'],
    channels: ['push', 'email', 'teams'], requireAck: true, respectOperatingHours: false,
    escalation: [
      { afterMinutes: 15, channels: ['voice'], groupIds: ['gr-krisenstab'], notifyEmergencyServices: false },
    ],
  },
]

export const SEED_BUTTONS: AlarmButton[] = [
  {
    id: 'btn-1', name: 'Empfang Hauptsitz Baar', type: 'lorawan', serial: 'LW-8842-A1',
    locationId: 'loc-baar', assignedUserId: 'u-huber', batteryPct: 92,
    lastSeen: Date.now() - 5 * 60_000,
    messageTemplate: 'Stiller Alarm Empfang Baar – Bedrohungslage möglich. Nicht zurückrufen.',
    targetGroupIds: ['gr-sicherheit', 'gr-krisenstab'], escalateToEmergencyServicesAfterMin: 5,
  },
  {
    id: 'btn-2', name: 'Therapiebad Baar', type: 'lorawan', serial: 'LW-8901-C7',
    locationId: 'loc-baar', batteryPct: 100,
    lastSeen: Date.now() - 2 * 60_000,
    messageTemplate: 'Alarmknopf Therapiebad ausgelöst – sofort Schulsanität ins Bad!',
    targetGroupIds: ['gr-ersthelfer', 'gr-sicherheit'], escalateToEmergencyServicesAfterMin: 3,
  },
  {
    id: 'btn-3', name: 'Schülertransport Bus 1 (Kloten)', type: 'gsm', serial: 'GSM-1207-B4',
    assignedUserId: 'u-meier', batteryPct: 67,
    lastSeen: Date.now() - 42 * 60_000, gps: { lat: 47.4489, lng: 8.5761 },
    messageTemplate: 'Notfallknopf Schülertransport Bus 1 ausgelöst – GPS-Position beachten.',
    targetGroupIds: ['gr-krisenstab', 'gr-ersthelfer'], escalateToEmergencyServicesAfterMin: 5,
  },
  {
    id: 'btn-4', name: 'Wohngruppe Menzingen', type: 'lorawan', serial: 'LW-9014-D2',
    locationId: 'loc-menzingen', assignedUserId: 'u-favre', batteryPct: 88,
    lastSeen: Date.now() - 8 * 60_000,
    messageTemplate: 'Alarmknopf Wohngruppe Menzingen – Unterstützung durch Deeskalationsteam angefordert.',
    targetGroupIds: ['gr-paed', 'gr-krisenstab'], escalateToEmergencyServicesAfterMin: 10,
  },
]

export const SEED_CONTACTS: EmergencyContact[] = [
  { id: 'ec-117', name: 'Polizei', number: '117', description: 'Polizeinotruf Schweiz' },
  { id: 'ec-118', name: 'Feuerwehr', number: '118', description: 'Feuerwehrnotruf Schweiz' },
  { id: 'ec-144', name: 'Sanität', number: '144', description: 'Sanitätsnotruf Schweiz' },
  { id: 'ec-112', name: 'Europäischer Notruf', number: '112', description: 'Internationale Notrufnummer' },
  { id: 'ec-145', name: 'Tox Info Suisse', number: '145', description: 'Vergiftungs- und Medikamentennotfälle' },
  { id: 'ec-1414', name: 'Rega', number: '1414', description: 'Rettungsflugwacht' },
  { id: 'ec-143', name: 'Dargebotene Hand', number: '143', description: 'Telefonseelsorge für Erwachsene' },
  { id: 'ec-147', name: 'Pro Juventute', number: '147', description: 'Beratung für Kinder und Jugendliche' },
]

export const SEED_INTEGRATIONS: IntegrationSettings = {
  smsGateway: { enabled: true, provider: 'Swisscom Messaging', senderId: 'SONNENBERG' },
  voip: { enabled: false, sipServer: '' },
  teams: { enabled: true, tenant: 'sonnenberg-baar.onmicrosoft.com' },
  sso: { enabled: false, provider: 'Microsoft Entra ID / SAML 2.0', entityId: '' },
  hrSync: { enabled: false, system: 'Abacus HR' },
  hotline: { enabled: true, number: '+41 41 000 11 22' },
  multiLanguage: true,
  geofencing: true,
  webhooks: [
    { id: 'wh-1', name: 'Brandmeldeanlage Hauptsitz Baar', url: 'https://alarmserver.example/api/inbound/bma-baar', direction: 'inbound', scenarioId: 'sc-brand', active: true },
    { id: 'wh-2', name: 'Leitstellen-Export', url: 'https://leitstelle.example/api/events', direction: 'outbound', active: true },
  ],
  accessCodes: [
    { code: 'BA-4X9K2M', locationId: 'loc-baar', role: 'mitarbeiter', createdAt: Date.now() - 86400_000 * 12, used: 34 },
    { code: 'ME-7Q1R8T', locationId: 'loc-menzingen', role: 'mitarbeiter', createdAt: Date.now() - 86400_000 * 30, used: 21 },
    { code: 'KL-2P5W9V', locationId: 'loc-kloten', role: 'mitarbeiter', createdAt: Date.now() - 86400_000 * 30, used: 17 },
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
      { id: 'a-1', ts: Date.now() - 3600_000, type: 'system', message: 'System initialisiert – Alarmserver für Sonnenberg Kompetenzzentrum betriebsbereit (Cloud-Hosting Schweiz).' },
    ],
  }
}
