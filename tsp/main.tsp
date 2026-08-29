import "@typespec/http";
import "@typespec/openapi3"; // Для генерации openapi.yaml
import "@typespec/openapi";  // ОБЯЗАТЕЛЬНО: подгружает сам декоратор @operationId

using TypeSpec.Http;
using TypeSpec.OpenAPI;     // ИСПРАВЛЕНО: правильное пространство имен для @operationId

@service(#{
  title: "Calculator API"
})
@server("http://localhost:8080", "Локальный Java бэкенд")
namespace Calculator;

// 1. Описываем строгое перечисление операций
enum OperationType {
  add,
  sub,
  mul,
  div
}

// 2. Используем этот Enum в модели запроса
model CalculateRequest {
  a: float64;
  b: float64;
  operation: OperationType; // Теперь тут жесткий тип, а не просто строка!
}

model CalculateResponse {
  result: float64;
}

@error
model CalculatorError {
  @statusCode _: 400;
  @body message: string;
}

@route("/api/calculator")
@tag("Calculator") // ИСПРАВЛЕНО: перенесено на новую строку, теперь декоратор активен
interface CalculatorRoutes {
  @post
  @summary("Выполнить математическую операцию на бэкенде")
  @operationId("calculate") // Теперь скомпилируется без ошибок!
  calculate(@body body: CalculateRequest): CalculateResponse | CalculatorError;
}