const LOCALE = 'es-GT'

/** 5464202432 → "5.1 GB" (base 1024, como Windows). */
export function bytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = n
  let unit = 0
  while (Math.abs(value) >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1
  return `${value.toLocaleString(LOCALE, { maximumFractionDigits: digits })} ${units[unit]}`
}

export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

/** "hace 40 s", "hace 3 min", "hace 2 h", "hace 5 d" */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (s < 60) return `hace ${s} s`
  if (s < 3600) return `hace ${Math.round(s / 60)} min`
  if (s < 86_400) return `hace ${Math.round(s / 3600)} h`
  return `hace ${Math.round(s / 86_400)} d`
}

export function every(minutes: number): string {
  return minutes >= 60 ? `cada ${minutes / 60} h` : `cada ${minutes} min`
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** "hoy 07:09", "ayer 20:02" o "28 sep 14:00": la hora sola no basta en una lista de varios días. */
export function dayTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  const day =
    days === 0
      ? 'hoy'
      : days === 1
        ? 'ayer'
        : date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }).replace('.', '')
  return `${day} ${timeOf(iso)}`
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
