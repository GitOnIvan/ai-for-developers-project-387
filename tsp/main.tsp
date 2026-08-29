import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

/**
 * Lightweight Cal.com-подобный сервис записи на встречи.
 *
 * Один глобальный календарь, без авторизации. Владелец публикует типы встреч
 * (разной длительности), гость выбирает тип, день и свободный слот, и бронирует.
 *
 * Все временные метки — в UTC (ISO 8601). Конвертация в локальный часовой пояс
 * выполняется на клиенте.
 */
@service(#{ title: "Meetly API" })
@info(#{ version: "1.0.0" })
@server("http://localhost:8080", "Local dev")
namespace MeetlyApi;

// ---------------------------------------------------------------------------
// Общие типы
// ---------------------------------------------------------------------------

/** Дата в формате ISO `YYYY-MM-DD`. */
@pattern("^\\d{4}-\\d{2}-\\d{2}$")
scalar LocalDate extends string;

/** Машиночитаемый код ошибки. */
enum ErrorCode {
  VALIDATION_ERROR,
  NOT_FOUND,
  SLOT_TAKEN,
  SLOT_UNAVAILABLE,
  OUT_OF_HORIZON,
  IN_THE_PAST,
  EVENT_TYPE_IN_USE,
}

/** Единый формат тела ошибки для всех эндпоинтов. */
@error
model ApiError {
  /** Машиночитаемый код ошибки. */
  code: ErrorCode;

  /** Человекочитаемое описание. */
  message: string;

  /** Необязательные детали (например, поля, не прошедшие валидацию). */
  details?: Record<unknown>;
}

// ---------------------------------------------------------------------------
// Типы встреч (EventType) — единственная редактируемая сущность
// ---------------------------------------------------------------------------

/** Тип встречи: имя + длительность. Добавление нового типа = одна запись. */
model EventType {
  /** Идентификатор типа встречи. */
  @visibility(Lifecycle.Read)
  id: string;

  /** Отображаемое имя, например «Быстрый созвон». */
  @minLength(1)
  @maxLength(120)
  name: string;

  /** Человекочитаемый уникальный slug, например `quick-15`. */
  @pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
  slug: string;

  /** Длительность встречи в минутах (например, 15, 30, 120). */
  @minValue(1)
  @maxValue(1440)
  durationMinutes: int32;

  /** Необязательное описание. */
  @maxLength(1000)
  description?: string;

  /** Активен ли тип. Неактивные не показываются гостям. */
  active: boolean;
}

/** Тело запроса на создание типа встречи. */
model EventTypeCreate {
  @minLength(1)
  @maxLength(120)
  name: string;

  @pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
  slug: string;

  @minValue(1)
  @maxValue(1440)
  durationMinutes: int32;

  @maxLength(1000)
  description?: string;

  /** По умолчанию `true`. */
  active?: boolean;
}

/** Тело запроса на частичное обновление типа встречи. */
model EventTypeUpdate {
  @minLength(1)
  @maxLength(120)
  name?: string;

  @pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
  slug?: string;

  @minValue(1)
  @maxValue(1440)
  durationMinutes?: int32;

  @maxLength(1000)
  description?: string;

  active?: boolean;
}

// ---------------------------------------------------------------------------
// Доступность (вычисляемые сущности)
// ---------------------------------------------------------------------------

/** Доступность одного дня — для рендера календаря. */
model DayAvailability {
  /** День (UTC-дата). */
  date: LocalDate;

  /** Есть ли хотя бы один свободный слот в этот день. */
  available: boolean;

  /** Количество свободных слотов в этот день. */
  slotCount: int32;
}

/** Свободный слот времени. */
model Slot {
  /** Начало слота (UTC, ISO 8601). */
  start: utcDateTime;

  /** Конец слота (UTC, ISO 8601), = start + durationMinutes типа встречи. */
  end: utcDateTime;
}

// ---------------------------------------------------------------------------
// Бронирования
// ---------------------------------------------------------------------------

/** Бронирование встречи. */
model Booking {
  /** Идентификатор бронирования. */
  id: string;

  /** Идентификатор выбранного типа встречи. */
  eventTypeId: string;

  /** Начало встречи (UTC). */
  slotStart: utcDateTime;

  /** Конец встречи (UTC). */
  slotEnd: utcDateTime;

  /** Имя гостя. */
  name: string;

  /** Email гостя. */
  email: string;

  /** Необязательная заметка от гостя. */
  note?: string;

  /** Момент создания брони (UTC). */
  createdAt: utcDateTime;
}

/** Бронирование с развёрнутым типом встречи (для списка владельца). */
model BookingWithEventType {
  ...Booking;

  /** Развёрнутый тип встречи. */
  eventType: EventType;
}

/** Тело запроса на создание бронирования. */
model BookingCreate {
  /** Идентификатор выбранного типа встречи. */
  eventTypeId: string;

  /** Начало выбранного слота (UTC). Должно совпадать со свободным слотом. */
  slotStart: utcDateTime;

  /** Имя гостя. */
  @minLength(1)
  @maxLength(200)
  name: string;

  /** Email гостя. */
  @format("email")
  @maxLength(320)
  email: string;

  /** Необязательная заметка. */
  @maxLength(2000)
  note?: string;
}

// ===========================================================================
// Публичные операции (гость)
// ===========================================================================

@tag("EventTypes")
@route("/api/event-types")
interface EventTypes {
  /** Список активных типов встреч. */
  @get
  list(): EventType[];
}

@tag("Availability")
@route("/api/availability")
interface Availability {
  /**
   * Доступность по дням в диапазоне `[from, to]` для выбранного типа встречи.
   * Используется для подсветки кликабельных/некликабельных дней в календаре.
   */
  @get
  @route("days")
  days(
    /** Идентификатор типа встречи. */
    @query eventTypeId: string,

    /** Начало диапазона (включительно), UTC-дата. */
    @query from: LocalDate,

    /** Конец диапазона (включительно), UTC-дата. */
    @query to: LocalDate,
  ): DayAvailability[];
}

@tag("Slots")
@route("/api/slots")
interface Slots {
  /** Свободные слоты выбранного типа встречи на конкретный день. */
  @get
  list(
    /** Идентификатор типа встречи. */
    @query eventTypeId: string,

    /** День (UTC-дата). */
    @query date: LocalDate,
  ): Slot[];
}

@tag("Bookings")
@route("/api/bookings")
interface Bookings {
  /**
   * Создать бронирование.
   * Сервер перепроверяет доступность слота и атомарно защищается от гонок.
   */
  @post
  @returnsDoc("Бронирование создано.")
  create(@body body: BookingCreate):
    | {
        @statusCode statusCode: 201;
        @body booking: Booking;
      }
    | ApiError;

  /** Получить бронирование по идентификатору (страница подтверждения). */
  @get
  get(@path id: string): Booking | ApiError;
}

// ===========================================================================
// Операции владельца (без авторизации)
// ===========================================================================

@tag("Admin")
@route("/api/admin/bookings")
interface AdminBookings {
  /** Список предстоящих встреч в диапазоне, отсортирован по времени начала. */
  @get
  list(
    /** Начало диапазона (включительно), UTC-дата. */
    @query from: LocalDate,

    /** Конец диапазона (включительно), UTC-дата. */
    @query to: LocalDate,
  ): BookingWithEventType[];
}

@tag("Admin")
@route("/api/admin/event-types")
interface AdminEventTypes {
  /** Список всех типов встреч, включая неактивные. */
  @get
  list(): EventType[];

  /** Создать тип встречи. */
  @post
  create(@body body: EventTypeCreate):
    | {
        @statusCode statusCode: 201;
        @body eventType: EventType;
      }
    | ApiError;

  /** Частично обновить тип встречи (в т.ч. `active=false` — мягкое отключение). */
  @patch
  update(@path id: string, @body body: EventTypeUpdate): EventType | ApiError;

  /**
   * Удалить тип встречи.
   * Если на тип ссылаются будущие бронирования — возвращает 409 `EVENT_TYPE_IN_USE`;
   * в этом случае следует использовать мягкое отключение (`active=false`).
   */
  @delete
  delete(@path id: string):
    | {
        @statusCode statusCode: 204;
      }
    | ApiError;
}
