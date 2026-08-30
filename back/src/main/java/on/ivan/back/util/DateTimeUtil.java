package on.ivan.back.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Утилиты для работы с датами/временем в UTC. Все временные метки API — UTC (ISO 8601), дни — {code
 * YYYY-MM-DD} (LocalDate).
 *
 * <p>Настройки доступности (рабочее окно, шаг слотов, рабочие дни, горизонт бронирования)
 * захардкожены здесь как константы — аналог seed-конфигурации в контракте.
 */
public final class DateTimeUtil {

  /** Горизонт бронирования в днях, включая текущий день. */
  public static final int HORIZON_DAYS = 14;

  /** Минимальное опережение до начала слота в минутах. */
  public static final int LEAD_TIME_MINUTES = 15;

  /** Шаг сетки слотов в минутах. */
  public static final int SLOT_STEP_MINUTES = 15;

  /** Начало рабочего окна (UTC). */
  public static final LocalTime WORK_START = LocalTime.of(9, 0);

  /** Конец рабочего окна (UTC). */
  public static final LocalTime WORK_END = LocalTime.of(17, 0);

  /** Рабочие дни (Пн–Пт). */
  public static final List<DayOfWeek> WORK_DAYS =
      List.of(
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY);

  private DateTimeUtil() {}

  /** Является ли день рабочим (Пн–Пт). */
  public static boolean isWorkDay(LocalDate date) {
    return WORK_DAYS.contains(date.getDayOfWeek());
  }

  /** Список дат включительно от {@code from} до {@code to}. */
  public static List<LocalDate> datesBetween(LocalDate from, LocalDate to) {
    List<LocalDate> result = new ArrayList<>();
    LocalDate cursor = from;
    while (!cursor.isAfter(to)) {
      result.add(cursor);
      cursor = cursor.plusDays(1);
    }
    return result;
  }

  /**
   * Самый ранний допустимый момент начала слота: сейчас + {@link #LEAD_TIME_MINUTES}. Слот,
   * начинающийся раньше этого момента, недоступен.
   */
  public static OffsetDateTime earliestSlotStart(OffsetDateTime now) {
    return now.plusMinutes(LEAD_TIME_MINUTES);
  }

  /** Находится ли дата в пределах горизонта бронирования (включая сегодня). */
  public static boolean isWithinHorizon(LocalDate date) {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    LocalDate last = today.plusDays(HORIZON_DAYS - 1L);
    return !date.isBefore(today) && !date.isAfter(last);
  }

  /** Последний день горизонта бронирования (today + {code HORIZON_DAYS} - 1). */
  public static LocalDate horizonEnd() {
    return LocalDate.now(ZoneOffset.UTC).plusDays(HORIZON_DAYS - 1L);
  }

  /** Строит UTC-момент для указанной даты и времени начала. */
  public static OffsetDateTime atUtc(LocalDate date, LocalTime time) {
    return OffsetDateTime.of(date, time, ZoneOffset.UTC);
  }
}
