# API Mapping

Base URL examples:

- Android emulator -> `http://10.0.2.2:8080`
- iOS simulator -> `http://localhost:8080`
- Physical device -> `http://<your-lan-ip>:8080`

All endpoints are relative to the base URL.

## POI

### Get nearby toilets

`GET /api/v1/pois/nearby?lat={lat}&lon={lon}&radius={meters}`

Response body (wrapped):

```
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "...",
      "address": "...",
      "latitude": 37.0,
      "longitude": 127.0,
      "openingHours": "..."
    }
  ]
}
```

### Get toilets along a route

`POST /api/v1/pois/along-route?radius={meters}`

Request body:

```
[
  { "lat": 37.0, "lon": 127.0 },
  { "lat": 37.1, "lon": 127.1 }
]
```

Response is the same wrapper as nearby.

## Riding

### Create a riding

`POST /api/v1/ridings`

Request body (`RidingCreateRequest`):

```
{
  "deviceUuid": "...",
  "userId": null,
  "title": "Morning ride",
  "totalDistance": 1234.5,
  "totalTime": 600,
  "avgSpeed": 12.3,
  "path": [
    { "lat": 37.0, "lon": 127.0 }
  ]
}
```

Response:

- `200 OK` with a raw number body (ridingId)

Notes:

- The current backend implementation accepts anonymous rides as long as `deviceUuid` is present.

## Locations (future)

The backend already provides location history/update endpoints under `/api/v1/locations`, but they require an existing `userId`.

When user creation/auth is implemented, the mobile app can add:

- `POST /api/v1/locations/{userId}`: push current position
- `GET /api/v1/locations/{userId}/current`: latest position
