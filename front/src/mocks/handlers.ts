import { http, HttpResponse } from "msw";
import type {
  ApiError,
  Booking,
  BookingCreate,
  BookingWithEventType,
  DayAvailability,
  EventType,
  EventTypeCreate,
  EventTypeUpdate,
  Slot,
} from "../api/generated";
import { settings, state } from "./data";

function error(code: ApiError["code"], message: string, status: number) {
  return HttpResponse.json<ApiError>({ code, message }, { status });
}

/** Генерирует слоты для конкретного дня и типа встречи (UTC). */
function generateSlots(dateStr: string, durationMinutes: number): Slot[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (!settings.workDays.includes(dow)) return [];

  const slots: Slot[] = [];
  const windowStart = settings.workStartHour * 60;
  const windowEnd = settings.workEndHour * 60;

  for (
    let minutes = windowStart;
    minutes + durationMinutes <= windowEnd;
    minutes += settings.slotStepMinutes
  ) {
    const start = new Date(Date.UTC(y, m - 1, d, 0, minutes, 0));
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    // исключаем пересечения с существующими бронями
    const overlaps = state.bookings.some((b) => {
      const bStart = new Date(b.slotStart).getTime();
      const bEnd = new Date(b.slotEnd).getTime();
      return start.getTime() < bEnd && end.getTime() > bStart;
    });
    if (overlaps) continue;

    slots.push({ start: start.toISOString(), end: end.toISOString() });
  }
  return slots;
}

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const cur = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td));
  while (cur.getTime() <= end.getTime()) {
    const y = cur.getUTCFullYear();
    const mo = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const da = String(cur.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${mo}-${da}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export const handlers = [
  // --- Публичные типы встреч (только активные) ---
  http.get("/api/event-types", () => {
    return HttpResponse.json<EventType[]>(
      state.eventTypes.filter((e) => e.active),
    );
  }),

  // --- Доступность по дням ---
  http.get("/api/availability/days", ({ request }) => {
    const url = new URL(request.url);
    const eventTypeId = url.searchParams.get("eventTypeId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const et = state.eventTypes.find((e) => e.id === eventTypeId);
    if (!et) return error("NOT_FOUND", "Тип встречи не найден", 404);
    if (!from || !to)
      return error("VALIDATION_ERROR", "from/to обязательны", 400);

    const days: DayAvailability[] = eachDate(from, to).map((date) => {
      const count = generateSlots(date, et.durationMinutes).length;
      return { date, available: count > 0, slotCount: count };
    });
    return HttpResponse.json(days);
  }),

  // --- Слоты дня ---
  http.get("/api/slots", ({ request }) => {
    const url = new URL(request.url);
    const eventTypeId = url.searchParams.get("eventTypeId");
    const date = url.searchParams.get("date");
    const et = state.eventTypes.find((e) => e.id === eventTypeId);
    if (!et) return error("NOT_FOUND", "Тип встречи не найден", 404);
    if (!date) return error("VALIDATION_ERROR", "date обязателен", 400);
    return HttpResponse.json(generateSlots(date, et.durationMinutes));
  }),

  // --- Создание брони ---
  http.post("/api/bookings", async ({ request }) => {
    const body = (await request.json()) as BookingCreate;
    const et = state.eventTypes.find((e) => e.id === body.eventTypeId);
    if (!et) return error("NOT_FOUND", "Тип встречи не найден", 404);
    if (!body.slotStart || !body.name || !body.email) {
      return error("VALIDATION_ERROR", "Заполните обязательные поля", 400);
    }

    const start = new Date(body.slotStart);
    const end = new Date(start.getTime() + et.durationMinutes * 60_000);

    const taken = state.bookings.some((b) => {
      const bStart = new Date(b.slotStart).getTime();
      const bEnd = new Date(b.slotEnd).getTime();
      return start.getTime() < bEnd && end.getTime() > bStart;
    });
    if (taken) return error("SLOT_TAKEN", "Слот уже занят", 409);

    const booking: Booking = {
      id: `bk-${state.seq++}`,
      eventTypeId: body.eventTypeId,
      slotStart: start.toISOString(),
      slotEnd: end.toISOString(),
      name: body.name,
      email: body.email,
      note: body.note,
      createdAt: new Date().toISOString(),
    };
    state.bookings.push(booking);
    return HttpResponse.json(booking, { status: 201 });
  }),

  // --- Получить бронь ---
  http.get("/api/bookings/:id", ({ params }) => {
    const booking = state.bookings.find((b) => b.id === params.id);
    if (!booking) return error("NOT_FOUND", "Бронирование не найдено", 404);
    return HttpResponse.json(booking);
  }),

  // --- Admin: список встреч ---
  http.get("/api/admin/bookings", ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let list = [...state.bookings];
    if (from) list = list.filter((b) => b.slotStart >= `${from}T00:00:00Z`);
    if (to) list = list.filter((b) => b.slotStart <= `${to}T23:59:59Z`);
    list.sort((a, b) => a.slotStart.localeCompare(b.slotStart));
    const withEt: BookingWithEventType[] = list.map((b) => ({
      ...b,
      eventType: state.eventTypes.find((e) => e.id === b.eventTypeId)!,
    }));
    return HttpResponse.json(withEt);
  }),

  // --- Admin: все типы ---
  http.get("/api/admin/event-types", () => {
    return HttpResponse.json<EventType[]>(state.eventTypes);
  }),

  // --- Admin: создать тип ---
  http.post("/api/admin/event-types", async ({ request }) => {
    const body = (await request.json()) as EventTypeCreate;
    if (!body.name || !body.slug || !body.durationMinutes) {
      return error("VALIDATION_ERROR", "Заполните обязательные поля", 400);
    }
    const et: EventType = {
      id: `et-${state.seq++}`,
      name: body.name,
      slug: body.slug,
      durationMinutes: body.durationMinutes,
      description: body.description,
      active: body.active ?? true,
    };
    state.eventTypes.push(et);
    return HttpResponse.json(et, { status: 201 });
  }),

  // --- Admin: обновить тип ---
  http.patch("/api/admin/event-types/:id", async ({ params, request }) => {
    const et = state.eventTypes.find((e) => e.id === params.id);
    if (!et) return error("NOT_FOUND", "Тип встречи не найден", 404);
    const body = (await request.json()) as EventTypeUpdate;
    if (body.name !== undefined) et.name = body.name;
    if (body.slug !== undefined) et.slug = body.slug;
    if (body.durationMinutes !== undefined)
      et.durationMinutes = body.durationMinutes;
    if (body.description !== undefined) et.description = body.description;
    if (body.active !== undefined) et.active = body.active;
    return HttpResponse.json(et);
  }),

  // --- Admin: удалить тип ---
  http.delete("/api/admin/event-types/:id", ({ params }) => {
    const et = state.eventTypes.find((e) => e.id === params.id);
    if (!et) return error("NOT_FOUND", "Тип встречи не найден", 404);
    const inUse = state.bookings.some((b) => b.eventTypeId === et.id);
    if (inUse) {
      return error(
        "EVENT_TYPE_IN_USE",
        "На тип ссылаются бронирования, используйте деактивацию",
        409,
      );
    }
    state.eventTypes = state.eventTypes.filter((e) => e.id !== et.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
