import type { AppState, Scenario, User, Group, Location, AlarmPlan, AlarmButton, EmergencyContact, IntegrationSettings } from './types'

// Vorkonfigurierte Notfallszenarien für das heilpädagogische Kompetenzzentrum SONNENBERG
/** Inhaltsversion der Standard-Szenarien – bei Erhöhung werden sie beim Laden aktualisiert */
export const SCENARIO_CONTENT_VERSION = 2

export const SEED_SCENARIOS: Scenario[] = [
  {
    id: 'sc-brand', icon: 'flame', title: 'Brand / Feuer', category: 'Gebäude & Technik', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'tts'], responsibleGroupIds: ['gr-alle'], contactIds: ['ec-118', 'ec-144'],
    instructions: [
      'Personen aus dem unmittelbaren Gefahrenbereich bringen – Eigenschutz beachten.',
      'Feuerwehr 118 anrufen: Wer, wo (Gebäude/Stockwerk/Raum), was brennt, Verletzte?',
      'Alarm in der App auslösen – alle am Standort werden informiert.',
      'Nur Entstehungsbrand löschen (Handfeuerlöscher im Korridor) – kein Risiko eingehen.',
      'Klasse geschlossen über den Fluchtweg zum Sammelplatz führen – Klassenliste mitnehmen, keine Aufzüge.',
      'Kinder mit Mobilitätseinschränkung gemäss individuellem Evakuationsplan begleiten (Tragehilfe).',
      'Türen schliessen, nicht abschliessen – niemand kehrt zurück.',
    ],
    followUp: [
      'Am Sammelplatz: Vollständigkeit anhand der Klassenliste prüfen, Ergebnis der Evakuationsleitung melden.',
      'Fehlende Personen mit letztem bekanntem Aufenthaltsort sofort der Feuerwehr melden.',
      'Schulleitung informiert Eltern/Erziehungsberechtigte über den offiziellen Kanal.',
      'Kinder am Sammelplatz beschäftigen und beruhigen – Betreuungsschlüssel halten.',
      'Rückkehr ins Gebäude erst nach ausdrücklicher Freigabe der Feuerwehr.',
    ],
    checklist: ['118 alarmiert', 'App-Alarm ausgelöst', 'Klassen evakuiert, Listen dabei', 'Sammelplatz: Zählung gemeldet', 'Feuerwehr eingewiesen', 'Eltern informiert', 'Freigabe für Rückkehr erhalten'],
  },
  {
    id: 'sc-evak', icon: 'door-open', title: 'Evakuierung Schulhaus', category: 'Gebäude & Technik', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'tts'], responsibleGroupIds: ['gr-alle'], contactIds: [],
    instructions: [
      'Evakuierungsalarm in der App auslösen – Standort wählen, alle dort werden benachrichtigt.',
      'Unterricht sofort beenden, Klasse sammeln und anhand der Klassenliste zählen.',
      'Kinder mit besonderem Unterstützungsbedarf gemäss individuellem Evakuationsplan begleiten.',
      'Besucher, Therapiegäste und Handwerker mitnehmen.',
      'Auf dem nächstgelegenen, freien Fluchtweg zum Sammelplatz – ruhig, geschlossen, keine Aufzüge.',
      'Raum leer? Tür schliessen (nicht abschliessen) – niemand kehrt zurück.',
    ],
    followUp: [
      'Zählung am Sammelplatz an die Evakuationsleitung melden («Klasse X: vollständig / N fehlt»).',
      'Kinder beschäftigen und warm halten – bei Kälte/Nässe Verlegung in die Ausweichräume (Turnhalle).',
      'Bei längerer Dauer: Schulleitung organisiert Abholung durch die Eltern über den offiziellen Kanal.',
      'Ereignis im Protokoll dokumentieren (Auslöser, Dauer, Besonderheiten).',
    ],
    checklist: ['App-Alarm für Standort ausgelöst', 'Klassen gezählt', 'Individuelle Evakuationspläne umgesetzt', 'Gäste mitgenommen', 'Zählung gemeldet', 'Betreuung sichergestellt'],
  },
  {
    id: 'sc-medizin', icon: 'heart-pulse', title: 'Medizinischer Notfall / Unfall', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144', 'ec-145', 'ec-1414'],
    instructions: [
      'Situation sichern – Eigenschutz vor Fremdschutz, Person nicht allein lassen.',
      'Bewusstsein und Atmung prüfen: keine normale Atmung? Sofort 144 anrufen.',
      'Schulsanität per App alarmieren – der AED hängt beim Haupteingang.',
      'Erste Hilfe nach BLS-AED-Schema: 30× drücken, 2× beatmen, AED-Ansagen folgen.',
      'Andere Kinder vom Geschehen wegführen – eine zweite Person übernimmt die Aufsicht.',
      'Rettungsdienst einweisen: eine Person wartet an der Zufahrt.',
    ],
    followUp: [
      'Schulleitung informiert Eltern/Erziehungsberechtigte sofort telefonisch.',
      'Begleitperson fährt im Rettungswagen mit oder folgt ins Spital (Notfallblatt des Kindes mitnehmen).',
      'Unfallprotokoll gleichentags ausfüllen, Versicherung melden.',
      'Beteiligte Kinder und Mitarbeitende nachbetreuen (Care-Angebot).',
    ],
    checklist: ['144 beurteilt/alarmiert', 'Schulsanität vor Ort', 'AED geholt', 'Aufsicht der Klasse geregelt', 'Rettungsdienst eingewiesen', 'Eltern informiert', 'Unfallprotokoll erstellt'],
  },
  {
    id: 'sc-epilepsie', icon: 'activity', title: 'Krampfanfall / Epilepsie', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144'],
    instructions: [
      'Uhrzeit merken – die Anfallsdauer entscheidet über den Notruf.',
      'Gefährliche Gegenstände wegräumen, Kopf weich lagern (Jacke/Kissen).',
      'Nicht festhalten, nichts in den Mund geben, nichts einflössen.',
      'Schulsanität per App alarmieren – sie bringt die Notfallmedikation des Kindes.',
      'Notfallmedikation nur gemäss individuellem Notfallplan und nur durch instruierte Personen.',
      '144 anrufen, wenn: Anfall > 5 Minuten, zweiter Anfall, Verletzung, oder kein Notfallplan vorhanden.',
      'Nach dem Anfall: stabile Seitenlage, zudecken, ruhig ansprechen, nicht allein lassen.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte noch am selben Tag informieren.',
      'Anfall im Anfallsprotokoll des Kindes dokumentieren (Beginn, Dauer, Verlauf, Medikation).',
      'Mitschüler:innen altersgerecht auffangen – kurz erklären, entdramatisieren.',
    ],
    checklist: ['Anfallsbeginn notiert', 'Umgebung gesichert', 'Notfallplan angewendet', 'Medikationsgabe dokumentiert', '144 beurteilt', 'Eltern informiert', 'Anfallsprotokoll ergänzt'],
  },
  {
    id: 'sc-allergie', icon: 'stethoscope', title: 'Allergische Reaktion / Anaphylaxie', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144', 'ec-145'],
    instructions: [
      'Kontakt mit dem Auslöser sofort beenden (Essen weg, Stachel entfernen).',
      'Allergie-Notfallplan des Kindes holen – er hängt im Klassenordner/Sekretariat.',
      'Schulsanität per App alarmieren.',
      'Atemnot, Schwellung im Gesicht oder Kreislaufprobleme? Adrenalin-Autoinjektor (EpiPen) in den äusseren Oberschenkel – nur instruierte Personen – und sofort 144.',
      'Hinlegen, Beine hoch; bei Atemnot sitzend lagern. Zudecken und beruhigen.',
      'Zweite Dosis nach 5–10 Minuten, wenn keine Besserung und zweiter Pen vorhanden.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte sofort informieren – nach EpiPen-Gabe immer Spitalkontrolle.',
      'Verabreichte Medikation mit Uhrzeit dokumentieren, Pen ersetzen lassen.',
      'Auslöser-Abklärung mit Küche und Umfeld einleiten (Menüplan, Znüni-Regeln).',
    ],
    checklist: ['Auslöser entfernt', 'Notfallplan angewendet', 'EpiPen dokumentiert', '144 alarmiert', 'Eltern informiert', 'Pen ersetzt', 'Auslöser abgeklärt'],
  },
  {
    id: 'sc-vermisst', icon: 'search', title: 'Vermisste:r Schüler:in / Weglaufen', category: 'Schüler:innen', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-alle'], contactIds: ['ec-117'],
    instructions: [
      'Uhrzeit notieren: Wann und wo wurde das Kind zuletzt gesehen?',
      'Suchalarm in der App auslösen – alle am Standort erhalten Beschreibung und Auftrag.',
      'Beschreibung durchgeben: Kleidung, Aussehen, Verhaltensmuster (Weglauftendenz, reagiert nicht auf Zuruf, Lieblingsorte).',
      'Gefahrenstellen zuerst absuchen: Strasse, Bushaltestelle, Gewässer, Bahngleise.',
      'Danach systematisch: Gebäude (WC, Verstecke, Keller), Aussenareal, bekannte Rückzugsorte.',
      'Aufsicht der übrigen Kinder lückenlos sicherstellen, bevor Personal zur Suche abgezogen wird.',
      'Nach spätestens 15 Minuten ohne Erfolg: Polizei 117 anrufen – nicht länger warten.',
    ],
    followUp: [
      'Schulleitung informiert die Eltern/Erziehungsberechtigten parallel zur Suche.',
      'Suchprotokoll führen: wer sucht wo, mit Zeitangabe – Doppelspurigkeit vermeiden.',
      'Nach dem Auffinden: kurz medizinisch prüfen, ruhig zurückbegleiten – keine Vorwürfe im Moment der Rückkehr.',
      'Vorfall auswerten: Aufsichtskonzept und individuelle Weglaufprävention anpassen.',
    ],
    checklist: ['Letzter Standort + Zeit erfasst', 'Suchalarm ausgelöst', 'Beschreibung verteilt', 'Gefahrenstellen abgesucht', 'Aufsicht geregelt', '117 nach 15 Min.', 'Eltern informiert', 'Suchprotokoll geführt'],
  },
  {
    id: 'sc-gewalt', icon: 'hand', title: 'Herausforderndes Verhalten / Eskalation', category: 'Schüler:innen', priority: 'mittel', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-paed', 'gr-sicherheit'], contactIds: ['ec-117'],
    instructions: [
      'Ruhig bleiben: Abstand halten, langsame Bewegungen, wenig Worte.',
      'Stillen Alarm in der App auslösen – das Deeskalationsteam kommt ohne Aufsehen.',
      'Bekannte Strategien aus dem Verhaltensplan des Kindes anwenden (Reizreduktion, Alternativen anbieten).',
      'Andere Kinder ruhig aus dem Raum begleiten – eine zweite Person übernimmt sie.',
      'Gefährliche Gegenstände ausser Reichweite bringen, Fluchtweg für alle offen halten.',
      'Festhalten nur als letztes Mittel bei akuter Gefahr, nur durch geschulte Personen, so kurz und schonend wie möglich.',
    ],
    followUp: [
      'Mit dem Kind nachbesprechen, sobald es ruhig ist – Beziehung vor Aufarbeitung.',
      'Vorfall im Verlaufsjournal dokumentieren: Auslöser, Verlauf, Intervention, Dauer.',
      'Eltern informieren; Verhaltensplan im Fachteam überprüfen und anpassen.',
      'Beteiligte Mitarbeitende entlasten (Kurzintervision am selben Tag).',
    ],
    checklist: ['Stiller Alarm ausgelöst', 'Deeskalationsteam vor Ort', 'Mitschüler:innen in Sicherheit', 'Intervention dokumentiert', 'Eltern informiert', 'Verhaltensplan überprüft', 'Team entlastet'],
  },
  {
    id: 'sc-amok', icon: 'shield-alert', title: 'Amok / Bedrohungslage', category: 'Sicherheit', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-alle'], contactIds: ['ec-117'],
    instructions: [
      'Raus nur, wenn der Weg sicher frei ist – sonst: Raum verriegeln.',
      'Tür abschliessen oder verbarrikadieren (Pulte, Schränke), Licht aus, weg vom Fenster, auf den Boden.',
      'Stillen Alarm in der App auslösen – alle am Standort werden lautlos gewarnt.',
      'Geräte stumm schalten. Kinder leise halten – bekannte Beruhigungsrituale nutzen, Körperkontakt zulassen.',
      'Polizei 117 anrufen, sobald gefahrlos möglich: Standort, Täterbeschreibung, letzter bekannter Aufenthaltsort.',
      'Tür erst öffnen, wenn sich die Polizei eindeutig zu erkennen gibt.',
    ],
    followUp: [
      'Sammlung und Zählung erst nach Freigabe durch die Polizei.',
      'Eltern ausschliesslich über den offiziellen Kanal der Schulleitung informieren – keine Einzelauskünfte.',
      'Care-Team/Notfallpsychologie für Kinder und Mitarbeitende aufbieten.',
      'Medienanfragen ohne Ausnahme an die Schulleitung verweisen.',
    ],
    checklist: ['Raum verriegelt/verdunkelt', 'Stiller Alarm ausgelöst', '117 informiert', 'Kinder leise + betreut', 'Zählung nach Freigabe', 'Care-Team aufgeboten', 'Kommunikation gebündelt'],
  },
  {
    id: 'sc-bombe', icon: 'bomb', title: 'Bombendrohung', category: 'Sicherheit', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-krisenstab', 'gr-sicherheit'], contactIds: ['ec-117'],
    instructions: [
      'Anruf ernst nehmen und in die Länge ziehen – nicht auflegen.',
      'Parallel notieren: exakter Wortlaut, Stimme, Sprache, Hintergrundgeräusche, angedrohter Ort/Zeitpunkt (Drohungsprotokoll liegt beim Telefon).',
      'Nach dem Anruf: Polizei 117 anrufen und Krisenstab per App aufbieten.',
      'Keine eigenmächtige Evakuierung und keine Durchsagen – Entscheid trifft der Krisenstab mit der Polizei.',
      'Verdächtige Gegenstände nicht berühren, nicht bewegen, Umgebung freihalten.',
      'Mobilfunkgeräte in der Nähe verdächtiger Gegenstände nicht benutzen.',
    ],
    followUp: [
      'Entscheid Evakuierung/Durchsuchung gemeinsam mit der Polizei umsetzen (dann Ablauf «Evakuierung Schulhaus»).',
      'Eltern nach Lagebeurteilung offiziell durch die Schulleitung informieren.',
      'Drohungsprotokoll und Ereignisjournal der Polizei übergeben.',
    ],
    checklist: ['Drohungsprotokoll ausgefüllt', '117 informiert', 'Krisenstab quittiert', 'Keine eigenmächtige Räumung', 'Entscheid dokumentiert', 'Eltern informiert'],
  },
  {
    id: 'sc-person', icon: 'lock-open', title: 'Verdächtige Person auf dem Areal', category: 'Sicherheit', priority: 'mittel', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-sicherheit'], contactIds: ['ec-117'],
    instructions: [
      'Person freundlich ansprechen: «Grüezi, kann ich Ihnen helfen?» – nur zu zweit, kein Risiko eingehen.',
      'Hausdienst/Empfang still per App alarmieren.',
      'Kinder unauffällig auf Distanz bringen – Gruppen ins Gebäude begleiten, Türen schliessen.',
      'Verweigert die Person Auskunft oder wirkt sie bedrohlich: Abstand halten, 117 anrufen, nicht festhalten.',
      'Merkmale notieren: Aussehen, Kleidung, Fahrzeug mit Kennzeichen, Fluchtrichtung.',
    ],
    followUp: [
      'Vorfall der Schulleitung melden und dokumentieren.',
      'Bei Wiederholung: Zutrittskonzept und Arealüberwachung überprüfen.',
      'Team am Standort über den Vorfall und die Merkmale informieren.',
    ],
    checklist: ['Person angesprochen (zu zweit)', 'Hausdienst alarmiert', 'Kinder in Sicherheit', '117 beurteilt/alarmiert', 'Merkmale notiert', 'Vorfall dokumentiert'],
  },
  {
    id: 'sc-transport', icon: 'bus', title: 'Unfall Schülertransport', category: 'Schüler:innen', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'voice'], responsibleGroupIds: ['gr-krisenstab', 'gr-ersthelfer'], contactIds: ['ec-144', 'ec-117'],
    instructions: [
      'Warnblinker ein, Pannendreieck stellen, Warnweste an – Unfallstelle sichern.',
      'Kinder im Fahrzeug lassen, wenn dort sicher; sonst hinter die Leitplanke, nie auf die Fahrbahn.',
      'Verletzte versorgen: 144 anrufen (Standort, Anzahl Kinder, Zustand).',
      'Bei Blechschaden oder blockierter Strasse zusätzlich 117.',
      'Schule per App alarmieren: Standort, welche Kinder betroffen, was wird gebraucht.',
      'Alle Kinder anhand der Transportliste zählen – niemand verlässt die Gruppe.',
    ],
    followUp: [
      'Schulleitung informiert die Eltern aller betroffenen Kinder persönlich.',
      'Ersatztransport und Betreuung vor Ort organisieren (Krisenstab).',
      'Spitalbegleitung sicherstellen, Übergabe an Eltern dokumentieren.',
      'Transportunternehmen und Versicherung melden; Kinder in den Folgetagen auf Fahrangst achten.',
    ],
    checklist: ['Unfallstelle gesichert', '144/117 alarmiert', 'Schule informiert', 'Transportliste abgeglichen', 'Eltern informiert', 'Ersatztransport organisiert', 'Nachbetreuung geplant'],
  },
  {
    id: 'sc-medikament', icon: 'pill', title: 'Medikamenten-Zwischenfall', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer', 'gr-krisenstab'], contactIds: ['ec-145', 'ec-144'],
    instructions: [
      'Was ist passiert? Falsches Medikament, falsche Dosis, falsches Kind, vergessene Gabe oder fremde Einnahme – sofort melden, nicht vertuschen.',
      'Medikamentenpackung/Blister sicherstellen – nichts wegwerfen.',
      'Tox Info Suisse 145 anrufen: Präparat, Dosis, Zeitpunkt, Gewicht des Kindes bereithalten.',
      'Anweisungen von Tox Info exakt befolgen – kein Erbrechen auslösen, nichts einflössen.',
      'Kind lückenlos beobachten (Bewusstsein, Atmung, Haut) – bei Symptomen sofort 144.',
      'Schulsanität per App beiziehen.',
    ],
    followUp: [
      'Eltern und behandelnde Ärztin/Arzt am selben Tag informieren.',
      'Zwischenfall im Medikamentenjournal dokumentieren (wer, was, wann, Massnahmen).',
      'Abgabeprozess prüfen: Vier-Augen-Prinzip, Beschriftung, Aufbewahrung – Massnahmen festlegen.',
    ],
    checklist: ['145 kontaktiert', 'Packung sichergestellt', 'Kind unter Beobachtung', '144 beurteilt', 'Eltern + Arzt informiert', 'Journal dokumentiert', 'Prozess angepasst'],
  },
  {
    id: 'sc-todesfall', icon: 'heart-crack', title: 'Todesfall in der Schulgemeinschaft', category: 'Organisation', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-krisenstab'], contactIds: ['ec-143', 'ec-147'],
    instructions: [
      'Nachricht zuerst verifizieren: nur Angehörige, Polizei oder Behörden gelten als Quelle.',
      'Krisenstab per App aufbieten – bis dahin keine Weitergabe der Information.',
      'Sprachregelung festlegen: ein Text für alle, keine Spekulationen, keine Details zur Todesursache.',
      'Mitarbeitende vor den Kindern informieren (kurze Teamsitzung).',
      'Klassen altersgerecht und der kognitiven Entwicklung entsprechend informieren: einfache Sprache, Bilder, Rituale – Bezugspersonen bleiben bei ihren Gruppen.',
      'Care-Team/Schulpsychologie für den ganzen Tag aufbieten.',
    ],
    followUp: [
      'Schulleitung nimmt Kontakt mit der betroffenen Familie auf (Beileid, Abstimmung der Kommunikation).',
      'Trauerort einrichten (Kerze, Foto, Zeichnungen) – Abschied in eigenem Tempo ermöglichen.',
      'Besonders betroffene Kinder und Mitarbeitende über Wochen im Blick behalten.',
      'Teilnahme an der Abdankung mit der Familie koordinieren.',
    ],
    checklist: ['Quelle verifiziert', 'Krisenstab quittiert', 'Sprachregelung festgelegt', 'Team zuerst informiert', 'Klassen begleitet informiert', 'Care-Team vor Ort', 'Familie kontaktiert', 'Trauerort eingerichtet'],
  },
  {
    id: 'sc-psych', icon: 'life-buoy', title: 'Akute psychische Krise / Suizidalität', category: 'Schüler:innen', priority: 'hoch', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-krisenstab', 'gr-paed'], contactIds: ['ec-144', 'ec-143', 'ec-147'],
    instructions: [
      'Bei der Person bleiben – sie ab jetzt keine Minute allein lassen.',
      'Äusserungen ernst nehmen, ruhig zuhören, nichts versprechen («Das wird schon») – direkte Fragen sind erlaubt und entlasten.',
      'Gefährliche Gegenstände und Medikamente unauffällig ausser Reichweite bringen.',
      'Still per App die Schulleitung/Fachperson beiziehen (Schulpsychologie/KJPP) – nicht selbst therapieren.',
      'Bei akuter Selbstgefährdung: 144 anrufen und die Person begleitet übergeben.',
    ],
    followUp: [
      'Eltern/Erziehungsberechtigte durch Fachperson oder Schulleitung einbeziehen.',
      'Übergabe an KJPP/Notfallpsychiatrie dokumentieren (wer, wann, an wen).',
      'Wiedereinstieg planen: Absprachen, Betreuungsplan, feste Ansprechperson, regelmässiges Monitoring.',
      'Klassenumfeld sensibilisieren, ohne Details preiszugeben.',
    ],
    checklist: ['Person begleitet (nie allein)', 'Gegenstände gesichert', 'Fachperson beigezogen', '144 beurteilt', 'Übergabe dokumentiert', 'Eltern einbezogen', 'Wiedereinstieg geplant'],
  },
  {
    id: 'sc-kindesschutz', icon: 'shield-alert', title: 'Kindesschutz – Verdacht auf Gefährdung', category: 'Schüler:innen', priority: 'mittel', silentDefault: true,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-krisenstab'], contactIds: ['ec-147'],
    instructions: [
      'Dem Kind ruhig zuhören, ernst nehmen – nichts versprechen, was nicht gehalten werden kann («Ich behalte das für mich» geht nicht).',
      'Keine Suggestivfragen, keine eigene Befragung, keine Konfrontation der mutmasslich beteiligten Personen.',
      'Beobachtungen sofort sachlich notieren: Datum, Situation, wörtliche Aussagen, sichtbare Anzeichen.',
      'Kindesschutzgruppe/Schulleitung still und vertraulich informieren – nicht im Lehrerzimmer besprechen.',
      'Bei akuter Gefahr für das Kind: Schulleitung entscheidet sofort über Polizei/KESB.',
    ],
    followUp: [
      'Kindesschutzgruppe beurteilt das Vorgehen: Fachstelle beiziehen, Gefährdungsmeldung an die KESB prüfen.',
      'Schutz und Normalität für das Kind im Schulalltag sicherstellen.',
      'Dokumentation vertraulich und revisionssicher ablegen – Zugriff nur für die Kindesschutzgruppe.',
    ],
    checklist: ['Zugehört, nichts versprochen', 'Beobachtungen dokumentiert', 'Kindesschutzgruppe informiert', 'Vertraulichkeit gewahrt', 'Vorgehen festgelegt', 'Schutz im Alltag geregelt'],
  },
  {
    id: 'sc-wasserunfall', icon: 'droplets', title: 'Notfall im Therapiebad', category: 'Gesundheit', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'voice'], responsibleGroupIds: ['gr-ersthelfer'], contactIds: ['ec-144'],
    instructions: [
      'Person sofort aus dem Wasser retten – Rettungshilfe (Stange/Ring) am Beckenrand nutzen, Eigenschutz beachten.',
      'Alarmknopf am Beckenrand drücken oder Schulsanität per App alarmieren.',
      'Alle anderen Kinder sofort aus dem Wasser – zweite Person beaufsichtigt sie ausserhalb des Bades.',
      'Bewusstsein und Atmung prüfen: keine normale Atmung? 144 anrufen und BLS-AED-Schema starten.',
      'Bei Atmung: stabile Seitenlage, zudecken (Auskühlung), lückenlos überwachen.',
      'Rettungsdienst am Eingang abholen und einweisen.',
    ],
    followUp: [
      'Eltern sofort informieren – nach jedem Beinahe-Ertrinken gilt: ärztliche Kontrolle, auch wenn es dem Kind gut geht.',
      'Unfallhergang dokumentieren (Aufsichtssituation, Zeitablauf).',
      'Badaufsichtskonzept überprüfen: Schlüssel Aufsicht/Kinder, Zuständigkeiten, Rettungsmittel.',
      'Beteiligte nachbetreuen.',
    ],
    checklist: ['Person gerettet', 'Alarm ausgelöst', 'Bad geräumt', '144/BLS-AED durchgeführt', 'Eltern informiert', 'Ärztliche Kontrolle veranlasst', 'Konzept überprüft'],
  },
  {
    id: 'sc-it', icon: 'server-crash', title: 'IT-Ausfall / Cyberangriff', category: 'Gebäude & Technik', priority: 'mittel', silentDefault: false,
    defaultChannels: ['push', 'email', 'teams'], responsibleGroupIds: ['gr-it'], contactIds: [],
    instructions: [
      'Verdacht auf Angriff (Erpressermeldung, gesperrte Dateien, seltsame Anmeldungen)? Gerät vom Netz trennen (LAN-Kabel ziehen, WLAN aus) – nicht ausschalten.',
      'IT-Support per App alarmieren – Screenshots und Uhrzeiten festhalten.',
      'Keine Passwörter mehr eingeben, keine Links aus verdächtigen Mails öffnen, Team warnen.',
      'Besonders schützen: Schülerdaten, Förderberichte, Gesundheitsdaten – betroffene Systeme benennen.',
      'Kommunikation auf Ersatzkanäle umstellen (Telefonketten, private Geräte nur für Organisatorisches).',
    ],
    followUp: [
      'Meldung an das NCSC; bei möglichem Abfluss von Personendaten Meldepflicht an den EDÖB prüfen (72 Stunden).',
      'Betroffene informieren, wenn Personendaten kompromittiert sein könnten.',
      'Wiederherstellung nur aus sauberen Backups; Passwörter flächendeckend zurücksetzen.',
      'Lessons Learned: Einfallstor schliessen, Schulung planen.',
    ],
    checklist: ['Systeme isoliert (nicht ausgeschaltet)', 'IT-Support alarmiert', 'Beweise gesichert', 'Datenlage beurteilt', 'Meldepflichten geprüft', 'Notbetrieb aktiv', 'Wiederherstellung aus Backup'],
  },
  {
    id: 'sc-strom', icon: 'zap-off', title: 'Stromausfall', category: 'Gebäude & Technik', priority: 'tief', silentDefault: false,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-sicherheit'], contactIds: [],
    instructions: [
      'Kinder beruhigen – Dunkelheit kann Ängste auslösen; Taschenlampen statt Kerzen.',
      'Hausdienst per App alarmieren – er prüft Sicherungen, Notbeleuchtung und Ursache.',
      'Aufzüge sofort kontrollieren: eingeschlossene Personen? Beruhigen, Hausdienst befreit oder ruft den Aufzugsdienst.',
      'Elektrische Hilfsmittel prüfen: Lifter, Pflegebetten, Kommunikationsgeräte – Akkustand sichern, Prioritäten setzen.',
      'Bei grossflächigem Ausfall: Energieversorger kontaktieren, Dauer erfragen.',
    ],
    followUp: [
      'Bei längerem Ausfall: Unterricht anpassen, warme Räume bündeln, Schulleitung entscheidet über vorzeitige Abholung.',
      'Kühlketten prüfen (Küche, Medikamente im Kühlschrank) und dokumentieren.',
      'Nach Wiederkehr: Anlagen kontrolliert hochfahren, Uhren/Anlagen zurückstellen.',
    ],
    checklist: ['Hausdienst alarmiert', 'Aufzüge geprüft', 'Akku-Hilfsmittel gesichert', 'Versorger kontaktiert', 'Kühlketten geprüft', 'Eltern informiert (bei Bedarf)'],
  },
  {
    id: 'sc-wasser', icon: 'droplets', title: 'Wasserschaden', category: 'Gebäude & Technik', priority: 'tief', silentDefault: false,
    defaultChannels: ['push'], responsibleGroupIds: ['gr-sicherheit'], contactIds: ['ec-118'],
    instructions: [
      'Personen aus dem betroffenen Bereich – Rutsch- und Stromschlaggefahr.',
      'Strom im betroffenen Bereich abschalten (Sicherung), bevor jemand ins Wasser tritt.',
      'Wasserzufuhr stoppen: Absperrhahn im Raum oder Haupthahn (Technikraum UG).',
      'Hausdienst per App alarmieren, Bereich absperren.',
      'Wertvolles und Wichtiges hochstellen oder wegräumen (Akten, Geräte, Therapiehilfsmittel).',
      'Bei grossem Wassereinbruch: Feuerwehr 118 (Wasserwehr) anrufen.',
    ],
    followUp: [
      'Unterricht in Ersatzräume verlegen, Raumbelegung anpassen.',
      'Trocknungsfirma und Gebäudeversicherung aufbieten, Schaden fotografieren.',
      'Ursache beheben lassen und Kontrolle nach einer Woche einplanen (Schimmel).',
    ],
    checklist: ['Bereich geräumt', 'Strom getrennt', 'Wasser gestoppt', 'Hausdienst vor Ort', 'Schaden dokumentiert', 'Versicherung gemeldet', 'Räume verlegt'],
  },
  {
    id: 'sc-unwetter', icon: 'cloud-lightning', title: 'Unwetter / Sturm', category: 'Naturereignis', priority: 'mittel', silentDefault: false,
    defaultChannels: ['push', 'sms'], responsibleGroupIds: ['gr-sicherheit', 'gr-alle'], contactIds: [],
    instructions: [
      'Alle nach drinnen – Pausen, Sport und Ausflüge im Freien sofort abbrechen.',
      'Warnung per App an den Standort senden, damit alle Gruppen reagieren.',
      'Fenster und Türen schliessen, Storen einfahren (Windbruch), von grossen Fensterflächen fernhalten.',
      'Lose Gegenstände im Aussenbereich sichern: Spielgeräte, Sonnenschirme, Abfalleimer.',
      'Wetterlage verfolgen (MeteoSchweiz-App) – Entwarnung abwarten.',
      'Schülertransporte prüfen: Abfahrten verschieben, Fahrer und Eltern informieren.',
    ],
    followUp: [
      'Areal erst nach Entwarnung kontrollieren: Äste, Dachteile, Leitungen – Gefahrenstellen absperren.',
      'Heimweg der Kinder koordinieren (Transport, Begleitung, Abholung).',
      'Schäden dokumentieren und der Versicherung melden.',
    ],
    checklist: ['Alle im Gebäude', 'Warnung versendet', 'Gebäude gesichert', 'Aussenbereich gesichert', 'Transporte koordiniert', 'Areal nach Entwarnung geprüft'],
  },
  {
    id: 'sc-pandemie', icon: 'biohazard', title: 'Pandemie / Infektionsfall', category: 'Gesundheit', priority: 'mittel', silentDefault: false,
    defaultChannels: ['push', 'email'], responsibleGroupIds: ['gr-krisenstab'], contactIds: [],
    instructions: [
      'Erkrankte Person freundlich separieren (Sanitätszimmer) und betreuen – nicht allein lassen.',
      'Krisenstab per App informieren – er koordiniert Massnahmen und Kommunikation.',
      'Hygiene sofort verschärfen: Hände waschen, Flächen desinfizieren, regelmässig lüften.',
      'Kontaktpersonen ermitteln – besonders vulnerable Kinder (Grunderkrankungen) zuerst schützen.',
      'Vorgaben von BAG und Kantonsarzt einholen und exakt umsetzen.',
      'Abholung durch die Eltern organisieren.',
    ],
    followUp: [
      'Eltern des Standorts sachlich über Lage und Massnahmen informieren (ohne Namen).',
      'Absenzen täglich monitoren – bei Häufung Kantonsarzt kontaktieren.',
      'Fernbetreuungs-/Unterrichtskonzept bereithalten und bei Bedarf aktivieren.',
    ],
    checklist: ['Person separiert + betreut', 'Krisenstab informiert', 'Hygienekonzept aktiv', 'Kontakte ermittelt', 'Behördenvorgaben umgesetzt', 'Eltern informiert', 'Absenzenmonitoring läuft'],
  },
  {
    id: 'sc-krise', icon: 'users', title: 'Krisenstab einberufen', category: 'Organisation', priority: 'hoch', silentDefault: false,
    defaultChannels: ['push', 'sms', 'voice', 'conference'], responsibleGroupIds: ['gr-krisenstab'], contactIds: [],
    instructions: [
      'Krisenstab per App aufbieten – mit Quittierung, damit sofort klar ist, wer kommt.',
      'Krisenraum im Hauptsitz Baar beziehen: Lagekarte, Telefonlisten, Schülerlisten, Ereignisjournal bereitlegen.',
      'Erste Lagebeurteilung in 10 Minuten: Was ist passiert? Wer ist betroffen? Was ist die grösste Gefahr? Was muss sofort geschehen?',
      'Rollen verteilen: Leitung, Lage/Journal, Kommunikation intern, Kommunikation Eltern/Medien, Betreuung.',
      'Sprachregelung festlegen – eine Stimme nach aussen (Schulleitung).',
      'Sofortmassnahmen beschliessen, Aufträge mit Zeit und Verantwortlichkeit ins Journal.',
    ],
    followUp: [
      'Feste Rapport-Zeiten vereinbaren (z. B. stündlich) und einhalten.',
      'Elterninformation über den offiziellen Kanal, Medienanfragen nur über die Leitung.',
      'Einsatz nachbereiten: Debriefing innert 48 Stunden, Massnahmenliste, Konzept anpassen.',
    ],
    checklist: ['Krisenstab quittiert', 'Krisenraum bezogen', 'Lagebeurteilung erstellt', 'Rollen verteilt', 'Sprachregelung festgelegt', 'Journal geführt', 'Rapporte terminiert', 'Debriefing geplant'],
  },
]

