/*
 * Browser notifications for friend reactions. Everything happens on this
 * device: the notification is shown by the browser, nothing is sent to a
 * server. Only used while the tab is in the background, so the in-app toast
 * covers the foreground case.
 */

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

/** Ask for permission. Must be called from a click or submit handler. */
export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

/** Show a notification if allowed and the app is not in front of the user. */
export function notify(body: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'producti-friends' }
  // Phones need the service worker to show notifications; desktop can do it directly.
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => reg.showNotification('Producti', options)).catch(() => {})
  } else {
    try {
      new Notification('Producti', options)
    } catch {
      // Some browsers only allow service-worker notifications; skip quietly.
    }
  }
}
