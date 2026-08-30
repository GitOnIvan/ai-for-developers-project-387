package on.ivan.back.util;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Общие утилиты приложения: генерация идентификаторов сущностей (EventType, Booking) в формате
 * монотонно возрастающих строк, как в mock-данных фронтенда.
 */
public final class AppUtil {

  private static final AtomicLong SEQ = new AtomicLong(0);

  private AppUtil() {}

  /** Генерирует новый идентификатор бронирования в формате {@code bk-<n>}. */
  public static String bookingId() {
    return "bk-" + SEQ.incrementAndGet();
  }

  /** Генерирует новый идентификатор типа встречи в формате {@code et-<n>}. */
  public static String eventTypeId() {
    return "et-" + SEQ.incrementAndGet();
  }

  /** Генерирует произвольный идентификатор в формате {@code et-<n>}. */
  public static String newId() {
    return "et-" + SEQ.incrementAndGet();
  }

  static void reset() {
    SEQ.set(0);
  }
}
