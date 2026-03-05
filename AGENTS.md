# Repository Agent Guide (Bike-project)

This file is for agentic coding assistants working in this repo. It documents how to build/test/run and the conventions to follow when making changes.

## Always-on Context (Prompt Baseline)

This repository is **backend-first** (Spring Boot), but changes should **consider the frontend (React Native/Expo)** impact when APIs/contracts are involved.

- Default priority: backend correctness, API stability, and tests.
- If a change affects API request/response shapes, auth, error codes, or URL paths:
  - Call it out explicitly in the response.
  - Consider whether frontend changes are needed; don’t modify frontend unless requested (or clearly required), and if required, explain why.
- No drive-by refactors: keep edits minimal and scoped to the request.
- Before destructive actions (delete files, reset history, large rewrites), ask first.
- Before finishing a code change: run the relevant tests/verification commands and report what was run + result.

## Stack Snapshot

- Language/runtime: Java 17 (Gradle toolchain)
- Framework: Spring Boot 3.5.x (Web, Data JPA, Security, Validation)
- DB: PostgreSQL + PostGIS (Hibernate Spatial + JTS)
- API docs: springdoc-openapi (Swagger UI)
- Build tool: Gradle Wrapper (`gradlew` / `gradlew.bat`)

## Rules Files

- Cursor rules: none found (`.cursor/rules/`, `.cursorrules`)
- Copilot instructions: none found (`.github/copilot-instructions.md`)

## Common Commands

Prefer the wrapper so everyone uses the same Gradle version.

Backend (run from `backend/`):

- Show Gradle + JVM info: `./gradlew --version`
- Clean build (runs tests): `./gradlew clean build`
- Compile only: `./gradlew classes`
- Run the app (dev): `./gradlew bootRun`
- Package runnable jar: `./gradlew bootJar`
- Run all tests: `./gradlew test`
- Run verification lifecycle: `./gradlew check`
- List tasks: `./gradlew tasks`

Windows equivalents use `gradlew.bat`:

- `gradlew.bat test`
- `gradlew.bat bootRun`

Frontend (React Native / Expo, run from `frontend/mobile/`):

- Install deps: `npm install`
- Start dev server: `npm run start`
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

## Running A Single Test (JUnit 5)

Gradle can filter tests by class/method.

- Single test class:
  - `./gradlew test --tests "com.bikeoasis.SomeTest"`
- Single test method:
  - `./gradlew test --tests "com.bikeoasis.SomeTest.someMethod"`
- Pattern match:
  - `./gradlew test --tests "*PoiService*"`

Useful flags:

- More logs: `./gradlew test --info`
- Stacktraces: `./gradlew test --stacktrace`
- Skip tests (only when asked): `./gradlew build -x test`

## Project Layout

Top-level:

- `backend/`: Spring Boot backend (primary)
- `frontend/`: design docs + React Native/Expo app (secondary, but consider API contract impact)
- `work-reports/`, `설계/`: project artifacts/docs

## Work Report Rules (Important)

- Before writing any new work report, always read:
  - `work-reports/README.md`
- Follow its template/filename/progress rules exactly.
- When finishing a meaningful work unit (tests pass + commit/push), add one report in `work-reports/`.

Backend (under `backend/src/main/java/com/bikeoasis/`):

- `domain/<area>/`
  - `controller/` HTTP endpoints
  - `service/` business logic + transactions
  - `repository/` Spring Data + custom queries
  - `entity/` JPA entities
  - `dto/` request/response DTOs
- `infrastructure/`: external API clients, integrations
- `global/`: cross-cutting config, error handling, response wrappers
- `backend/src/main/resources/application.yml`: local configuration (DB, API keys, etc)

## Code Style (Java)

There is no enforced formatter/linter configured in Gradle. Keep edits consistent with existing code.

- Indentation: 4 spaces; avoid tabs
- Braces: K&R style (`if (...) {`)
- Line length: be reasonable; wrap long method chains fluently
- Javadoc: only for public APIs or non-obvious logic (don’t narrate the obvious)

### Imports

- No wildcard imports (`import foo.*`)
- Prefer explicit imports; keep them organized (IDE optimize imports)
- Do not rely on unused imports compiling; remove them

### Naming

- Packages: lower-case (e.g. `com.bikeoasis.domain.poi`)
- Classes: `UpperCamelCase`
- Methods/fields: `lowerCamelCase`
- DTOs:
  - Requests: `XxxCreateRequest`, `XxxUpdateRequest`
  - Responses: `XxxResponse`, `XxxResponseDto`

### DTOs & Serialization

- Prefer immutable DTOs for responses:
  - Use `record` when it stays simple and stable
- For request DTOs:
  - Use validation annotations (`jakarta.validation.*`) and validate in controllers via `@Valid`
- Avoid exposing JPA entities directly from controllers

### Controller / Service / Repository Boundaries

- Controllers:
  - Handle HTTP concerns only (params, status codes, response shape)
  - Return `ResponseEntity<ApiResponse<...>>` using `ApiResponse.success(...)`
  - Keep endpoints under `/api/v1/...`
- Services:
  - Own business rules and transactions
  - Class-level `@Transactional(readOnly = true)` is fine; annotate write methods with `@Transactional`
- Repositories:
  - Prefer Spring Data derived queries; keep custom SQL/JPQL localized

### Error Handling

- Prefer throwing exceptions from services and letting `GlobalExceptionHandler` map to API responses
- Use `BusinessException` for domain/business failures (choose appropriate HTTP code)
- Avoid broad `try/catch` in controllers unless translating external/integration errors
- When logging exceptions:
  - Use `log.error("...", e)` for unexpected errors
  - Avoid logging secrets, passwords, raw tokens, or precise user location unless required

### Transactions & Data

- Keep transactional boundaries in the service layer
- For spatial data:
  - Coordinate order is typically `(lon, lat)` when constructing JTS `Coordinate`
  - Be explicit when converting between request DTOs and JTS geometries

## Configuration & Secrets

- Do not commit secrets (API keys, DB passwords) into the repo
- Prefer env var binding in YAML, e.g. `${SPRING_DATASOURCE_PASSWORD}`
- If you need local overrides, prefer a non-committed file like `application-local.yml` and activate a profile

## Testing Conventions

- Framework: JUnit 5 (`useJUnitPlatform()` is enabled)
- Prefer small-scope tests when possible:
  - `@WebMvcTest` for controller slices
  - `@DataJpaTest` for repository behavior
- Name tests `XxxServiceTest`, `XxxControllerTest`, etc.

## What To Do Before Finishing A Change

- Run: `./gradlew test` (or at least the impacted tests)
- If you touched DB/query logic: run the app and hit the relevant endpoint once
- Keep changes focused; avoid drive-by refactors unless requested
