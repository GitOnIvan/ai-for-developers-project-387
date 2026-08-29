<script setup lang="ts">
import { ref, watch } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { api } from "../api/client";
import { DateTimeUtil } from "../utils/datetime";

const props = defineProps<{
  eventTypeId: string;
}>();

const emit = defineEmits<{
  (e: "select-date", date: string): void;
}>();

const allowedDates = ref<string[]>([]);
const model = ref<Date | null>(null);
const loading = ref(false);

const today = new Date();
const maxDate = DateTimeUtil.addDays(today, 30);

async function loadMonth(year: number, month: number) {
  loading.value = true;
  try {
    const { from, to } = DateTimeUtil.monthRange(year, month);
    const res = await api.availabilityDays({
      eventTypeId: props.eventTypeId,
      from,
      to,
    });
    allowedDates.value = res.data.filter((d) => d.available).map((d) => d.date);
  } finally {
    loading.value = false;
  }
}

function onUpdateMonthYear(payload: { month: number; year: number }) {
  loadMonth(payload.year, payload.month);
}

function onSelect(value: Date | null) {
  if (!value) return;
  emit("select-date", DateTimeUtil.toLocalDateString(value));
}

watch(
  () => props.eventTypeId,
  () => {
    model.value = null;
    loadMonth(today.getFullYear(), today.getMonth());
  },
  { immediate: true },
);

// Экспонируем внутреннее поведение для тестирования (vue-datepicker не
// рендерит сетку в jsdom, поэтому проверяем логику доступности напрямую).
defineExpose({ allowedDates, loading, loadMonth, onSelect, onUpdateMonthYear });
</script>

<template>
  <section aria-labelledby="cal-heading">
    <h2 id="cal-heading">Выберите день</h2>
    <p v-if="loading" class="muted" role="status">Загрузка календаря…</p>
    <VueDatePicker
      v-model="model"
      inline
      auto-apply
      :enable-time-picker="false"
      :min-date="today"
      :max-date="maxDate"
      :allowed-dates="allowedDates"
      :month-change-on-scroll="false"
      @update-month-year="onUpdateMonthYear"
      @update:model-value="onSelect"
    />
  </section>
</template>
