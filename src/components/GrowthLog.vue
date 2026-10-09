<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { state } from '../store'
import { formatDate, newestFirst, removeById, todayLocal, uid } from '../utils'
import DateField from './DateField.vue'

const form = reactive({
  date: todayLocal(),
  weightKg: '' as number | '',
  heightCm: '' as number | '',
  headCm: '' as number | '',
  notes: '',
})
const error = ref('')

const entries = computed(() => newestFirst(state.growth, (g) => g.date))

function opt(v: number | ''): number | undefined {
  return v === '' || isNaN(Number(v)) ? undefined : Number(v)
}

const editingId = ref<string | null>(null)

function resetForm() {
  form.date = todayLocal()
  form.weightKg = ''
  form.heightCm = ''
  form.headCm = ''
  form.notes = ''
  error.value = ''
}

function submit() {
  const weightKg = opt(form.weightKg)
  const heightCm = opt(form.heightCm)
  const headCm = opt(form.headCm)
  if (weightKg === undefined && heightCm === undefined && headCm === undefined) {
    error.value = 'Enter at least one measurement.'
    return
  }
  const values = {
    date: form.date || todayLocal(),
    weightKg,
    heightCm,
    headCm,
    notes: form.notes.trim(),
  }
  if (editingId.value) {
    const entry = state.growth.find((g) => g.id === editingId.value)
    if (entry) Object.assign(entry, values)
    editingId.value = null
  } else {
    state.growth.push({ id: uid(), ...values })
  }
  resetForm()
}

function startEdit(id: string) {
  const entry = state.growth.find((g) => g.id === id)
  if (!entry) return
  editingId.value = id
  form.date = entry.date
  form.weightKg = entry.weightKg ?? ''
  form.heightCm = entry.heightCm ?? ''
  form.headCm = entry.headCm ?? ''
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
  removeById(state.growth, id)
}
</script>

<template>
  <div>
    <form class="card" @submit.prevent="submit">
      <h2>{{ editingId ? '✏️ Edit measurement' : '📏 Log a measurement' }}</h2>
      <div class="form-grid">
        <label>
          Date
          <DateField v-model="form.date" date-only required />
        </label>
        <label>
          Weight (kg)
          <input v-model.number="form.weightKg" type="number" min="0" step="0.01" />
        </label>
        <label>
          Height / length (cm)
          <input v-model.number="form.heightCm" type="number" min="0" step="0.1" />
        </label>
        <label>
          Head circumference (cm)
          <input v-model.number="form.headCm" type="number" min="0" step="0.1" />
        </label>
        <label class="wide">
          Notes
          <input v-model="form.notes" type="text" placeholder="Optional, e.g. checkup visit" />
        </label>
      </div>
      <div class="form-actions">
        <button class="primary" type="submit">
          {{ editingId ? 'Save changes' : 'Add measurement' }}
        </button>
        <button v-if="editingId" class="ghost" type="button" @click="cancelEdit">Cancel</button>
        <span v-if="error" class="error">{{ error }}</span>
      </div>
    </form>

    <section class="card">
      <h2>History</h2>
      <p v-if="!entries.length" class="empty">No measurements logged yet.</p>
      <ul v-else class="entry-list">
        <li v-for="g in entries" :key="g.id" class="entry" :class="{ editing: g.id === editingId }">
          <span class="icon">📏</span>
          <div class="body">
            <div class="title">
              {{ formatDate(g.date) }}
              <span v-if="g.weightKg !== undefined" class="badge">{{ g.weightKg }} kg</span>
              <span v-if="g.heightCm !== undefined" class="badge">{{ g.heightCm }} cm</span>
              <span v-if="g.headCm !== undefined" class="badge">head {{ g.headCm }} cm</span>
            </div>
            <div v-if="g.notes" class="notes">{{ g.notes }}</div>
          </div>
          <button class="ghost" @click="startEdit(g.id)">Edit</button>
          <button class="ghost" @click="remove(g.id)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>
