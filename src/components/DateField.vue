<script setup lang="ts">
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { formatDate, formatDateTime, toLocalString } from '../utils'

// Calendar popover bound to a local string: "YYYY-MM-DDTHH:mm" (date and time) or, with
// `dateOnly`, "YYYY-MM-DD". Same contract as the native <input type="datetime-local"> / "date"
// it replaces, so forms keep converting with utcToLocal() / localToUtc() at the boundary.
const props = defineProps<{
  dateOnly?: boolean
  /** Required fields can't be cleared; optional ones show a clear button and emit ''. */
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const is24 = !new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12

const picked = computed(() => {
  if (!model.value) return null
  const d = new Date(props.dateOnly ? `${model.value}T00:00` : model.value)
  return isNaN(d.getTime()) ? null : d
})

function onUpdate(value: unknown) {
  if (!(value instanceof Date)) {
    model.value = ''
    return
  }
  const local = toLocalString(value.getTime())
  model.value = props.dateOnly ? local.slice(0, 10) : local
}

function formatInput(d: Date): string {
  const local = toLocalString(d.getTime())
  return props.dateOnly ? formatDate(local.slice(0, 10)) : formatDateTime(local)
}
</script>

<template>
  <!-- The field sits inside a <label>; cancelling the click stops clicks in the popup from being
       forwarded to the input (which would toggle the menu closed). -->
  <div @click.prevent>
    <VueDatePicker
      :model-value="picked"
      :time-config="{ enableTimePicker: !dateOnly, is24 }"
      :auto-apply="dateOnly"
      :flow="dateOnly ? undefined : { steps: ['time'] }"
      :action-row="{ showNow: !dateOnly, showPreview: false, nowBtnLabel: 'Now' }"
      :formats="{ input: formatInput }"
      :input-attrs="{ clearable: !required }"
      :placeholder="dateOnly ? 'Select a date' : 'Select date and time'"
      @update:model-value="onUpdate"
    />
  </div>
</template>
