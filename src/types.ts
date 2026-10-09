export type Gender = '' | 'girl' | 'boy'

export interface BabyProfile {
  name: string
  birthDate: string // YYYY-MM-DD
  gender: Gender
}

// All timestamps are local "YYYY-MM-DDTHH:mm" strings (the format <input type="datetime-local"> uses).

export type MilkType = 'breast' | 'pumped' | 'formula'

export interface MilkFeeding {
  id: string
  time: string
  type: MilkType
  amountMl?: number // pumped / formula
  durationMin?: number // breast
  notes: string
}

export type Reaction = 'loved' | 'ok' | 'disliked' | 'allergic'

export interface SolidFeeding {
  id: string
  time: string
  food: string
  amount: string
  reaction: Reaction
  notes: string
}

export type SleepKind = 'nap' | 'night'

export interface SleepEntry {
  id: string
  start: string
  end: string // empty while the baby is still asleep
  kind: SleepKind
  notes: string
}

export type DiaperKind = 'wet' | 'dirty' | 'both'

export interface DiaperEntry {
  id: string
  time: string
  kind: DiaperKind
  notes: string
}

export interface GrowthEntry {
  id: string
  date: string // YYYY-MM-DD
  weightKg?: number
  heightCm?: number
  headCm?: number
  notes: string
}

/**
 * Pausable stopwatch, kept in state so it survives page reloads.
 * Elapsed time = elapsedMs + (now - runningSince) while running; runningSince is null when paused.
 */
export interface Stopwatch {
  startedAt: number
  elapsedMs: number
  runningSince: number | null
}

export interface AppState {
  baby: BabyProfile
  milk: MilkFeeding[]
  solids: SolidFeeding[]
  sleep: SleepEntry[]
  diapers: DiaperEntry[]
  growth: GrowthEntry[]
  breastTimer: Stopwatch | null
}
