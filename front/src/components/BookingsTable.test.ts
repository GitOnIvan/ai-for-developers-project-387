import { render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import BookingsTable from "./BookingsTable.vue";
import { resetData, state } from "../mocks/data";
import { DateTimeUtil } from "../utils/datetime";

beforeEach(() => resetData());
afterEach(() => resetData());

describe("BookingsTable", () => {
  it("показывает сообщение о пустом списке", async () => {
    render(BookingsTable);
    expect(
      await screen.findByText(/нет запланированных встреч/i),
    ).toBeInTheDocument();
  });

  it("показывает предстоящие встречи с типом и гостем", async () => {
    const today = DateTimeUtil.toLocalDateString(
      DateTimeUtil.addDays(new Date(), 1),
    );
    state.bookings.push({
      id: "bk-1",
      eventTypeId: "et-30",
      slotStart: `${today}T10:00:00.000Z`,
      slotEnd: `${today}T10:30:00.000Z`,
      name: "Анна",
      email: "anna@example.com",
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    render(BookingsTable);
    expect(await screen.findByText("Анна")).toBeInTheDocument();
    expect(screen.getByText("Стандартная встреча")).toBeInTheDocument();
    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
  });
});
