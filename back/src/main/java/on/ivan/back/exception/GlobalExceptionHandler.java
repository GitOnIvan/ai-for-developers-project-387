package on.ivan.back.exception;

import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import model.ApiError;
import model.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Глобальная обработка ошибок: единый формат тела {@link ApiError}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  /** Маппинг машиночитаемого кода на HTTP-статус. */
  private static HttpStatus statusOf(ErrorCode code) {
    return switch (code) {
      case VALIDATION_ERROR -> HttpStatus.BAD_REQUEST;
      case NOT_FOUND -> HttpStatus.NOT_FOUND;
      case SLOT_TAKEN, EVENT_TYPE_IN_USE -> HttpStatus.CONFLICT;
      case SLOT_UNAVAILABLE, OUT_OF_HORIZON, IN_THE_PAST -> HttpStatus.UNPROCESSABLE_ENTITY;
    };
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handleApi(ApiException ex) {
    ApiError error = new ApiError(ex.getCode(), ex.getMessage());
    return ResponseEntity.status(statusOf(ex.getCode())).body(error);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, Object> details = new LinkedHashMap<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      details.put(fe.getField(), fe.getDefaultMessage());
    }
    ApiError error = new ApiError(ErrorCode.VALIDATION_ERROR, "Ошибка валидации полей");
    error.details(details);
    return ResponseEntity.badRequest().body(error);
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    ApiError error = new ApiError(ErrorCode.VALIDATION_ERROR, "Неверный формат параметра");
    return ResponseEntity.badRequest().body(error);
  }

  @ExceptionHandler(DateTimeParseException.class)
  public ResponseEntity<ApiError> handleDateParse(DateTimeParseException ex) {
    ApiError error = new ApiError(ErrorCode.VALIDATION_ERROR, "Неверный формат даты");
    return ResponseEntity.badRequest().body(error);
  }
}
