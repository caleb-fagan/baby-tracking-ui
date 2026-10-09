<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { state } from '../store'
import type { Reaction } from '../types'
import {
  formatDateTime,
  localToUtc,
  newestFirst,
  nowLocal,
  removeById,
  uid,
  utcToLocal,
} from '../utils'
import DateField from './DateField.vue'

const form = reactive({
  time: nowLocal(),
  food: '',
  amount: '',
  reaction: 'ok' as Reaction,
  notes: '',
})
const error = ref('')

const reactionLabels: Record<Reaction, string> = {
  loved: '😍 Loved it',
  ok: '🙂 Okay',
  disliked: '😖 Disliked',
  allergic: '⚠️ Possible reaction',
}

const entries = computed(() => newestFirst(state.solids, (s) => s.time))

const editingId = ref<string | null>(null)

function resetForm() {
  form.time = nowLocal()
  form.food = ''
  form.amount = ''
  form.reaction = 'ok'
  form.notes = ''
  error.value = ''
}

function submit() {
  if (!form.food.trim()) {
    error.value = 'Please enter the food.'
    return
  }
  const values = {
    time: localToUtc(form.time || nowLocal()),
    food: form.food.trim(),
    amount: form.amount.trim(),
    reaction: form.reaction,
    notes: form.notes.trim(),
  }
  if (editingId.value) {
    const entry = state.solids.find((s) => s.id === editingId.value)
    if (entry) Object.assign(entry, values)
    editingId.value = null
  } else {
    state.solids.push({ id: uid(), ...values })
  }
  resetForm()
}

function startEdit(id: string) {
  const entry = state.solids.find((s) => s.id === id)
  if (!entry) return
  editingId.value = id
  form.time = utcToLocal(entry.time)
  form.food = entry.food
  form.amount = entry.amount
  form.reaction = entry.reaction
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
  removeById(state.solids, id)
}
</script>

<template>
  <div>
    <form class="card" @submit.prevent="submit">
      <h2>{{ editingId ? '✏️ Edit solid feeding' : '🥣 Log a solid feeding' }}</h2>
      <div class="form-grid">
        <label>
          When
          <DateField v-model="form.time" required />
        </label>
        <label>
          Food
          <input v-model="form.food" type="text" placeholder="e.g. Mashed banana" />
        </label>
        <label>
          Amount
          <input v-model="form.amount" type="text" placeholder="e.g. 2 tbsp" />
        </label>
        <label>
          Reaction
          <select v-model="form.reaction">
            <option v-for="(label, key) in reactionLabels" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </label>
        <label class="wide">
          Notes
          <input v-model="form.notes" type="text" placeholder="Optional" />
        </label>
      </div>
      <div class="form-actions">
        <button class="primary" type="submit">
          {{ editingId ? 'Save changes' : 'Add solid feeding' }}
        </button>
        <button v-if="editingId" class="ghost" type="button" @click="cancelEdit">Cancel</button>
        <span v-if="error" class="error">{{ error }}</span>
      </div>
    </form>

    <section class="card">
      <h2>History</h2>
      <p v-if="!entries.length" class="empty">No solid feedings logged yet.</p>
      <ul v-else class="entry-list">
        <li v-for="s in entries" :key="s.id" class="entry" :class="{ editing: s.id === editingId }">
          <span class="icon">🥄</span>
          <div class="body">
            <div class="title">
              {{ s.food }}
              <span v-if="s.amount" class="badge">{{ s.amount }}</span>
              <span class="badge" :class="{ warn: s.reaction === 'allergic' }">{{
                reactionLabels[s.reaction]
              }}</span>
            </div>
            <div class="meta">{{ formatDateTime(s.time) }}</div>
            <div v-if="s.notes" class="notes">{{ s.notes }}</div>
          </div>
          <button class="ghost" @click="startEdit(s.id)">Edit</button>
          <button class="ghost" @click="remove(s.id)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>
