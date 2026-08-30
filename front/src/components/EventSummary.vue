<script setup lang="ts">
import { computed } from "vue";
import type { EventType } from "../api/generated";
import { DateTimeUtil } from "../utils/datetime";

const props = defineProps<{
  eventType: EventType | null;
  selectedDate: string | null;
  selectedSlotStart: string | null;
}>();

const dateLabel = computed(() => {
  if (!props.selectedDate) return "Дата не выбрана";
  return DateTimeUtil.formatDate(props.selectedDate);
});

const timeLabel = computed(() => {
  if (!props.selectedSlotStart) return "Время не выбрано";
  return DateTimeUtil.formatTime(props.selectedSlotStart);
});
</script>

<template>
  <section class="card" aria-labelledby="summary-heading">
    <h2 id="summary-heading">Сводка встречи</h2>

    <div class="summary-block">
      <p class="muted">Организатор</p>
      <p><strong>admin</strong></p>
    </div>

    <div class="summary-block">
      <p class="muted">Событие</p>
      <p>
        <strong>{{ eventType?.name ?? "..." }}</strong>
      </p>
      <p v-if="eventType?.durationMinutes" class="tag">
        {{ eventType.durationMinutes }} мин
      </p>
      <p v-if="eventType?.description" class="muted">
        {{ eventType.description }}
      </p>
    </div>

    <div class="summary-block">
      <p class="muted">Выбранная дата</p>
      <p>{{ dateLabel }}</p>
    </div>

    <div class="summary-block">
      <p class="muted">Выбранное время</p>
      <p>{{ timeLabel }}</p>
    </div>
  </section>
</template>
