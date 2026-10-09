<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { state } from '../store'
import type { DiaperKind } from '../types'
import {
  formatDateTime,
  localToUtc,
  newestFirst,
  nowLocal,
  removeById,
  uid,
  utcToLocal,
} from '../utils'

const form = reactive({
  time: nowLocal(),
  kind: 'wet' as DiaperKind,
  notes: '',
})

const kindLabels: Record<DiaperKind, string> = {
  wet: '💧 Wet',
  dirty: '💩 Dirty',
  both: '🫟 Both',
}

const entries = computed(() => newestFirst(state.diapers, (d) => d.time))

const editingId = ref<string | null>(null)

function resetForm() {
  form.time = nowLocal()
  form.kind = 'wet'
  form.notes = ''
}

function submit() {
  const values = {
    time: localToUtc(form.time || nowLocal()),
    kind: form.kind,
    notes: form.notes.trim(),
  }
  if (editingId.value) {
    const entry = state.diapers.find((d) => d.id === editingId.value)
    if (entry) Object.assign(entry, values)
    editingId.value = null
  } else {
    state.diapers.push({ id: uid(), ...values })
  }
  resetForm()
}

function startEdit(id: string) {
  const entry = state.diapers.find((d) => d.id === id)
  if (!entry) return
  editingId.value = id
  form.time = utcToLocal(entry.time)
  form.kind = entry.kind
  form.notes = entry.notes
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  resetForm()
}

function remove(id: string) {
  if (editingId.value === id) cancelEdit()
  removeById(state.diapers, id)
}
</script>

<template>
  <div>
    <form class="card" @submit.prevent="submit">
      <h2>{{ editingId ? '✏️ Edit diaper change' : '🧷 Log a diaper change' }}</h2>
      <div class="form-grid">
        <label>
          When
          <input v-model="form.time" type="datetime-local" required />
        </label>
        <label>
          Type
          <select v-model="form.kind">
            <option v-for="(label, key) in kindLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label class="wide">
          Notes
          <input v-model="form.notes" type="text" placeholder="Optional" />
        </label>
      </div>
      <div class="form-actions">
        <button class="primary" type="submit">
          {{ editingId ? 'Save changes' : 'Add diaper' }}
        </button>
        <button v-if="editingId" class="ghost" type="button" @click="cancelEdit">Cancel</button>
      </div>
    </form>

    <section class="card">
      <h2>History</h2>
      <p v-if="!entries.length" class="empty">No diapers logged yet.</p>
      <ul v-else class="entry-list">
        <li v-for="d in entries" :key="d.id" class="entry" :class="{ editing: d.id === editingId }">
          <span class="icon">🧷</span>
          <div class="body">
            <div class="title">{{ kindLabels[d.kind] }}</div>
            <div class="meta">{{ formatDateTime(d.time) }}</div>
            <div v-if="d.notes" class="notes">{{ d.notes }}</div>
          </div>
          <button class="ghost" @click="startEdit(d.id)">Edit</button>
          <button class="ghost" @click="remove(d.id)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>
