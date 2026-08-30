<script setup lang="ts">
import { onBeforeUnmount, onMounted, useId } from "vue";

const props = defineProps<{
  title?: string;
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const titleId = useId();

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  document.body.style.overflow = "hidden";
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="props.title ? titleId : undefined"
        :aria-label="!props.title ? (props.ariaLabel ?? undefined) : undefined"
      >
        <div
          class="modal-header"
          :class="{ 'modal-header--bare': !props.title }"
        >
          <h2 v-if="props.title" :id="titleId" class="modal-title">
            {{ props.title }}
          </h2>
          <button
            type="button"
            class="modal-close"
            aria-label="Закрыть"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
