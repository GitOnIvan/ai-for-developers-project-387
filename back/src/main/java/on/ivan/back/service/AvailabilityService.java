package on.ivan.back.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import model.Booking;
import model.DayAvailability;
import model.ErrorCode;
import model.EventType;
import model.Slot;
import on.ivan.back.exception.ApiException;
import on.ivan.back.repository.InMemoryStore;
import on.ivan.back.util.DateTimeUtil;
import org.springframework.stereotype.Service;

/** Вычисление доступности и свободных слотов. Изолирован от HTTP-контекста. */
@Service
public class AvailabilityService {

  private final InMemoryStore store;

  public AvailabilityService(InMemoryStore store) {
    this.store = store;
  }

  /**
   * Свободные слоты для типа встречи на конкретный день.
   *
   * <p>Слот исключается, если: день не рабочий, дата вне горизонта бронирования, до его начала
   * меньше {@link DateTimeUtil#LEAD_TIME_MINUTES}, либо он пересекается с существующей бронью.
   */
  public List<Slot> slotsForDay(String eventTypeId, LocalDate date) {
    EventType eventType =
        store
            .findEventType(eventTypeId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Тип встречи не найден"));
    return computeSlots(eventType, date);
  }

  /** Доступность по дням в диапазоне {@code [from, to]}. */
  public List<DayAvailability> daysAvailability(String eventTypeId, LocalDate from, LocalDate to) {
    EventType eventType =
        store
            .findEventType(eventTypeId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Тип встречи не найден"));
    List<DayAvailability> result = new ArrayList<>();
    for (LocalDate date : DateTimeUtil.datesBetween(from, to)) {
      int count = computeSlots(eventType, date).size();
      result.add(new DayAvailability(date.toString(), count > 0, count));
    }
    return result;
  }

  private List<Slot> computeSlots(EventType eventType, LocalDate date) {
    if (!DateTimeUtil.isWorkDay(date) || !DateTimeUtil.isWithinHorizon(date)) {
      return List.of();
    }
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    OffsetDateTime earliest = DateTimeUtil.earliestSlotStart(now);

    List<Booking> dayBookings = new ArrayList<>();
    for (Booking b : store.allBookings()) {
      if (b.getSlotStart().toLocalDate().equals(date)) {
        dayBookings.add(b);
      }
    }

    int duration = eventType.getDurationMinutes();
    List<Slot> slots = new ArrayList<>();
    int windowStartMin = DateTimeUtil.WORK_START.getHour() * 60;
    int windowEndMin = DateTimeUtil.WORK_END.getHour() * 60;

    for (int minutes = windowStartMin;
        minutes + duration <= windowEndMin;
        minutes += DateTimeUtil.SLOT_STEP_MINUTES) {
      OffsetDateTime start = DateTimeUtil.atUtc(date, LocalTime.of(0, 0)).plusMinutes(minutes);
      OffsetDateTime end = start.plusMinutes(duration);
      if (start.isBefore(earliest)) {
        continue;
      }
      if (overlapsAny(start, end, dayBookings)) {
        continue;
      }
      slots.add(new Slot(start, end));
    }
    slots.sort(Comparator.comparing(Slot::getStart));
    return slots;
  }

  private boolean overlapsAny(OffsetDateTime start, OffsetDateTime end, List<Booking> bookings) {
    for (Booking b : bookings) {
      OffsetDateTime bStart = b.getSlotStart();
      OffsetDateTime bEnd = b.getSlotEnd();
      if (start.isBefore(bEnd) && end.isAfter(bStart)) {
        return true;
      }
    }
    return false;
  }
}
