<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { state } from '../store'
import type { MilkType } from '../types'
import { formatDateTime, newestFirst, nowLocal, removeById, toLocalString, uid } from '../utils'
import TimerCard from './TimerCard.vue'

const form = reactive({
  time: nowLocal(),
  type: 'pumped' as MilkType,
  amountMl: '' as number | '',
  durationMin: '' as number | '',
  notes: '',
})

const typeLabels: Record<MilkType, string> = {
  breast: 'Breastfeeding',
  pumped: 'Pumped milk',
  formula: 'Formula',
}

const isBreast = computed(() => form.type === 'breast')
const entries = computed(() => newestFirst(state.milk, (m) => m.time))

/** Pausing the timer copies the start time and duration so far into the form. */
function onTimerPause(startedAt: number, elapsedMs: number) {
  form.time = toLocalString(startedAt)
  form.durationMin = Math.max(1, Math.round(elapsedMs / 60000))
}

const editingId = ref<string | null>(null)

function resetForm() {
  form.time = nowLocal()
  form.amountMl = ''
  form.durationMin = ''
  form.notes = ''
}

function submit() {
  const values = {
    time: form.time || nowLocal(),
    type: form.type,
    amountMl: !isBreast.value && form.amountMl !== '' ? Number(form.amountMl) : undefined,
    durationMin: isBreast.value && form.durationMin !== '' ? Number(form.durationMin) : undefined,
    notes: form.notes.trim(),
  }
  if (editingId.value) {
    const entry = state.milk.find((m) => m.id === editingId.value)
    if (entry) Object.assign(entry, values)
    editingId.value = null
  } else {
    state.milk.push({ id: uid(), ...values })
    if (isBreast.value) state.breastTimer = null
  }
  resetForm()
}

function startEdit(id: string) {
  const entry = state.milk.find((m) => m.id === id)
  if (!entry) return
  editingId.value = id
  form.time = entry.time
  form.type = entry.type
  form.amountMl = entry.amountMl ?? ''
  form.durationMin = entry.durationMin ?? ''
  form.notes = entry.notes
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  resetForm()
}

function remove(id: string) {
  if (editingId.value === id) cancelEdit()
  removeById(state.milk, id)
}
</script>

<template>
  <div>
    <form class="card" @submit.prevent="submit">
      <h2>{{ editingId ? '✏️ Edit milk feeding' : '🍼 Log a milk feeding' }}</h2>
      <div class="form-grid">
        <label>
          When
          <input v-model="form.time" type="datetime-local" required />
        </label>
        <label>
          Type
          <select v-model="form.type">
            <option v-for="(label, key) in typeLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label v-if="isBreast">
          Duration (minutes)
          <input v-model.number="form.durationMin" type="number" min="0" step="1" />
        </label>
        <label v-else>
          Amount (ml)
          <input v-model.number="form.amountMl" type="number" min="0" step="5" />
        </label>
        <label class="wide">
          Notes
          <input v-model="form.notes" type="text" placeholder="Optional" />
        </label>
      </div>
      <div class="form-actions">
        <button class="primary" type="submit">{{ editingId ? 'Save changes' : 'Add feeding' }}</button>
        <button v-if="editingId" class="ghost" type="button" @click="cancelEdit">Cancel</button>
      </div>
    </form>

    <TimerCard v-if="isBreast && !editingId"timer-key="breastTimer" title="⏱ Breastfeeding timer" @pause="onTimerPause" />

    <section class="card">
      <h2>History</h2>
      <p v-if="!entries.length" class="empty">No milk feedings logged yet.</p>
      <ul v-else class="entry-list">
        <li v-for="m in entries" :key="m.id" class="entry" :class="{ editing: m.id === editingId }">
          <span class="icon">{{ m.type === 'breast' ? '🤱' : '🍼' }}</span>
          <div class="body">
            <div class="title">
              {{ typeLabels[m.type] }}
              <span v-if="m.amountMl !== undefined" class="badge">{{ m.amountMl }} ml</span>
              <span v-if="m.durationMin !== undefined" class="badge">{{ m.durationMin }} min</span>
            </div>
            <div class="meta">{{ formatDateTime(m.time) }}</div>
            <div v-if="m.notes" class="notes">{{ m.notes }}</div>
          </div>
          <button class="ghost" @click="startEdit(m.id)">Edit</button>
          <button class="ghost" @click="remove(m.id)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>
