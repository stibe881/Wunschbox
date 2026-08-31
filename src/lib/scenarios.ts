import type { Scenario } from '../types'

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
