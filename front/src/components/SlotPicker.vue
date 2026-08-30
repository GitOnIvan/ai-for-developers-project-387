<script setup lang="ts">
import type { Slot } from "../api/generated";
import { DateTimeUtil } from "../utils/datetime";

defineProps<{
  slots: Slot[];
  loading?: boolean;
  selectedStart?: string;
}>();

const emit = defineEmits<{
  (e: "select", slot: Slot): void;
}>();
</script>

<template>
  <div class="slot-picker">
    <h2 id="slot-heading">Доступные слоты</h2>
    <p v-if="loading" class="muted">Загрузка слотов…</p>
    <p v-else-if="slots.length === 0" class="muted">
      На этот день нет свободных слотов.
    </p>
    <div v-else class="slots">
      <button
        v-for="slot in slots"
        :key="slot.start"
        type="button"
        class="selectable"
        :class="{ selected: slot.start === selectedStart }"
        :aria-pressed="slot.start === selectedStart"
        @click="emit('select', slot)"
      >
        {{ DateTimeUtil.formatTime(slot.start) }}
      </button>
    </div>
  </div>
</template>
