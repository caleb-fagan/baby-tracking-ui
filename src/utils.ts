const pad = (n: number) => String(n).padStart(2, '0')

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Epoch ms as local "YYYY-MM-DDTHH:mm". */
export function toLocalString(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Current local time as "YYYY-MM-DDTHH:mm". */
export function nowLocal(): string {
  return toLocalString(Date.now())
}

/** Seconds as "m:ss" (or "h:mm:ss" past an hour). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

/** Current local date as "YYYY-MM-DD". */
export function todayLocal(): string {
  return nowLocal().slice(0, 10)
}

export function isToday(dateTime: string): boolean {
  return dateTime.slice(0, 10) === todayLocal()
}

export function formatDateTime(dateTime: string): string {
  const d = new Date(dateTime)
  if (isNaN(d.getTime())) return dateTime
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00')
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function timeAgo(dateTime: string): string {
  const mins = minutesBetween(dateTime, nowLocal())
  if (new Date(dateTime).getTime() > Date.now()) return 'just now'
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${formatDuration(mins)} ago`
  return `${Math.floor(mins / (60 * 24))}d ago`
}

export function babyAge(birthDate: string): string {
  if (!birthDate) return ''
  const born = new Date(birthDate + 'T00:00')
  const now = new Date()
  if (isNaN(born.getTime()) || born > now) return ''
  let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth())
  if (now.getDate() < born.getDate()) months--
  if (months >= 1) {
    const years = Math.floor(months / 12)
    const rem = months % 12
    if (years === 0) return `${months} month${months === 1 ? '' : 's'} old`
    return `${years}y ${rem}m old`
  }
  const days = Math.floor((now.getTime() - born.getTime()) / 86400000)
  const weeks = Math.floor(days / 7)
  return weeks >= 1 ? `${weeks} week${weeks === 1 ? '' : 's'} old` : `${days} day${days === 1 ? '' : 's'} old`
}

export function removeById<T extends { id: string }>(list: T[], id: string): void {
  const i = list.findIndex((x) => x.id === id)
  if (i !== -1) list.splice(i, 1)
}

export function newestFirst<T>(list: T[], key: (item: T) => string): T[] {
  return [...list].sort((a, b) => key(b).localeCompare(key(a)))
}
