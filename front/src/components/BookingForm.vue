<script setup lang="ts">
import { ref } from "vue";
import type { AxiosError } from "axios";
import type { ApiError, Booking, Slot } from "../api/generated";
import { api } from "../api/client";

const props = defineProps<{
  eventTypeId: string;
  slot: Slot;
}>();

const emit = defineEmits<{
  (e: "booked", booking: Booking): void;
}>();

const name = ref("");
const email = ref("");
const note = ref("");
const submitting = ref(false);
const errorMessage = ref("");

function validate(): boolean {
  if (!name.value.trim()) {
    errorMessage.value = "Укажите имя";
    return false;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    errorMessage.value = "Укажите корректный email";
    return false;
  }
  return true;
}

async function submit() {
  errorMessage.value = "";
  if (!validate()) return;
  submitting.value = true;
  try {
    const res = await api.bookingsCreate({
      eventTypeId: props.eventTypeId,
      slotStart: props.slot.start,
      name: name.value,
      email: email.value,
      note: note.value || undefined,
    });
    emit("booked", res.data);
  } catch (e) {
    const err = e as AxiosError<ApiError>;
    if (err.response?.status === 409) {
      errorMessage.value = "Этот слот уже занят. Выберите другое время.";
    } else {
      errorMessage.value =
        err.response?.data?.message ?? "Не удалось создать бронирование";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section aria-label="Форма записи">
    <form @submit.prevent="submit">
      <label>
        <span>Имя</span>
        <input v-model="name" name="name" type="text" aria-label="Имя" />
      </label>
      <label>
        <span>Email</span>
        <input v-model="email" name="email" type="text" aria-label="Email" />
      </label>
      <label>
        <span>Комментарий (необязательно)</span>
        <textarea
          v-model="note"
          name="note"
          aria-label="Комментарий"
          rows="3"
        />
      </label>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <button type="submit" class="primary" :disabled="submitting">
        {{ submitting ? "Отправка…" : "Записаться" }}
      </button>
    </form>
  </section>
</template>
