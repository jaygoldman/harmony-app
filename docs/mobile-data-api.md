# Harmony Mobile Data API

This guide explains how the Harmony mobile app can retrieve shared UI data from the backend after completing the mobile connect flow. The same JSON files power both the desktop web experience and the mobile app, ensuring the experiences stay in sync.

## Prerequisites

- Complete the connection-code flow described in `mobile-auth.md`.
- Persist the `token` and `apiUrl` returned by `POST /api/mobile/connect`.
- Send the token on every request:  
  `Authorization: Bearer <token>`
- Tokens are signed with the backend secret and expire 30 days after creation. Handle `401` responses by prompting the user to reconnect.

## Available Data Endpoints

| Endpoint | Purpose | Response |
| --- | --- | --- |
| `GET /api/mobile/data/sample` | Returns the contents of `src/data/sampleData.json`, including sample questions, the activity pool, historical activity data, active tasks, and user podcasts. | Full JSON file |
| `GET /api/mobile/data/harmony-chats` | Returns the contents of `src/data/harmonyChats.json`, including the chat list metadata, seeded conversation transcripts, and Conductor entity linkage. | Full JSON file |
| `GET /api/mobile/data/kpis` | Returns `src/data/kpiData.json`, providing KPI metrics for the Manufacturing and Distribution workstreams. | Full JSON file |

Both routes require the mobile token and respond with `401` if the header is missing or invalid. If a file cannot be located the server returns `404`.

### Request Pattern

```http
GET {apiUrl}/api/mobile/data/sample
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
```

### Sample Success Response

```json
{
  "sampleQuestions": [
    { "text": "What are the project risks?", "defaultType": "text" },
    { "text": "Show me the budget analysis", "defaultType": "chart" }
  ],
  "activityPool": [/* trimmed for brevity */],
  "historicalActivities": [/* trimmed for brevity */]
}
```

The Harmony chats endpoint mirrors the structure of `harmonyChats.json`. Each chat entry now includes the Conductor entity metadata so that clients can scope conversations to the current context (for example, the 3D printing project `10273`):

```json
{
  "chatList": [
    {
      "name": "Thoughts on the rollout",
      "date": "Today, 2:30 PM",
      "conductorEntityId": "10273",
      "conductorEntityName": "3D print capabilities in each facility",
      "conductorEntityType": "project"
    }
  ],
  "chatMessages": {
    "Thoughts on the rollout": [
      {
        "id": "1",
        "type": "user",
        "content": "Hello everyone, I wanted to get your thoughts...",
        "timestamp": "2024-01-15T15:30:00.000Z"
      }
    ]
  }
}
```

### Filtering Chats on Mobile

- Match the desktop sidebar behavior by filtering the chat list to the page's Conductor entity ID before rendering. For the current 3D printing summary view, only chats with `conductorEntityId === "10273"` should appear in the hamburger menu or equivalent mobile list.
- Fall back to the full list only if no chats are tagged to the active entity (useful for legacy data or when the user starts a brand new conversation).

## Error Handling

| Status | Meaning | Suggested App Action |
| --- | --- | --- |
| `401 Unauthorized` | Token missing, expired, or invalid. | Prompt the user to reconnect via the QR-code flow. |
| `404 Not Found` | Requested dataset is unavailable (e.g., missing file). | Surface a friendly message and retry later. |
| `500 Internal Server Error` | Server failed to load or parse the JSON file. | Log diagnostics and show a generic retry prompt. |

## Development Notes

- In development the backend reads the JSON files from disk on every request so updates appear immediately.
- The server reads data files from `build/data` (or the directory set via `HARMONY_DATA_DIR`). The build step already copies `src/data/*.json` into that location, including the new KPI dataset.
- In production responses are cached for five minutes to reduce disk I/O; redeploying or waiting for the TTL invalidates the cache.
- The desktop application retains the existing token-validation rules. Do not call the data endpoints without a successful `POST /api/mobile/connect`.

With these endpoints the mobile app shares the same mock data as the desktop experience, eliminating drift and keeping development assets centralized.
