<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { state } from '../store'
import type { SleepKind } from '../types'
import {
  formatDateTime,
  formatDuration,
  minutesBetween,
  localToUtc,
  newestFirst,
  nowLocal,
  nowUtc,
  removeById,
  uid,
  utcToLocal,
} from '../utils'
import DateField from './DateField.vue'

const form = reactive({
  start: nowLocal(),
  end: '',
  kind: 'nap' as SleepKind,
  notes: '',
})
const error = ref('')
const editingId = ref<string | null>(null)

const entries = computed(() => newestFirst(state.sleep, (s) => s.start))

function resetForm() {
  form.start = nowLocal()
  form.end = ''
  form.kind = 'nap'
  form.notes = ''
  error.value = ''
}

function submit() {
  if (form.end && form.end < form.start) {
    error.value = 'End time must be after the start time.'
    return
  }
  const values = {
    start: localToUtc(form.start || nowLocal()),
    end: localToUtc(form.end),
    kind: form.kind,
    notes: form.notes.trim(),
  }
  if (editingId.value) {
    const entry = state.sleep.find((s) => s.id === editingId.value)
    if (entry) Object.assign(entry, values)
    editingId.value = null
  } else {
    state.sleep.push({ id: uid(), ...values })
  }
  resetForm()
}

function startEdit(id: string) {
  const entry = state.sleep.find((s) => s.id === id)
  if (!entry) return
  editingId.value = id
  form.start = utcToLocal(entry.start)
  form.end = utcToLocal(entry.end)
  form.kind = entry.kind
  form.notes = entry.notes
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  resetForm()
}

function remove(id: string) {
  if (editingId.value === id) cancelEdit()
  removeById(state.sleep, id)
}

function endNow(id: string) {
  const entry = state.sleep.find((s) => s.id === id)
  if (entry) entry.end = nowUtc()
}
</script>

<template>
  <div>
    <form class="card" @submit.prevent="submit">
      <h2>{{ editingId ? '✏️ Edit sleep' : '😴 Log sleep' }}</h2>
      <div class="form-grid">
        <label>
          Fell asleep
          <DateField v-model="form.start" required />
        </label>
        <label>
          <span class="label-row">
            <span>Woke up</span>
            <span class="hint">leave empty if still asleep</span>
          </span>
          <DateField v-model="form.end" />
        </label>
        <label>
          Type
          <select v-model="form.kind">
            <option value="nap">Nap</option>
            <option value="night">Night sleep</option>
          </select>
        </label>
        <label>
          Notes
          <input v-model="form.notes" type="text" placeholder="Optional" />
        </label>
      </div>
      <div class="form-actions">
        <button class="primary" type="submit">
          {{ editingId ? 'Save changes' : 'Add sleep' }}
        </button>
        <button v-if="editingId" class="ghost" type="button" @click="cancelEdit">Cancel</button>
        <span v-if="error" class="error">{{ error }}</span>
      </div>
    </form>

    <section class="card">
      <h2>History</h2>
      <p v-if="!entries.length" class="empty">No sleep logged yet.</p>
      <ul v-else class="entry-list">
        <li v-for="s in entries" :key="s.id" class="entry" :class="{ editing: s.id === editingId }">
          <span class="icon">{{ s.kind === 'night' ? '🌙' : '💤' }}</span>
          <div class="body">
            <div class="title">
              {{ s.kind === 'night' ? 'Night sleep' : 'Nap' }}
              <span v-if="s.end" class="badge">{{
                formatDuration(minutesBetween(s.start, s.end))
              }}</span>
              <span v-else class="badge">Sleeping now</span>
            </div>
            <div class="meta">
              {{ formatDateTime(s.start)
              }}<template v-if="s.end"> → {{ formatDateTime(s.end) }}</template>
            </div>
            <div v-if="s.notes" class="notes">{{ s.notes }}</div>
          </div>
          <button v-if="!s.end" class="ghost" @click="endNow(s.id)">Woke up</button>
          <button class="ghost" @click="startEdit(s.id)">Edit</button>
          <button class="ghost" @click="remove(s.id)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>
