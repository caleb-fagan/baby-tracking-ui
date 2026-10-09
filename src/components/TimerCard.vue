<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { state } from '../store'
import { formatClock } from '../utils'

const props = defineProps<{
  /** Which stopwatch in the store this card controls. */
  timerKey: 'breastTimer'
  title: string
}>()

const emit = defineEmits<{
  /** Fired when the timer is paused, with the first start time (epoch ms) and total elapsed ms. */
  pause: [startedAt: number, elapsedMs: number]
}>()

const now = ref(Date.now())
let tick: number | undefined
onMounted(() => {
  tick = window.setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => window.clearInterval(tick))

const timer = computed(() => state[props.timerKey])
const running = computed(() => timer.value?.runningSince != null)

const clock = computed(() => {
  const t = timer.value
  if (!t) return formatClock(0)
  const ms = t.elapsedMs + (t.runningSince != null ? now.value - t.runningSince : 0)
  return formatClock(ms / 1000)
})

function start() {
  now.value = Date.now()
  state[props.timerKey] = { startedAt: now.value, elapsedMs: 0, runningSince: now.value }
}

function pause() {
  const t = timer.value
  if (!t || t.runningSince == null) return
  now.value = Date.now()
  t.elapsedMs += now.value - t.runningSince
  t.runningSince = null
  emit('pause', t.startedAt, t.elapsedMs)
}

function resume() {
  const t = timer.value
  if (!t || t.runningSince != null) return
  now.value = Date.now()
  t.runningSince = now.value
}

function reset() {
  state[props.timerKey] = null
}
</script>

<template>
  <section class="card timer-card">
    <h2>{{ title }}</h2>
    <div class="timer-clock" :class="{ running }">{{ clock }}</div>
    <div class="form-actions timer-actions">
      <button v-if="!timer" class="primary" type="button" @click="start">▶ Start</button>
      <button v-else-if="running" class="primary" type="button" @click="pause">⏸ Pause</button>
      <template v-else>
        <button class="primary" type="button" @click="resume">▶ Resume</button>
        <button class="ghost" type="button" @click="reset">Reset</button>
      </template>
    </div>
    <p class="meta">
      <template v-if="running">Pause to copy the times into the log above.</template>
      <template v-else-if="timer">Paused. The log above has been filled in; resume to keep timing.</template>
      <template v-else>Start the timer, then pause to fill in the log above.</template>
    </p>
  </section>
</template>
