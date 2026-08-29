import type { Booking, EventType } from "../api/generated";

/**
 * In-memory состояние мока. Экспортируем фабрику `resetData`, чтобы тесты
 * могли сбрасывать состояние между прогонами.
 */

export interface MockState {
  eventTypes: EventType[];
  bookings: Booking[];
  seq: number;
}

function seedEventTypes(): EventType[] {
  return [
    {
      id: "et-15",
      name: "Быстрый созвон",
      slug: "quick-15",
      durationMinutes: 15,
      description: "Короткий 15-минутный разговор",
      active: true,
    },
    {
      id: "et-30",
      name: "Стандартная встреча",
      slug: "standard-30",
      durationMinutes: 30,
      description: "Получасовая встреча",
      active: true,
    },
    {
      id: "et-120",
      name: "Глубокая сессия",
      slug: "deep-120",
      durationMinutes: 120,
      description: "Двухчасовая рабочая сессия",
      active: true,
    },
  ];
}

export const state: MockState = {
  eventTypes: seedEventTypes(),
  bookings: [],
  seq: 1,
};

export function resetData(): void {
  state.eventTypes = seedEventTypes();
  state.bookings = [];
  state.seq = 1;
}

/** Захардкоженные настройки доступности (как в контракте — seed в БД). */
export const settings = {
  horizonDays: 30,
  slotStepMinutes: 15,
  /** Рабочее окно (UTC-часы), Пн–Пт. */
  workStartHour: 9,
  workEndHour: 17,
  /** Дни недели (0=Вс..6=Сб), в которые доступны встречи. */
  workDays: [1, 2, 3, 4, 5],
};