export const SEED_LOCATIONS: Location[] = [
  {
    id: 'loc-baar', name: 'Hauptsitz Baar', address: 'SONNENBERG Kompetenzzentrum, 6340 Baar',
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
    mode: 'demo',
    scenarioContentVersion: SCENARIO_CONTENT_VERSION,
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
      { id: 'a-1', ts: Date.now() - 3600_000, type: 'system', message: 'System initialisiert – Alarmserver für SONNENBERG Kompetenzzentrum betriebsbereit (Cloud-Hosting Schweiz).' },
    ],
  }
}

/**
 * Live-Modus: echter Datenbestand ohne Mock-Daten.
 * Behalten wird nur reale Grundkonfiguration (Szenarien, Standorte, Gruppenstruktur,
 * Notrufnummern, Alarmplan-Vorlagen) plus ein Admin-Konto. Keine Beispiel-Benutzer,
 * -Alarme, -Alarmknöpfe, -Webhooks oder -Zugangscodes; alle Integrationen deaktiviert.
 */
export function createLiveInitialState(): AppState {
  return {
    mode: 'live',
    scenarioContentVersion: SCENARIO_CONTENT_VERSION,
    currentUserId: 'u-admin',
    users: [
      {
        id: 'u-admin', firstName: 'Stefan', lastName: 'Gross', email: 'stefan.gross@sonnenberg-baar.ch',
        phone: '', role: 'admin', groupIds: ['gr-krisenstab', 'gr-alle'], locationId: 'loc-baar', language: 'de',
      },
    ],
    groups: SEED_GROUPS,
    locations: SEED_LOCATIONS,
    scenarios: SEED_SCENARIOS,
    plans: SEED_PLANS,
    alarms: [],
    buttons: [],
    loneWorkSessions: [],
    integrations: {
      smsGateway: { enabled: false, provider: '', senderId: 'SONNENBERG' },
      voip: { enabled: false, sipServer: '' },
      teams: { enabled: false, tenant: '' },
      sso: { enabled: false, provider: 'Microsoft Entra ID / SAML 2.0', entityId: '' },
      hrSync: { enabled: false, system: '' },
      hotline: { enabled: false, number: '' },
      multiLanguage: true,
      geofencing: false,
      webhooks: [],
      accessCodes: [],
    },
    contacts: SEED_CONTACTS,
    audit: [
      { id: 'a-live-1', ts: Date.now(), type: 'system', message: 'Live-Modus initialisiert – Datenbestand ohne Demo-Daten. Versand-Gateways unter Integrationen anbinden.' },
    ],
  }
}
