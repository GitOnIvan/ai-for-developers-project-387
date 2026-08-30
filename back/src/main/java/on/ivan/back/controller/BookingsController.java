package on.ivan.back.controller;

import api.BookingsApi;
import lombok.RequiredArgsConstructor;
import model.Booking;
import model.BookingCreate;
import on.ivan.back.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class BookingsController implements BookingsApi {

  private final BookingService bookingService;

  @Override
  public ResponseEntity<Booking> bookingsCreate(BookingCreate bookingCreate) {
    Booking booking = bookingService.create(bookingCreate);
    return ResponseEntity.status(HttpStatus.CREATED).body(booking);
  }

  @Override
  public ResponseEntity<Booking> bookingsGet(String id) {
    return ResponseEntity.ok(bookingService.get(id));
  }
}
