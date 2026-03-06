const DEVICE_UUID_KEY = 'bikeoasis.device_uuid'

export function getOrCreateDeviceUuid() {
  if (typeof window === 'undefined') {
    return 'server-device'
  }

  const stored = window.localStorage.getItem(DEVICE_UUID_KEY)
  if (stored) {
    return stored
  }

  const next =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`

  window.localStorage.setItem(DEVICE_UUID_KEY, next)
  return next
}
