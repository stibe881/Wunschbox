import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

// Benachrichtigungen auch anzeigen, wenn die App im Vordergrund ist
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function ensurePermissions(): Promise<boolean> {
  if (!Device.isDevice) return false
  try {
    const current = await Notifications.getPermissionsAsync()
    if (current.granted) return true
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    })
    return requested.granted
  } catch {
    return false
  }
}

/** Sofortige lokale Benachrichtigung (z. B. Alarm ausgelöst) */
export async function notifyNow(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    })
  } catch {
    // ohne Berechtigung kein Banner – App-Anzeige reicht
  }
}

/** Lokale Benachrichtigung zu einem Zeitpunkt planen (z. B. Timer-Ablauf) */
export async function scheduleAt(title: string, body: string, timestamp: number): Promise<string | null> {
  if (timestamp <= Date.now()) return null
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(timestamp) },
    })
  } catch {
    return null
  }
}

export async function cancelScheduled(ids: (string | null)[]) {
  for (const id of ids) {
    if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  }
}

/** Remote-Push: in Expo Go seit SDK 53 nicht verfügbar – erst im Development-/Store-Build */
export function remotePushAvailability(): { ok: boolean; reason?: string } {
  if (!Device.isDevice) {
    return { ok: false, reason: 'Simulator – Push nur auf echten Geräten.' }
  }
  if (Constants.appOwnership === 'expo') {
    return {
      ok: false,
      reason: 'Expo Go unterstützt keine Remote-Pushs (seit SDK 53). Lokale Benachrichtigungen (Timer, SOS) funktionieren. Für echte Pushs: Development-Build via «eas build».',
    }
  }
  return { ok: true }
}

/** Expo-Push-Token holen (für Versand über Expos Push-Dienst) */
export async function getPushToken(): Promise<string | null> {
  try {
    const projectId: string | undefined =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined
    if (!projectId) return null
    const token = await Notifications.getExpoPushTokenAsync({ projectId })
    return token.data
  } catch {
    return null
  }
}
