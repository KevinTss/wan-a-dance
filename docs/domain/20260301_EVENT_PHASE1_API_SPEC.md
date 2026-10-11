# Event API Spec (Phase 1 - Implemented Routes)

## Base

- Base route: `/workspaces/:slug/events`
- Auth: `Authorization: Bearer <accessToken>`
- Response envelope:

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

## Visibility values

- `PRIVATE`
- `WORKSPACE` (only workspace members)
- `PUBLIC`

## Route: Create Event

`POST /workspaces/:slug/events`

### Access

- Requires authenticated user.
- Requires workspace membership.
- Requires role: `OWNER` or `TEACHER`.

### Request body

```json
{
  "title": "Recurring salsa fundamentals",
  "description": "Weekly class",
  "startAt": "2026-03-02T19:00:00.000Z",
  "endAt": "2026-03-02T20:00:00.000Z",
  "visibility": "WORKSPACE",
  "danceTypes": ["SALSA", "BACHATA"],
  "capacityMin": 5,
  "capacityMax": 20,
  "weekdays": [1, 3],
  "untilDate": "2026-05-31T00:00:00.000Z",
  "occurrenceCount": 16
}
```

### Notes

- Recurring mode is inferred when any of these fields are present:
  - `weekdays`
  - `untilDate`
  - `occurrenceCount`
- If none are present, event is treated as one-time.
- Validation:
  - `endAt` must be strictly after `startAt`.
  - `weekdays` values must be `0..6` when provided.

### Success response (`201`)

```json
{
  "data": {
    "id": "event_xxx",
    "parentId": null,
    "title": "Recurring salsa fundamentals",
    "description": "Weekly class",
    "startAt": "2026-03-02T19:00:00.000Z",
    "endAt": "2026-03-02T20:00:00.000Z",
    "capacityMin": 5,
    "capacityMax": 20,
    "danceTypes": ["SALSA", "BACHATA"],
    "rule": ["FREQ=WEEKLY", "BYDAY=MO,WE", "UNTIL=2026-05-31T00:00:00.000Z"],
    "organizerId": "workspace_xxx",
    "visibility": "WORKSPACE",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z",
    "isRecurringParent": true,
    "isOccurrence": false,
    "generatedOccurrencesCount": 16
  },
  "error": null
}
```

### Error statuses

- `400` invalid payload or invalid datetime ordering
- `401` unauthenticated
- `403` no workspace access / insufficient role
- `404` workspace not found

## Route: List Events

`GET /workspaces/:slug/events?limit=<n>&offset=<n>`

### Access

- Requires authenticated user.
- Requires workspace access.

### Query params

- `limit` optional, positive integer
- `offset` optional, positive integer
- `from` optional ISO datetime (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### `from` behavior

- If `from` is provided: return events with `startAt >= from`.
- If `from` is omitted: backend implicitly uses current request time (`now`), so frontend receives upcoming events only.

### Success response (`200`)

Returns concrete upcoming events for the workspace:

- one-time events (parent rows with empty `rule`)
- recurring generated occurrences (child rows where `parentId != null`)

```json
{
  "data": [
    {
      "id": "event_parent_1",
      "parentId": null,
      "title": "One-time bachata class",
      "description": "Open level",
      "startAt": "2026-03-10T19:00:00.000Z",
      "endAt": "2026-03-10T20:30:00.000Z",
      "capacityMin": 5,
      "capacityMax": 20,
      "danceTypes": ["BACHATA"],
      "rule": [],
      "organizerId": "workspace_xxx",
      "visibility": "WORKSPACE",
      "createdAt": "2026-03-01T00:00:00.000Z",
      "updatedAt": "2026-03-01T00:00:00.000Z",
      "isRecurringParent": false,
      "isOccurrence": false
    }
  ],
  "error": null,
  "meta": {
    "totalCount": 1,
    "count": 1,
    "page": 1,
    "pages": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### Error statuses

- `401` unauthenticated
- `403` no workspace access
- `404` workspace not found
- `400` invalid `from` datetime format

## Route: Get Single Event

`GET /workspaces/:slug/events/:eventId`

### Access

- Requires authenticated user.
- Requires workspace access.

### Success response (`200`)

```json
{
  "data": {
    "id": "event_parent_1",
    "parentId": null,
    "title": "Recurring salsa fundamentals",
    "description": "Weekly class",
    "startAt": "2026-03-02T19:00:00.000Z",
    "endAt": "2026-03-02T20:00:00.000Z",
    "capacityMin": 5,
    "capacityMax": 20,
    "danceTypes": ["SALSA", "BACHATA"],
    "rule": ["FREQ=WEEKLY", "BYDAY=MO", "COUNT=3"],
    "organizerId": "workspace_xxx",
    "visibility": "WORKSPACE",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z",
    "isRecurringParent": true,
    "isOccurrence": false,
    "parent": null,
    "children": [
      {
        "id": "event_child_1",
        "title": "Recurring salsa fundamentals",
        "startAt": "2026-03-02T19:00:00.000Z",
        "endAt": "2026-03-02T20:00:00.000Z",
        "parentId": "event_parent_1"
      }
    ]
  },
  "error": null
}
```

### Error statuses

- `401` unauthenticated
- `403` no workspace access
- `404` workspace or event not found

## Not Implemented Yet (WIP endpoints)

- `PATCH /workspaces/:slug/events/:eventId`
- `PATCH /workspaces/:slug/events/:eventId/future`
- `POST /workspaces/:slug/events/:eventId/cancel`
- `POST /workspaces/:slug/events/participants`
- `POST /workspaces/:slug/events/:eventId/registrations`
- `PATCH /workspaces/:slug/events/:eventId/registrations/:registrationId/cancel`
- `POST /workspaces/:slug/events/:eventId/self-register`
