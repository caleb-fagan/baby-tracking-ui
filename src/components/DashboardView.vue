<script setup lang="ts">
import { computed } from 'vue'
import { clearAllData, state } from '../store'
import { babyAge, formatDateTime, formatDuration, isToday, minutesBetween, timeAgo } from '../utils'

defineEmits<{ navigate: [tab: string] }>()

const stats = computed(() => {
  const milk = state.milk.filter((m) => isToday(m.time))
  const solids = state.solids.filter((s) => isToday(s.time))
  const sleep = state.sleep.filter((s) => isToday(s.start) && s.end)
  const diapers = state.diapers.filter((d) => isToday(d.time))
  return {
    milkCount: milk.length,
    milkMl: milk.reduce((sum, m) => sum + (m.amountMl ?? 0), 0),
    solidsCount: solids.length,
    sleepMin: sleep.reduce((sum, s) => sum + minutesBetween(s.start, s.end), 0),
    diaperCount: diapers.length,
    wet: diapers.filter((d) => d.kind !== 'dirty').length,
    dirty: diapers.filter((d) => d.kind !== 'wet').length,
  }
})

function latest(times: string[]): string {
  if (!times.length) return 'Nothing logged yet'
  const sorted = [...times].sort()
  return timeAgo(sorted[sorted.length - 1])
}

const lastMilk = computed(() => latest(state.milk.map((m) => m.time)))
const lastSolid = computed(() => latest(state.solids.map((s) => s.time)))
const lastSleep = computed(() => latest(state.sleep.map((s) => s.end || s.start)))
const lastDiaper = computed(() => latest(state.diapers.map((d) => d.time)))

const sleepingNow = computed(() => state.sleep.some((s) => !s.end))

const recent = computed(() => {
  const items = [
    ...state.milk.map((m) => ({
      time: m.time,
      icon: m.type === 'breast' ? '🤱' : '🍼',
      text: m.type === 'breast' ? 'Breastfed' : `Milk (${m.type})`,
    })),
    ...state.solids.map((s) => ({ time: s.time, icon: '🥣', text: `Ate ${s.food}` })),
    ...state.sleep.map((s) => ({
      time: s.start,
      icon: '😴',
      text: s.end ? `Slept ${formatDuration(minutesBetween(s.start, s.end))}` : 'Fell asleep',
    })),
    ...state.diapers.map((d) => ({ time: d.time, icon: '🧷', text: `Diaper (${d.kind})` })),
  ]
  return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8)
})

function confirmClear() {
  if (window.confirm('Delete ALL tracked data and the baby profile? This cannot be undone.'))
    clearAllData()
}
</script>

<template>
  <div>
    <section class="card">
      <h2>Today at a glance</h2>
      <p v-if="sleepingNow" class="meta">😴 Baby is currently sleeping.</p>
      <div class="stat-grid">
        <div class="stat milk">
          <div class="label">🍼 Milk</div>
          <div class="value">{{ stats.milkCount }}</div>
          <div class="sub">{{ stats.milkMl }} ml · last {{ lastMilk }}</div>
        </div>
        <div class="stat solids">
          <div class="label">🥣 Solids</div>
          <div class="value">{{ stats.solidsCount }}</div>
          <div class="sub">last {{ lastSolid }}</div>
        </div>
        <div class="stat sleep">
          <div class="label">😴 Sleep</div>
          <div class="value">{{ formatDuration(stats.sleepMin) }}</div>
          <div class="sub">last {{ lastSleep }}</div>
        </div>
        <div class="stat diapers">
          <div class="label">🧷 Diapers</div>
          <div class="value">{{ stats.diaperCount }}</div>
          <div class="sub">
            {{ stats.wet }} wet · {{ stats.dirty }} dirty · last {{ lastDiaper }}
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Quick add</h2>
      <div class="form-actions" style="flex-wrap: wrap; margin-top: 0">
        <button class="primary" @click="$emit('navigate', 'milk')">🍼 Milk</button>
        <button class="primary" @click="$emit('navigate', 'solids')">🥣 Solids</button>
        <button class="primary" @click="$emit('navigate', 'sleep')">😴 Sleep</button>
        <button class="primary" @click="$emit('navigate', 'diapers')">🧷 Diaper</button>
        <button class="primary" @click="$emit('navigate', 'growth')">📏 Growth</button>
      </div>
    </section>

    <section class="card">
      <h2>Recent activity</h2>
      <p v-if="!recent.length" class="empty">Nothing yet. Add your first entry above!</p>
      <ul v-else class="entry-list">
        <li v-for="(r, i) in recent" :key="i" class="entry">
          <span class="icon">{{ r.icon }}</span>
          <div class="body">
            <div class="title">{{ r.text }}</div>
            <div class="meta">{{ formatDateTime(r.time) }} · {{ timeAgo(r.time) }}</div>
          </div>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>Baby profile</h2>
      <div class="form-grid">
        <label>
          Name
          <input v-model="state.baby.name" type="text" placeholder="Baby's name" />
        </label>
        <label>
          <span class="label-row">
            <span>Birth date</span>
            <span v-if="state.baby.birthDate" class="hint">{{
              babyAge(state.baby.birthDate)
            }}</span>
          </span>
          <input v-model="state.baby.birthDate" type="date" />
        </label>
        <label>
          Gender
          <select v-model="state.baby.gender">
            <option value="">Prefer not to say</option>
            <option value="girl">Girl</option>
            <option value="boy">Boy</option>
          </select>
        </label>
      </div>
      <div class="form-actions">
        <button class="danger" @click="confirmClear">Delete all data</button>
        <span class="meta">Data is stored only in this browser.</span>
      </div>
    </section>
  </div>
</template>
