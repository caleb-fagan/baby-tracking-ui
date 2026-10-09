<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { state } from './store'
import { babyAge } from './utils'
import DashboardView from './components/DashboardView.vue'
import MilkFeedings from './components/MilkFeedings.vue'
import SolidFeedings from './components/SolidFeedings.vue'
import SleepLog from './components/SleepLog.vue'
import DiaperLog from './components/DiaperLog.vue'
import GrowthLog from './components/GrowthLog.vue'

interface Tab {
  id: string
  label: string
  icon: string
  component: Component
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Today', icon: '🏠', component: DashboardView },
  { id: 'milk', label: 'Milk', icon: '🍼', component: MilkFeedings },
  { id: 'solids', label: 'Solids', icon: '🥣', component: SolidFeedings },
  { id: 'sleep', label: 'Sleep', icon: '😴', component: SleepLog },
  { id: 'diapers', label: 'Diapers', icon: '🧷', component: DiaperLog },
  { id: 'growth', label: 'Growth', icon: '📏', component: GrowthLog },
]

const activeId = ref('dashboard')
const active = computed(() => tabs.find((t) => t.id === activeId.value) ?? tabs[0])

const title = computed(() => (state.baby.name ? `${state.baby.name}'s Tracker` : 'Baby Tracker'))
const subtitle = computed(
  () => babyAge(state.baby.birthDate) || 'Track feeds, sleep, diapers & growth',
)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <span class="logo">👶</span>
      <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    </header>

    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="[`theme-${tab.id}`, { active: tab.id === activeId }]"
        @click="activeId = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </nav>

    <main :class="`theme-${active.id}`">
      <component :is="active.component" @navigate="activeId = $event" />
    </main>
  </div>
</template>
