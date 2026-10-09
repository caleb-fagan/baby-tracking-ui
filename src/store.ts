import { reactive, watch } from 'vue'
import type { AppState } from './types'
import { isLegacyLocal, localToUtc } from './utils'

const STORAGE_KEY = 'baby-tracker-v1'

function defaults(): AppState {
  return {
    baby: { name: '', birthDate: '', gender: '' },
    milk: [],
    solids: [],
    sleep: [],
    diapers: [],
    growth: [],
    breastTimer: null,
  }
}

/**
 * Timestamps used to be saved as local "YYYY-MM-DDTHH:mm" strings; they are now UTC ISO strings.
 * Convert any legacy values in place (already-converted values are left alone, so this is idempotent).
 */
function migrateTimestampsToUtc(saved: Record<string, unknown>): void {
  const fix = (entry: Record<string, unknown>, field: string) => {
    const value = entry[field]
    if (typeof value === 'string' && isLegacyLocal(value)) entry[field] = localToUtc(value)
  }
  const fields: Record<string, string[]> = {
    milk: ['time'],
    solids: ['time'],
    diapers: ['time'],
    sleep: ['start', 'end'],
  }
  for (const [key, names] of Object.entries(fields)) {
    const list = saved[key]
    if (!Array.isArray(list)) continue
    for (const entry of list) for (const name of names) fix(entry, name)
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const base = defaults()
      migrateTimestampsToUtc(saved)
      delete saved.sleepTimer // the sleep timer was removed
      // drop a timer saved in the older shape
      if (saved.breastTimer && typeof saved.breastTimer.elapsedMs !== 'number')
        saved.breastTimer = null
      // merge baby separately so profiles saved before new fields existed still get their defaults
      return { ...base, ...saved, baby: { ...base.baby, ...saved.baby } }
    }
  } catch {
    // corrupted or unavailable storage: start fresh
  }
  return defaults()
}

export const state = reactive<AppState>(load())

watch(
  state,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable: keep working in memory
    }
  },
  { deep: true },
)

export function clearAllData(): void {
  Object.assign(state, defaults())
}
