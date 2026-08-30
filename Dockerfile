# =============================================================================
# 1. Стадия контракта: генерируем OpenAPI (tsp/tsp-output/api.yaml) из TypeSpec
# =============================================================================
FROM node:24-alpine AS contract

WORKDIR /build/tsp

COPY tsp/package.json ./
RUN npm install

COPY tsp/main.tsp tsp/tspconfig.yaml ./
RUN npm run compile

# =============================================================================
# 2. Стадия фронтенда: сборка Vue SPA
# =============================================================================
FROM node:24-alpine AS frontend

WORKDIR /build/front

COPY front/package.json front/package-lock.json ./
RUN npm ci

COPY front/ ./
RUN npm run build

# =============================================================================
# 3. Стадия бэкенда: сборка Spring Boot jar
# =============================================================================
FROM maven:3.9-eclipse-temurin-21 AS backend

WORKDIR /build

# OpenAPI-контракт, сгенерированный на стадии contract
COPY --from=contract /build/tsp/tsp-output/api.yaml /build/tsp/tsp-output/api.yaml

COPY back/pom.xml /build/back/pom.xml
COPY back/mvnw /build/back/mvnw
COPY back/.mvn /build/back/.mvn
COPY back/src /build/back/src

RUN cd /build/back && ./mvnw -q -DskipTests package

# =============================================================================
# 4. Финальная стадия: рантайм с JRE
# =============================================================================
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=backend /build/back/target/back-0.0.1-SNAPSHOT.jar /app/app.jar
COPY --from=frontend /build/front/dist/ /app/static/

ENV PORT=8080
EXPOSE 8080

CMD ["java", "-jar", "/app/app.jar"]
