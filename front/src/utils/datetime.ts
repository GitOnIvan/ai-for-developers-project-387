/**
 * Утилиты работы с датой/временем.
 *
 * API оперирует UTC (ISO 8601), отображение — в локальном часовом поясе клиента.
 * Даты диапазонов передаются как `YYYY-MM-DD` (LocalDate).
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export const DateTimeUtil = {
  /** Дата → строка `YYYY-MM-DD` по локальным компонентам. */
  toLocalDateString(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  },

  /** UTC ISO → локальное время `HH:mm`. */
  formatTime(isoUtc: string): string {
    const d = new Date(isoUtc);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  },

  /** UTC ISO → локальные дата и время (для деталей встречи). */
  formatDateTime(isoUtc: string): string {
    const d = new Date(isoUtc);
    return d.toLocaleString();
  },

  /** LocalDate `YYYY-MM-DD` → человекочитаемая дата. */
  formatDate(localDate: string): string {
    const [y, m, d] = localDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  /** Прибавить дни к дате (возвращает новый Date). */
  addDays(date: Date, days: number): Date {
    const r = new Date(date);
    r.setDate(r.getDate() + days);
    return r;
  },

  /**
   * Диапазон дат месяца.
   * @param year полный год
   * @param month месяц 0-based (0 = январь)
   */
  monthRange(year: number, month: number): { from: string; to: string } {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return {
      from: DateTimeUtil.toLocalDateString(first),
      to: DateTimeUtil.toLocalDateString(last),
    };
  },
};
