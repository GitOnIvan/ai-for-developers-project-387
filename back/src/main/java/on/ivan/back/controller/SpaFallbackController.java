package on.ivan.back.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Перенаправляет SPA-маршруты (vue-router history mode) на index.html. */
@Controller
public class SpaFallbackController {

  @GetMapping(
      value = {
        "/booking",
        "/booking/{eventTypeId}",
        "/admin",
      })
  public String forward() {
    return "forward:/index.html";
  }
}
