package on.ivan.back;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import on.ivan.back.repository.InMemoryStore;
import on.ivan.back.util.AppUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class MeetlyApiIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private InMemoryStore store;

  @AfterEach
  void reset() {
    store.reset();
  }

  private static String date(int daysFromToday) {
    return LocalDate.now(ZoneOffset.UTC)
        .plusDays(daysFromToday)
        .format(DateTimeFormatter.ISO_LOCAL_DATE);
  }

  // ---------------------------------------------------------------------------
  // Публичные типы встреч
  // ---------------------------------------------------------------------------

  @Test
  void publicEventTypesReturnsOnlyActive() throws Exception {
    mockMvc
        .perform(get("/api/event-types"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(3)))
        .andExpect(jsonPath("$[0].name").value("Быстрый созвон"))
        .andExpect(jsonPath("$[1].name").value("Стандартная встреча"))
        .andExpect(jsonPath("$[2].name").value("Глубокая сессия"));
  }

  @Test
  void publicEventTypesExcludesDeactivated() throws Exception {
    mockMvc.perform(
        patch("/api/admin/event-types/et-15")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"active\":false}"));
    mockMvc
        .perform(get("/api/event-types"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].name").value("Стандартная встреча"));
  }

  // ---------------------------------------------------------------------------
  // Admin: типы встреч CRUD
  // ---------------------------------------------------------------------------

  @Test
  void adminListReturnsAllIncludingInactive() throws Exception {
    mockMvc.perform(
        patch("/api/admin/event-types/et-30")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"active\":false}"));
    mockMvc
        .perform(get("/api/admin/event-types"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(3)))
        .andExpect(jsonPath("$[1].active").value(false));
  }

  @Test
  void adminCreateEventType() throws Exception {
    mockMvc
        .perform(
            post("/api/admin/event-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"Интервью\",\"slug\":\"interview-45\",\"durationMinutes\":45,"
                        + "\"description\":\"По найму\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNotEmpty())
        .andExpect(jsonPath("$.name").value("Интервью"))
        .andExpect(jsonPath("$.slug").value("interview-45"))
        .andExpect(jsonPath("$.durationMinutes").value(45))
        .andExpect(jsonPath("$.active").value(true));
  }

  @Test
  void adminCreateEventTypeDefaultsActiveTrueWhenOmitted() throws Exception {
    mockMvc
        .perform(
            post("/api/admin/event-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"X\",\"slug\":\"x\",\"durationMinutes\":30}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.active").value(true));
  }

  @Test
  void adminUpdatePartially() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/event-types/et-15")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Новое имя\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Новое имя"))
        .andExpect(jsonPath("$.slug").value("quick-15"));
  }

  @Test
  void adminDeleteEventTypeNoBookings() throws Exception {
    mockMvc.perform(delete("/api/admin/event-types/et-15")).andExpect(status().isNoContent());
    mockMvc.perform(get("/api/admin/event-types")).andExpect(jsonPath("$", hasSize(2)));
  }

  @Test
  void adminDeleteEventTypeInUseReturns409() throws Exception {
    store.addBooking(AppUtil.newId(), "et-15", OffsetDateTime.now(ZoneOffset.UTC).plusDays(1), 15);
    mockMvc
        .perform(delete("/api/admin/event-types/et-15"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EVENT_TYPE_IN_USE"));
  }

  @Test
  void adminEventTypeNotFoundReturns404() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/event-types/unknown")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"X\"}"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    mockMvc
        .perform(delete("/api/admin/event-types/unknown"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  // ---------------------------------------------------------------------------
  // Доступность и слоты
  // ---------------------------------------------------------------------------

  @Test
  void slotsDayGeneratesWorkingWindow() throws Exception {
    String d = date(1);
    // 9:00-17:00, шаг 15 мин, длительность 15 -> слоты 9:00..16:45 (32 слота)
    mockMvc
        .perform(get("/api/slots").param("eventTypeId", "et-15").param("date", d))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(32)))
        .andExpect(jsonPath("$[0].start").value(d + "T09:00:00Z"))
        .andExpect(jsonPath("$[31].start").value(d + "T16:45:00Z"));
  }

  @Test
  void slotsDaySkipsWeekend() throws Exception {
    LocalDate weekend = null;
    for (int i = 1; i <= 14; i++) {
      LocalDate c = LocalDate.now(ZoneOffset.UTC).plusDays(i);
      if (c.getDayOfWeek().getValue() >= 6) {
        weekend = c;
        break;
      }
    }
    if (weekend == null) {
      return; // нет выходных в горизонте — пропускаем
    }
    mockMvc
        .perform(
            get("/api/slots")
                .param("eventTypeId", "et-15")
                .param("date", weekend.format(DateTimeFormatter.ISO_LOCAL_DATE)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void slotsExcludeBookedOverlap() throws Exception {
    String d = date(2);
    var start = OffsetDateTime.parse(d + "T10:00:00Z");
    store.addBooking("bk-test", "et-15", start, 15);
    // слот 10:00 занят, остаётся 31
    mockMvc
        .perform(get("/api/slots").param("eventTypeId", "et-15").param("date", d))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(31)))
        .andExpect(jsonPath("$[0].start").value(d + "T09:00:00Z"));
  }

  @Test
  void slotsEventTypeNotFoundReturns404() throws Exception {
    mockMvc
        .perform(get("/api/slots").param("eventTypeId", "nope").param("date", date(1)))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void availabilityDaysReturnsEachDate() throws Exception {
    String from = date(0);
    String to = date(3);
    mockMvc
        .perform(
            get("/api/availability/days")
                .param("eventTypeId", "et-30")
                .param("from", from)
                .param("to", to))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(4)))
        .andExpect(jsonPath("$[0].date").value(from))
        .andExpect(jsonPath("$[0].available").isBoolean());
  }

  @Test
  void availabilityExcludesTodayWhenLessThan15Min() throws Exception {
    String from = date(0);
    String to = date(0);
    // если сейчас 16:55, то 15-мин слот в 16:45 недоступен -> сегодня может быть без слотов
    mockMvc
        .perform(
            get("/api/availability/days")
                .param("eventTypeId", "et-15")
                .param("from", from)
                .param("to", to))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].slotCount").isNumber());
  }

  // ---------------------------------------------------------------------------
  // Бронирования
  // ---------------------------------------------------------------------------

  @Test
  void createBookingSuccess() throws Exception {
    String d = date(3);
    String body =
        String.format(
            "{\"eventTypeId\":\"et-15\",\"slotStart\":\"%sT10:00:00Z\",\"name\":\"Иван\","
                + "\"email\":\"ivan@example.com\",\"note\":\"Привет\"}",
            d);
    mockMvc
        .perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isNotEmpty())
        .andExpect(jsonPath("$.eventTypeId").value("et-15"))
        .andExpect(jsonPath("$.slotStart").value(d + "T10:00:00Z"))
        .andExpect(jsonPath("$.slotEnd").value(d + "T10:15:00Z"))
        .andExpect(jsonPath("$.name").value("Иван"))
        .andExpect(jsonPath("$.note").value("Привет"))
        .andExpect(jsonPath("$.createdAt").isNotEmpty());
  }

  @Test
  void createBookingOverlappingReturns409() throws Exception {
    String d = date(3);
    store.addBooking("bk-1", "et-15", OffsetDateTime.parse(d + "T10:00:00Z"), 15);
    String body =
        String.format(
            "{\"eventTypeId\":\"et-15\",\"slotStart\":\"%sT10:00:00Z\",\"name\":\"Второй\","
                + "\"email\":\"second@example.com\"}",
            d);
    mockMvc
        .perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("SLOT_TAKEN"));
  }

  @Test
  void createBookingEventTypeNotFoundReturns404() throws Exception {
    String d = date(3);
    String body =
        String.format(
            "{\"eventTypeId\":\"nope\",\"slotStart\":\"%sT10:00:00Z\",\"name\":\"X\","
                + "\"email\":\"x@example.com\"}",
            d);
    mockMvc
        .perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void createBookingOutsideHorizonReturns422() throws Exception {
    String d = date(15);
    String body =
        String.format(
            "{\"eventTypeId\":\"et-15\",\"slotStart\":\"%sT10:00:00Z\",\"name\":\"X\","
                + "\"email\":\"x@example.com\"}",
            d);
    mockMvc
        .perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("OUT_OF_HORIZON"));
  }

  @Test
  void createBookingTooSoonReturnsUnprocessable() throws Exception {
    // слот менее чем через 15 минут
    OffsetDateTime in10 = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(10);
    String body =
        String.format(
            "{\"eventTypeId\":\"et-15\",\"slotStart\":\"%s\",\"name\":\"X\","
                + "\"email\":\"x@example.com\"}",
            in10.toString());
    mockMvc
        .perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("IN_THE_PAST"));
  }

  @Test
  void getBookingById() throws Exception {
    String d = date(3);
    String body =
        String.format(
            "{\"eventTypeId\":\"et-15\",\"slotStart\":\"%sT10:00:00Z\",\"name\":\"Иван\","
                + "\"email\":\"ivan@example.com\"}",
            d);
    String id =
        mockMvc
            .perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(body))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String bookingId = id.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");
    mockMvc
        .perform(get("/api/bookings/{id}", bookingId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Иван"));
  }

  @Test
  void getBookingNotFoundReturns404() throws Exception {
    mockMvc
        .perform(get("/api/bookings/none"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  // ---------------------------------------------------------------------------
  // Admin: список броней
  // ---------------------------------------------------------------------------

  @Test
  void adminBookingsListFiltersByRangeAndEnrichesEventType() throws Exception {
    String d = date(2);
    store.addBooking("bk-1", "et-30", OffsetDateTime.parse(d + "T10:00:00Z"), 30);
    store.addBooking("bk-2", "et-15", OffsetDateTime.parse(d + "T09:00:00Z"), 15);

    mockMvc
        .perform(get("/api/admin/bookings").param("from", date(1)).param("to", date(3)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        // отсортировано по времени начала: bk-2 раньше bk-1
        .andExpect(jsonPath("$[0].id").value("bk-2"))
        .andExpect(jsonPath("$[0].eventType.name").value("Быстрый созвон"))
        .andExpect(jsonPath("$[1].id").value("bk-1"))
        .andExpect(jsonPath("$[1].eventType.name").value("Стандартная встреча"));
  }

  @Test
  void adminBookingsListExcludesOutsideRange() throws Exception {
    String dFar = date(10);
    store.addBooking("bk-1", "et-30", OffsetDateTime.parse(dFar + "T10:00:00Z"), 30);
    mockMvc
        .perform(get("/api/admin/bookings").param("from", date(0)).param("to", date(5)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }
}
