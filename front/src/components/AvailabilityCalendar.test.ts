import { render, screen, waitFor } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import AvailabilityCalendar from "./AvailabilityCalendar.vue";
import { resetData } from "../mocks/data";

beforeEach(() => resetData());
afterEach(() => resetData());

describe("AvailabilityCalendar", () => {
  it("показывает календарь без избыточного заголовка", async () => {
    render(AvailabilityCalendar, { props: { eventTypeId: "et-30" } });
    expect(
      await screen.findByRole("region", { name: "Календарь" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Выберите день" }),
    ).not.toBeInTheDocument();
  });

  it("загружает доступные дни текущего месяца и заполняет allowedDates", async () => {
    const { getComponent } = renderWithRef({ eventTypeId: "et-30" });
    await waitFor(() => {
      expect(getComponent().allowedDates.length).toBeGreaterThan(0);
    });
    // Все доступные даты — рабочие дни (Пн–Пт), выходные исключены
    const dates = getComponent().allowedDates as string[];
    for (const d of dates) {
      const [y, m, day] = d.split("-").map(Number);
      const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
      expect([1, 2, 3, 4, 5]).toContain(dow);
    }
  });

  it("эмитит select-date при выборе дня", async () => {
    const { getComponent, emitted } = renderWithRef({ eventTypeId: "et-30" });
    await waitFor(() =>
      expect(getComponent().allowedDates.length).toBeGreaterThan(0),
    );
    getComponent().onSelect(new Date(2026, 8, 1));
    expect(emitted()["select-date"]).toBeTruthy();
    expect((emitted()["select-date"][0] as string[])[0]).toBe("2026-09-01");
  });
});

interface CalendarExposed {
  allowedDates: string[];
  loading: boolean;
  onSelect: (d: Date) => void;
}

// Хелпер: рендер с доступом к экспонированному экземпляру компонента.
function renderWithRef(props: { eventTypeId: string }) {
  let instance: CalendarExposed = {} as CalendarExposed;
  const utils = render({
    components: { AvailabilityCalendar },
    setup() {
      return {
        props,
        setRef: (el: unknown) => {
          if (el) instance = el as CalendarExposed;
        },
      };
    },
    template: `<AvailabilityCalendar :ref="setRef" :event-type-id="props.eventTypeId" @select-date="$emit('select-date', $event)" />`,
  });
  return { ...utils, getComponent: () => instance };
}
