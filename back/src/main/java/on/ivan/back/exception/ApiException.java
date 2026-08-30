package on.ivan.back.exception;

import lombok.Getter;
import model.ErrorCode;

/** Бизнес-исключение с машиночитаемым кодом {@link ErrorCode}. */
@Getter
public class ApiException extends RuntimeException {

  private final ErrorCode code;

  public ApiException(ErrorCode code, String message) {
    super(message);
    this.code = code;
  }

}
