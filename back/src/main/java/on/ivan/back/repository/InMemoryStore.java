package on.ivan.back.repository;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;
import model.Booking;
import model.EventType;
import org.springframework.stereotype.Component;

/**
 * In-memory потокобезопасное хранилище всех сущностей (EventType, Booking). Настоящая БД
 * отсутствует — по архитектуре проекта используется {@code ConcurrentHashMap}.
 *
 * <p>Порядок типов встреч сохраняется вставки (seed → созданные) отдельным списком, чтобы отдавать
 * детерминированную последовательность, как в mock-данных фронтенда.
 */
@Component
public class InMemoryStore {

  private final Map<String, EventType> eventTypes = new ConcurrentHashMap<>();

  /** Порядок вставки типов встреч (детерминированный вывод). */
  private final List<String> eventTypeOrder = new CopyOnWriteArrayList<>();

  private final Map<String, Booking> bookings = new ConcurrentHashMap<>();

  public InMemoryStore() {
    seedEventTypes();
  }

  private void seedEventTypes() {
    putEventType(
        new EventType("et-15", "Быстрый созвон", "quick-15", 15, true)
            .description("Короткий 15-минутный разговор"));
    putEventType(
        new EventType("et-30", "Стандартная встреча", "standard-30", 30, true)
            .description("Получасовая встреча"));
    putEventType(
        new EventType("et-120", "Глубокая сессия", "deep-120", 120, true)
            .description("Двухчасовая рабочая сессия"));
  }

  private void putEventType(EventType et) {
    eventTypes.put(et.getId(), et);
    eventTypeOrder.add(et.getId());
  }

  /** Полный сброс состояния (для тестов). */
  public void reset() {
    eventTypes.clear();
    eventTypeOrder.clear();
    bookings.clear();
    seedEventTypes();
  }

  // --- EventType ---

  public Optional<EventType> findEventType(String id) {
    return Optional.ofNullable(eventTypes.get(id));
  }

  public List<EventType> allEventTypes() {
    return eventTypeOrder.stream().map(eventTypes::get).filter(Objects::nonNull).toList();
  }

  public void saveEventType(EventType eventType) {
    boolean isNew = !eventTypes.containsKey(eventType.getId());
    eventTypes.put(eventType.getId(), eventType);
    if (isNew) {
      eventTypeOrder.add(eventType.getId());
    }
  }

  public void deleteEventType(String id) {
    eventTypes.remove(id);
  }

  // --- Booking ---

  public Optional<Booking> findBooking(String id) {
    return Optional.ofNullable(bookings.get(id));
  }

  public List<Booking> allBookings() {
    return new ArrayList<>(bookings.values());
  }

  public void saveBooking(Booking booking) {
    bookings.put(booking.getId(), booking);
  }

  public List<Booking> bookingForEventType(String eventTypeId) {
    return bookings.values().stream()
        .filter(b -> b.getEventTypeId().equals(eventTypeId))
        .collect(Collectors.toList());
  }

  /** Тестовый помощник: создаёт и сохраняет бронь от {code start} длительностью {code minutes}. */
  public void addBooking(String id, String eventTypeId, OffsetDateTime start, int minutes) {
    Booking b =
        new Booking(
            id,
            eventTypeId,
            start,
            start.plusMinutes(minutes),
            "Гость",
            "guest@example.com",
            OffsetDateTime.now(ZoneOffset.UTC));
    bookings.put(b.getId(), b);
  }
}
