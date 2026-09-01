import type { ResponseStep, Scenario } from '../types'

/**
 * Nur aktive Szenarien erscheinen in der App und bei der Alarmauslösung.
 * Ältere Datenbestände kennen das Feld nicht – dort gilt alles als aktiv.
 */
export function isActive(scenario: Scenario): boolean {
  return scenario.active !== false
}

export function activeScenarios(scenarios: Scenario[]): Scenario[] {
  return scenarios.filter(isActive)
}

/**
 * Schritte für Empfänger:innen – aus dem neuen Feld, oder aus dem alten ohne
 * Gruppenzuordnung, falls ein selbst erstelltes Szenario noch so gespeichert ist.
 */
export function responseStepsOf(scenario: Scenario): ResponseStep[] {
  if (scenario.responseSteps?.length) return scenario.responseSteps
  return (scenario.responseInstructions ?? []).map((text) => ({ text }))
}

/**
 * Was eine bestimmte Person tut: Schritte ohne Gruppen gelten für alle, die
 * übrigen nur für Mitglieder der genannten Gruppen. «andere» bleibt einsehbar,
 * damit man weiss, was die Kolleg:innen gerade tun.
 */
export function responseStepsFor(scenario: Scenario, groupIds: string[]): { eigene: ResponseStep[]; andere: ResponseStep[] } {
  const eigene: ResponseStep[] = []
  const andere: ResponseStep[] = []
  for (const schritt of responseStepsOf(scenario)) {
    const fuerAlle = !schritt.groupIds || schritt.groupIds.length === 0
    if (fuerAlle || schritt.groupIds!.some((g) => groupIds.includes(g))) eigene.push(schritt)
    else andere.push(schritt)
  }
  return { eigene, andere }
}
