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
  <section aria-labelledby="et-heading">
    <h2 id="et-heading">Выберите тип встречи</h2>
    <ul class="list">
      <li v-for="et in eventTypes" :key="et.id">
        <button
          type="button"
          class="card selectable"
          :class="{ selected: et.id === selectedId }"
          :aria-pressed="et.id === selectedId"
          @click="emit('select', et)"
        >
          <strong>{{ et.name }}</strong>
          <div class="muted">{{ et.durationMinutes }} мин</div>
          <div v-if="et.description" class="muted">{{ et.description }}</div>
        </button>
      </li>
    </ul>
  </section>
</template>
