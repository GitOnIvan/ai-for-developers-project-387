package on.ivan.back.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class DateTimeUtilTest {

  @Test
  void isWorkDayReturnsTrueForWeekdays() {
    assertThat(DateTimeUtil.isWorkDay(LocalDate.of(2026, 8, 31))) // понедельник
        .isTrue();
    assertThat(DateTimeUtil.isWorkDay(LocalDate.of(2026, 9, 4))) // пятница
        .isTrue();
  }

  @Test
  void isWorkDayReturnsFalseForWeekend() {
    assertThat(DateTimeUtil.isWorkDay(LocalDate.of(2026, 9, 5))) // суббота
        .isFalse();
    assertThat(DateTimeUtil.isWorkDay(LocalDate.of(2026, 9, 6))) // воскресенье
        .isFalse();
  }

  @Test
  void workDayOfWeekMatchesMondayToFriday() {
    assertThat(DateTimeUtil.WORK_DAYS)
        .containsExactly(
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY);
  }

  @Test
  void workingWindowIsNineToSeventeen() {
    assertThat(DateTimeUtil.WORK_START).isEqualTo(LocalTime.of(9, 0));
    assertThat(DateTimeUtil.WORK_END).isEqualTo(LocalTime.of(17, 0));
    assertThat(DateTimeUtil.SLOT_STEP_MINUTES).isEqualTo(15);
  }

  @Test
  void datesRangeIsInclusive() {
    var dates = DateTimeUtil.datesBetween(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 3));
    assertThat(dates)
        .containsExactly(
            LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 2), LocalDate.of(2026, 9, 3));
  }

  @Test
  void slotStartBlackoutBeforeLeadTime() {
    OffsetDateTime now = OffsetDateTime.parse("2026-09-01T10:00:00Z");
    OffsetDateTime tooSoon = OffsetDateTime.parse("2026-09-01T10:14:00Z");
    OffsetDateTime ok = OffsetDateTime.parse("2026-09-01T10:16:00Z");
    assertThat(tooSoon.isBefore(DateTimeUtil.earliestSlotStart(now))).isTrue();
    assertThat(ok.isAfter(DateTimeUtil.earliestSlotStart(now))).isTrue();
  }

  @Test
  void horizonIncludesToday() {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    LocalDate last = today.plusDays(DateTimeUtil.HORIZON_DAYS - 1);
    assertThat(DateTimeUtil.isWithinHorizon(today)).isTrue();
    assertThat(DateTimeUtil.isWithinHorizon(last)).isTrue();
    assertThat(DateTimeUtil.isWithinHorizon(last.plusDays(1))).isFalse();
    assertThat(DateTimeUtil.isWithinHorizon(today.minusDays(1))).isFalse();
  }
}
