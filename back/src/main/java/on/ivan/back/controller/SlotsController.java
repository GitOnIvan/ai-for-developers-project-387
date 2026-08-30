package on.ivan.back.controller;

import api.SlotsApi;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import model.Slot;
import on.ivan.back.service.AvailabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SlotsController implements SlotsApi {

  private final AvailabilityService availabilityService;

  @Override
  public ResponseEntity<List<Slot>> slotsList(String eventTypeId, String date) {
    return ResponseEntity.ok(availabilityService.slotsForDay(eventTypeId, LocalDate.parse(date)));
  }
}
