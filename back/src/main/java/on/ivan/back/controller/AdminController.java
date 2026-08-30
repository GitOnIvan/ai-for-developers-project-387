package on.ivan.back.controller;

import api.AdminApi;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import model.BookingWithEventType;
import model.EventType;
import model.EventTypeCreate;
import model.EventTypeUpdate;
import on.ivan.back.service.BookingService;
import on.ivan.back.service.EventTypeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AdminController implements AdminApi {

  private final BookingService bookingService;
  private final EventTypeService eventTypeService;

  @Override
  public ResponseEntity<List<BookingWithEventType>> adminBookingsList(String from, String to) {
    return ResponseEntity.ok(
        bookingService.listForAdmin(LocalDate.parse(from), LocalDate.parse(to)));
  }

  @Override
  public ResponseEntity<EventType> adminEventTypesCreate(EventTypeCreate eventTypeCreate) {
    return ResponseEntity.status(HttpStatus.CREATED).body(eventTypeService.create(eventTypeCreate));
  }

  @Override
  public ResponseEntity<Void> adminEventTypesDelete(String id) {
    eventTypeService.delete(id);
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<List<EventType>> adminEventTypesList() {
    return ResponseEntity.ok(eventTypeService.listAll());
  }

  @Override
  public ResponseEntity<EventType> adminEventTypesUpdate(
      String id, EventTypeUpdate eventTypeUpdate) {
    return ResponseEntity.ok(eventTypeService.update(id, eventTypeUpdate));
  }
}
