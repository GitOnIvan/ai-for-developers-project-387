package on.ivan.back.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import model.Booking;
import model.BookingCreate;
import model.BookingWithEventType;
import model.ErrorCode;
import model.EventType;
import on.ivan.back.exception.ApiException;
import on.ivan.back.repository.InMemoryStore;
import on.ivan.back.util.AppUtil;
import on.ivan.back.util.DateTimeUtil;
import org.springframework.stereotype.Service;

/** Операции над бронированиями (гость) и их асинхронный вывод владельцу. */
@Service
public class BookingService {

  private final InMemoryStore store;

  public BookingService(InMemoryStore store) {
    this.store = store;
  }

  /**
   * Создать бронирование. Сервер перепроверяет доступность слота и атомарно защищается от гонок
   * (проверки выполняются в пределах одного потока над потокобезопасным хранилищем).
   */
  public Booking create(BookingCreate body) {
    EventType eventType =
        store
            .findEventType(body.getEventTypeId())
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Тип встречи не найден"));

    OffsetDateTime start = body.getSlotStart();
    OffsetDateTime now = OffsetDateTime.now();
    if (start.isBefore(DateTimeUtil.earliestSlotStart(now))) {
      throw new ApiException(
          ErrorCode.IN_THE_PAST, "Нельзя забронировать слот менее чем за 15 минут до начала");
    }

    LocalDate date = start.toLocalDate();
    if (!DateTimeUtil.isWithinHorizon(date)) {
      throw new ApiException(
          ErrorCode.OUT_OF_HORIZON,
          "Бронирование доступно только в пределах " + DateTimeUtil.HORIZON_DAYS + " дней");
    }

    OffsetDateTime end = start.plusMinutes(eventType.getDurationMinutes());
    boolean taken = store.allBookings().stream().anyMatch(b -> overlaps(b, start, end));
    if (taken) {
      throw new ApiException(ErrorCode.SLOT_TAKEN, "Слот уже занят");
    }

    Booking booking =
        new Booking(
                AppUtil.bookingId(),
                body.getEventTypeId(),
                start,
                end,
                body.getName(),
                body.getEmail(),
                now)
            .note(body.getNote());
    store.saveBooking(booking);
    return booking;
  }

  public Booking get(String id) {
    return store
        .findBooking(id)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Бронирование не найдено"));
  }

  /** Список броней в диапазоне {@code [from, to]}, отсортированный по началу встречи. */
  public List<BookingWithEventType> listForAdmin(LocalDate from, LocalDate to) {
    return store.allBookings().stream()
        .filter(b -> !b.getSlotStart().toLocalDate().isBefore(from))
        .filter(b -> !b.getSlotStart().toLocalDate().isAfter(to))
        .sorted(Comparator.comparing(Booking::getSlotStart))
        .map(this::toWithEventType)
        .toList();
  }

  private BookingWithEventType toWithEventType(Booking booking) {
    EventType eventType = store.findEventType(booking.getEventTypeId()).orElse(null);
    return new BookingWithEventType(
        booking.getId(),
        booking.getEventTypeId(),
        booking.getSlotStart(),
        booking.getSlotEnd(),
        booking.getName(),
        booking.getEmail(),
        booking.getCreatedAt(),
        eventType);
  }

  private boolean overlaps(Booking b, OffsetDateTime start, OffsetDateTime end) {
    OffsetDateTime bStart = b.getSlotStart();
    OffsetDateTime bEnd = b.getSlotEnd();
    return start.isBefore(bEnd) && end.isAfter(bStart);
  }
}
