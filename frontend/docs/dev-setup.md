# Dev Setup

## Backend

Run the Spring Boot server on port 8080.

Confirm health by opening Swagger UI (SpringDoc):

- `http://localhost:8080/swagger-ui/index.html`

## Mobile

From `frontend/mobile/`:

1. Install deps: `npm install`
2. Start: `npm run start`
3. Web preview (optional): `npx expo start --web --port 8081`

## Web map provider

- Default (no key): OpenStreetMap(Leaflet) fallback
- Kakao map enable (web): set `EXPO_PUBLIC_KAKAO_MAP_APP_KEY`

Example `.env` in `frontend/mobile`:

```env
EXPO_PUBLIC_KAKAO_MAP_APP_KEY=YOUR_KAKAO_JAVASCRIPT_KEY
```

After setting, restart Expo with cache clear:

`npx expo start --web --clear --port 8081`

## Localhost note

On Android emulator, `localhost` inside the app points to the emulator itself.

Use:

- `http://10.0.2.2:8080` for Android emulator

## Port notes

- Recommended frontend dev port: `8081`
- If Expo asks for another port, stop old Metro process first and restart with explicit `--port 8081`.
