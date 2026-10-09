import { reactive, watch } from 'vue'
import type { AppState } from './types'

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

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const base = defaults()
      delete saved.sleepTimer // the sleep timer was removed
      // drop a timer saved in the older shape
      if (saved.breastTimer && typeof saved.breastTimer.elapsedMs !== 'number') saved.breastTimer = null
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
