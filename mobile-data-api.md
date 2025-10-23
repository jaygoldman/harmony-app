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
| `GET /api/mobile/data/sample` | Returns the contents of `src/data/sampleData.json`, including sample questions, the activity pool, and historical activity data. | Full JSON file |
| `GET /api/mobile/data/harmony-chats` | Returns the contents of `src/data/harmonyChats.json`, including the chat list metadata and seeded conversation transcripts. | Full JSON file |

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

The Harmony chats endpoint mirrors the structure of `harmonyChats.json`:

```json
{
  "chatList": [
    { "name": "Thoughts on the rollout", "date": "Today, 2:30 PM" }
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

## Error Handling

| Status | Meaning | Suggested App Action |
| --- | --- | --- |
| `401 Unauthorized` | Token missing, expired, or invalid. | Prompt the user to reconnect via the QR-code flow. |
| `404 Not Found` | Requested dataset is unavailable (e.g., missing file). | Surface a friendly message and retry later. |
| `500 Internal Server Error` | Server failed to load or parse the JSON file. | Log diagnostics and show a generic retry prompt. |

## Development Notes

- In development the backend reads the JSON files from disk on every request so updates appear immediately.
- In production responses are cached for five minutes to reduce disk I/O; redeploying or waiting for the TTL invalidates the cache.
- The desktop application retains the existing token-validation rules. Do not call the data endpoints without a successful `POST /api/mobile/connect`.

With these endpoints the mobile app shares the same mock data as the desktop experience, eliminating drift and keeping development assets centralized.
