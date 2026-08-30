package on.ivan.back.controller;

import api.EventTypesApi;
import java.util.List;
import lombok.RequiredArgsConstructor;
import model.EventType;
import on.ivan.back.service.EventTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EventTypesController implements EventTypesApi {

  private final EventTypeService eventTypeService;

  @Override
  public ResponseEntity<List<EventType>> eventTypesList() {
    return ResponseEntity.ok(eventTypeService.listActive());
  }
}
