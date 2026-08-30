import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EventTypeSelect from "./EventTypeSelect.vue";
import type { EventType } from "../api/generated";

const eventTypes: EventType[] = [
  {
    id: "et-15",
    name: "Быстрый созвон",
    slug: "quick-15",
    durationMinutes: 15,
    active: true,
  },
  {
    id: "et-30",
    name: "Встреча",
    slug: "meet-30",
    durationMinutes: 30,
    active: true,
  },
];

describe("EventTypeSelect", () => {
  it("показывает названия и длительность типов", () => {
    render(EventTypeSelect, { props: { eventTypes } });
    expect(screen.getByText("Быстрый созвон")).toBeInTheDocument();
    expect(screen.getByText("15 мин")).toBeInTheDocument();
    expect(screen.getByText("30 мин")).toBeInTheDocument();
  });

  it("эмитит select при клике по типу", async () => {
    const { emitted } = render(EventTypeSelect, { props: { eventTypes } });
    await userEvent.click(
      screen.getByRole("button", { name: /Быстрый созвон/ }),
    );
    const events = emitted().select;
    expect(events).toBeTruthy();
    expect((events[0] as EventType[])[0]).toMatchObject({ id: "et-15" });
    vi.clearAllMocks();
  });
});
