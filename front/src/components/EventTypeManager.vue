<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { AxiosError } from "axios";
import type { ApiError, EventType } from "../api/generated";
import { api } from "../api/client";
import BaseModal from "./BaseModal.vue";

const eventTypes = ref<EventType[]>([]);
const errorMessage = ref("");

// Модальное окно создания
const showCreate = ref(false);
const createError = ref("");

// Форма создания
const name = ref("");
const slug = ref("");
const durationMinutes = ref<number>(30);
const description = ref("");

async function load() {
  const res = await api.adminEventTypesList();
  eventTypes.value = res.data;
}

onMounted(load);

function openCreate() {
  createError.value = "";
  showCreate.value = true;
}

function closeCreate() {
  showCreate.value = false;
}

async function create() {
  createError.value = "";
  if (!name.value.trim() || !slug.value.trim() || !durationMinutes.value) {
    createError.value = "Заполните все поля";
    return;
  }
  await api.adminEventTypesCreate({
    name: name.value,
    slug: slug.value,
    durationMinutes: Number(durationMinutes.value),
    description: description.value.trim() || undefined,
  });
  name.value = "";
  slug.value = "";
  durationMinutes.value = 30;
  description.value = "";
  showCreate.value = false;
  await load();
}

async function toggleActive(et: EventType) {
  await api.adminEventTypesUpdate(et.id, { active: !et.active });
  await load();
}

async function remove(et: EventType) {
  errorMessage.value = "";
  try {
    await api.adminEventTypesDelete(et.id);
    await load();
  } catch (e) {
    const err = e as AxiosError<ApiError>;
    if (err.response?.status === 409) {
      errorMessage.value =
        "Нельзя удалить тип с существующими бронированиями. Деактивируйте его.";
    } else {
      errorMessage.value =
        err.response?.data?.message ?? "Не удалось удалить тип";
    }
  }
}
</script>

<template>
  <section aria-labelledby="etm-heading">
    <h2 id="etm-heading" class="admin-heading">Типы встреч</h2>

    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

    <ul class="list event-type-list" aria-label="Существующие типы встреч">
      <li v-for="et in eventTypes" :key="et.id" class="event-type-card">
        <div class="event-type-row">
          <div class="event-type-main">
            <div class="summary-event-title">
              <strong>{{ et.name }}</strong>
              <span class="tag">{{ et.durationMinutes }} мин</span>
              <span v-if="!et.active" class="muted"> (неактивен)</span>
            </div>
            <p v-if="et.description" class="muted">{{ et.description }}</p>
          </div>
          <div class="field-row">
            <button
              type="button"
              class="admin-action"
              :class="{ primary: !et.active }"
              @click="toggleActive(et)"
            >
              {{ et.active ? "Деактивировать" : "Активировать" }}
            </button>
            <button type="button" class="admin-action" @click="remove(et)">
              Удалить
            </button>
          </div>
        </div>
      </li>
    </ul>

    <div class="event-type-create">
      <button type="button" class="primary admin-action" @click="openCreate">
        Добавить
      </button>
    </div>

    <BaseModal v-if="showCreate" title="Добавить тип" @close="closeCreate">
      <form @submit.prevent="create">
        <div class="create-fields">
          <label>
            <span>Название</span>
            <input v-model="name" aria-label="Название" type="text" />
          </label>
          <label>
            <span>Slug</span>
            <input v-model="slug" aria-label="Slug" type="text" />
          </label>
          <label>
            <span>Длительность (мин)</span>
            <input
              v-model="durationMinutes"
              aria-label="Длительность"
              type="number"
              min="1"
            />
          </label>
          <label>
            <span>Описание</span>
            <textarea
              v-model="description"
              aria-label="Описание"
              rows="3"
            ></textarea>
          </label>
        </div>
        <p v-if="createError" class="error" role="alert">{{ createError }}</p>
        <div class="field-row" style="margin-top: 1rem">
          <button type="submit" class="primary admin-action">Добавить</button>
        </div>
      </form>
    </BaseModal>
  </section>
</template>
