package on.ivan.back.controller;

import api.AvailabilityApi;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import model.DayAvailability;
import on.ivan.back.service.AvailabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AvailabilityController implements AvailabilityApi {

  private final AvailabilityService availabilityService;

  @Override
  public ResponseEntity<List<DayAvailability>> availabilityDays(
      String eventTypeId, String from, String to) {
    return ResponseEntity.ok(
        availabilityService.daysAvailability(
            eventTypeId, LocalDate.parse(from), LocalDate.parse(to)));
  }
}
