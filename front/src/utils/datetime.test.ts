import { describe, expect, it } from "vitest";
import { DateTimeUtil } from "./datetime";

describe("DateTimeUtil", () => {
  describe("toLocalDateString", () => {
    it("форматирует дату в YYYY-MM-DD по локальным компонентам", () => {
      const d = new Date(2026, 8, 1, 12, 0, 0); // 1 сентября 2026, локальное
      expect(DateTimeUtil.toLocalDateString(d)).toBe("2026-09-01");
    });

    it("дополняет нулями день и месяц", () => {
      const d = new Date(2026, 0, 5, 0, 0, 0);
      expect(DateTimeUtil.toLocalDateString(d)).toBe("2026-01-05");
    });
  });

  describe("formatTime", () => {
    it("форматирует UTC ISO в локальное HH:mm", () => {
      // Берём полночь UTC и проверяем, что результат — валидный HH:mm
      const result = DateTimeUtil.formatTime("2026-09-01T10:00:00Z");
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("addDays", () => {
    it("прибавляет дни", () => {
      const d = new Date(2026, 8, 1);
      const r = DateTimeUtil.addDays(d, 5);
      expect(DateTimeUtil.toLocalDateString(r)).toBe("2026-09-06");
    });

    it("корректно переходит через границу месяца", () => {
      const d = new Date(2026, 8, 30);
      const r = DateTimeUtil.addDays(d, 2);
      expect(DateTimeUtil.toLocalDateString(r)).toBe("2026-10-02");
    });
  });

  describe("monthRange", () => {
    it("возвращает первый и последний день месяца (0-based month)", () => {
      const { from, to } = DateTimeUtil.monthRange(2026, 8); // сентябрь
      expect(from).toBe("2026-09-01");
      expect(to).toBe("2026-09-30");
    });

    it("февраль високосного 2028 года заканчивается 29-го", () => {
      const { from, to } = DateTimeUtil.monthRange(2028, 1);
      expect(from).toBe("2028-02-01");
      expect(to).toBe("2028-02-29");
    });
  });

  describe("formatDate", () => {
    it("форматирует LocalDate строку в человекочитаемый вид", () => {
      const result = DateTimeUtil.formatDate("2026-09-01");
      expect(result).toContain("2026");
    });
  });
});
