.PHONY: init generate test test-back test-front lint check-all

# 1. Быстрый старт для агента (установка окружения)
init:
	cd ./back && ./mvnw install -DskipTests
	cd ./front && npm install

# 2. API-First контракты (агент должен запускать это при изменении API)
generate:
	npx tsp compile ./tsp/main.tsp
	cd ./back && ./mvnw compile && \
	cd ./front && npm run generate-client

# 3. Полный TDD-цикл (главная команда для проверки агента)
test: test-back test-front

test-back:
	cd ./back && ./mvnw test

test-front:
	cd ./front && npx vitest run

# 4. Проверка качества кода (Строгая! Без || true, чтобы агент исправлял стиль)
lint:
	cd ./back && ./mvnw spotless:check
	cd ./front && npm run lint

# 5. Интеграционная проверка (Сборка БЕЗ склеивания фронта и бэка)
# Нужна агенту, чтобы проверить, что Java-код в принципе компилируется, а Vue собирается в dist
check-all: generate
	cd ./back && ./mvnw compile -DskipTests
	cd ./front && npm run build
