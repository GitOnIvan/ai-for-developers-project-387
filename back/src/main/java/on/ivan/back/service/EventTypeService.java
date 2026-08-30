package on.ivan.back.service;

import java.util.List;
import model.EventType;
import model.EventTypeCreate;
import model.EventTypeUpdate;
import on.ivan.back.exception.ApiException;
import on.ivan.back.repository.InMemoryStore;
import on.ivan.back.util.AppUtil;
import org.springframework.stereotype.Service;

/** Операции владельца над типами встреч. */
@Service
public class EventTypeService {

  private final InMemoryStore store;

  public EventTypeService(InMemoryStore store) {
    this.store = store;
  }

  /** Все типы, включая неактивные. */
  public List<EventType> listAll() {
    return store.allEventTypes();
  }

  /** Только активные типы (для гостя). */
  public List<EventType> listActive() {
    return store.allEventTypes().stream().filter(EventType::getActive).toList();
  }

  public EventType create(EventTypeCreate body) {
    EventType created =
        new EventType(
                AppUtil.eventTypeId(),
                body.getName(),
                body.getSlug(),
                body.getDurationMinutes(),
                body.getActive() == null ? Boolean.TRUE : body.getActive())
            .description(body.getDescription());
    store.saveEventType(created);
    return created;
  }

  public EventType update(String id, EventTypeUpdate body) {
    EventType existing = requireEventType(id);
    if (body.getName() != null) existing.setName(body.getName());
    if (body.getSlug() != null) existing.setSlug(body.getSlug());
    if (body.getDurationMinutes() != null) existing.setDurationMinutes(body.getDurationMinutes());
    if (body.getDescription() != null) existing.setDescription(body.getDescription());
    if (body.getActive() != null) existing.setActive(body.getActive());
    store.saveEventType(existing);
    return existing;
  }

  public void delete(String id) {
    requireEventType(id);
    boolean inUse = !store.bookingForEventType(id).isEmpty();
    if (inUse) {
      throw new ApiException(
          model.ErrorCode.EVENT_TYPE_IN_USE,
          "На тип ссылаются бронирования, используйте деактивацию");
    }
    store.deleteEventType(id);
  }

  public EventType requireEventType(String id) {
    return store
        .findEventType(id)
        .orElseThrow(() -> new ApiException(model.ErrorCode.NOT_FOUND, "Тип встречи не найден"));
  }
}
