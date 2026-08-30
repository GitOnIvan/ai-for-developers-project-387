### Hexlet tests and linter status:
[![Actions Status](https://github.com/GitOnIvan/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/GitOnIvan/ai-for-developers-project-386/actions)

## Деплой (Docker)

Приложение упаковано в Docker-образ. Он собирает фронтенд (Vue) и бэкенд (Spring Boot) в одной картинке:
SPA раздаётся как статика, а REST API доступен по `/api`. Порт контейнера задаётся переменной окружения `PORT`.

### Сборка и запуск локально

```bash
docker build -t meetly .
docker run -p 8080:8080 -e PORT=8080 meetly
```

После запуска приложение доступно по адресу `http://localhost:8080` (порт из `PORT`).

### Публичная ссылка

Ссылка на опубликованное приложение будет добавлена сюда после деплоя на облачную платформу.