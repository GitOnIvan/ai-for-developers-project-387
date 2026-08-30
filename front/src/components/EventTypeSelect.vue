<script setup lang="ts">
import type { EventType } from "../api/generated";

defineProps<{
  eventTypes: EventType[];
  selectedId?: string;
}>();

const emit = defineEmits<{
  (e: "select", eventType: EventType): void;
}>();
</script>

<template>
  <section class="event-type-panel" aria-label="Доступные типы встречи">
    <ul class="event-type-grid">
      <li v-for="et in eventTypes" :key="et.id">
        <button
          type="button"
          class="event-type-card"
          :class="{ selected: et.id === selectedId }"
          :aria-pressed="et.id === selectedId"
          @click="emit('select', et)"
        >
          <div class="summary-event-title">
            <strong>{{ et.name }}</strong>
            <span v-if="et.durationMinutes" class="tag">
              {{ et.durationMinutes }} мин
            </span>
          </div>
          <p v-if="et.description" class="muted">{{ et.description }}</p>
        </button>
      </li>
    </ul>
  </section>
</template>
