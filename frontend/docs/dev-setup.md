# Dev Setup

## Backend

Run the Spring Boot server on port 8080.

Confirm health by opening Swagger UI (SpringDoc):

- `http://localhost:8080/swagger-ui/index.html`

## Mobile

From `frontend/mobile/`:

1. Install deps: `npm install`
2. Start: `npm run start`

## Localhost note

On Android emulator, `localhost` inside the app points to the emulator itself.

Use:

- `http://10.0.2.2:8080` for Android emulator
