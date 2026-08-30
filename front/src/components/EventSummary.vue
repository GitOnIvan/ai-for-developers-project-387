<script setup lang="ts">
import { computed } from "vue";
import type { EventType } from "../api/generated";
import { DateTimeUtil } from "../utils/datetime";
import OrganizerSummary from "./OrganizerSummary.vue";

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
  <section class="booking-card" aria-label="Сводка встречи">
    <OrganizerSummary />

    <div class="summary-block">
      <div class="summary-event-title">
        <strong>{{ eventType?.name ?? "..." }}</strong>
        <span v-if="eventType?.durationMinutes" class="tag">
          {{ eventType.durationMinutes }} мин
        </span>
      </div>
      <p v-if="eventType?.description" class="muted">
        {{ eventType.description }}
      </p>
    </div>

    <div class="summary-block summary-chip">
      <p class="muted">Выбранная дата</p>
      <p class="summary-date">{{ dateLabel }}</p>
    </div>

    <div class="summary-block summary-chip">
      <p class="muted">Выбранное время</p>
      <p>{{ timeLabel }}</p>
    </div>
  </section>
</template>
