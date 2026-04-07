# Smart Society Management System — API Reference

## Table of Contents

1. [Setup & Run](#setup--run)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [User Registration & Auth](#user-registration--auth)
   - [User Management (Admin)](#user-management-admin)
   - [Audio Upload](#audio-upload)
   - [Complaints](#complaints)
   - [Comments](#comments)
   - [Notifications](#notifications)
   - [Admin Analytics](#admin-analytics)
4. [Firestore Schema](#firestore-schema)
5. [Environment Variables](#environment-variables)

---

## Setup & Run

### Prerequisites

- Python 3.11+
- A Firebase project with Firestore and Storage enabled
- A Firebase service account key JSON file
- An OpenAI API key (for Whisper transcription)

### Install

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment

```bash
cp .env.example .env
# Edit .env and fill in all required values (see Environment Variables section)
```

### Run migrations (SQLite only used for Django admin session)

```bash
python manage.py migrate
```

### Start development server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

### Run tests

```bash
pytest
```

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained from the `/api/users/login/` or `/api/users/register/` endpoints.
Access tokens expire after 60 minutes (configurable). Use the refresh endpoint to obtain a new access token.

### Roles

| Role | Description |
|------|-------------|
| `resident` | Can submit and view complaints, post comments, read notifications |
| `committee_member` | All resident permissions + can update complaint status |
| `admin` | Full access including user management and analytics |

---

## Endpoints

### User Registration & Auth

---

#### POST `/api/users/register/`

Register a new user account.

- **Auth required:** No
- **Role required:** None

**Request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "phone": "+1234567890",
  "role": "resident",
  "flat_number": "A-101"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Max 255 chars |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Min 6 chars, never returned |
| `phone` | string | Yes | Max 30 chars |
| `role` | string | Yes | One of: `resident`, `committee_member`, `admin` |
| `flat_number` | string | Yes | Max 50 chars |

**Response `201 Created`:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "role": "resident",
    "flat_number": "A-101",
    "created_at": "2026-04-07T10:00:00+00:00"
  },
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Validation error (duplicate email, invalid role, missing fields) |
| `500` | Firestore write failure |

**Example:**

```bash
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123","phone":"+1234567890","role":"resident","flat_number":"A-101"}'
```

---

#### POST `/api/users/login/`

Authenticate and receive JWT tokens.

- **Auth required:** No
- **Role required:** None

**Request body:**

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response `200 OK`:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "role": "resident",
    "flat_number": "A-101",
    "created_at": "2026-04-07T10:00:00+00:00"
  },
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Missing email or password |
| `401` | Invalid credentials |
| `503` | Firestore unavailable |

**Example:**

```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'
```

---

#### POST `/api/users/token/refresh/`

Obtain a new access token using a valid refresh token.

- **Auth required:** No
- **Role required:** None

**Request body:**

```json
{
  "refresh": "<jwt_refresh_token>"
}
```

**Response `200 OK`:**

```json
{
  "access": "<new_jwt_access_token>"
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `401` | Refresh token expired or invalid |

**Example:**

```bash
curl -X POST http://localhost:8000/api/users/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'
```

---

### User Management (Admin)

All endpoints in this section require `admin` role.

---

#### GET `/api/users/`

List all users (paginated).

- **Auth required:** Yes
- **Role required:** `admin`

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 10 | Results per page (max 100) |

**Response `200 OK`:**

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "role": "resident",
      "flat_number": "A-101",
      "created_at": "2026-04-07T10:00:00+00:00"
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <admin_access_token>"
```

---

#### GET `/api/users/{id}/`

Get a single user by ID.

- **Auth required:** Yes
- **Role required:** `admin`

**Response `200 OK`:** Single user object (same shape as list item above).

**Error responses:**

| Status | Reason |
|--------|--------|
| `403` | Not an admin |
| `404` | User not found |

**Example:**

```bash
curl http://localhost:8000/api/users/550e8400-e29b-41d4-a716-446655440000/ \
  -H "Authorization: Bearer <admin_access_token>"
```

---

#### PUT `/api/users/{id}/`

Update a user's details.

- **Auth required:** Yes
- **Role required:** `admin`

**Request body:** Same fields as registration (all required).

**Response `200 OK`:** Updated user object.

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Validation error |
| `403` | Not an admin |
| `404` | User not found |

**Example:**

```bash
curl -X PUT http://localhost:8000/api/users/550e8400-e29b-41d4-a716-446655440000/ \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@example.com","password":"newpass","phone":"+1234567890","role":"committee_member","flat_number":"A-101"}'
```

---

#### DELETE `/api/users/{id}/`

Delete a user.

- **Auth required:** Yes
- **Role required:** `admin`

**Response `204 No Content`**

**Error responses:**

| Status | Reason |
|--------|--------|
| `403` | Not an admin |
| `404` | User not found |

**Example:**

```bash
curl -X DELETE http://localhost:8000/api/users/550e8400-e29b-41d4-a716-446655440000/ \
  -H "Authorization: Bearer <admin_access_token>"
```

---

### Audio Upload

---

#### POST `/api/complaints/audio-upload/`

Upload an audio file and receive a storage URL and transcription.

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `audio_file` | file | Yes | mp3, wav, m4a, webm; max 25 MB |

**Response `200 OK`:**

```json
{
  "audio_url": "https://storage.googleapis.com/your-bucket/audio/user-id/1234567890_recording.mp3",
  "transcript": "There is a water leak in the basement near the parking area."
}
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | File exceeds 25 MB or unsupported format |
| `401` | Missing or invalid JWT |
| `500` | Firebase Storage upload failure |
| `502` | OpenAI Whisper API error |

**Example:**

```bash
curl -X POST http://localhost:8000/api/complaints/audio-upload/ \
  -H "Authorization: Bearer <access_token>" \
  -F "audio_file=@/path/to/recording.mp3"
```

---

### Complaints

---

#### POST `/api/complaints/`

Submit a new complaint.

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Request body:**

```json
{
  "text": "There is a water leak in the basement.",
  "category": "water",
  "anonymous": false,
  "audio_url": "https://storage.googleapis.com/..."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `text` | string | Yes | Max 5000 chars |
| `category` | string | Yes | One of: `water`, `security`, `maintenance`, `noise`, `cleanliness`, `other` |
| `anonymous` | boolean | No | Default `false` |
| `audio_url` | string | No | URL from audio-upload endpoint |

**Response `201 Created`:**

```json
{
  "id": "7f3c2a1b-...",
  "text": "There is a water leak in the basement.",
  "audio_url": null,
  "created_by": "550e8400-...",
  "anonymous": false,
  "category": "water",
  "status": "pending",
  "created_at": "2026-04-07T10:05:00+00:00"
}
```

Note: `created_by` is omitted for non-admin users when `anonymous` is `true`.

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Validation error (invalid category, missing text) |
| `401` | Missing or invalid JWT |

**Example:**

```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"Water leak in basement","category":"water","anonymous":false}'
```

---

#### GET `/api/complaints/`

List complaints (paginated, filterable).

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category |
| `status` | string | Filter by status |
| `search` | string | Case-insensitive text search on complaint body |
| `page` | integer | Page number (default 1) |
| `page_size` | integer | Results per page (default 10, max 100) |

**Response `200 OK`:**

```json
{
  "count": 15,
  "next": "http://localhost:8000/api/complaints/?page=2",
  "previous": null,
  "results": [...]
}
```

**Example:**

```bash
curl "http://localhost:8000/api/complaints/?category=water&status=pending" \
  -H "Authorization: Bearer <access_token>"
```

---

#### GET `/api/complaints/{id}/`

Get a single complaint by ID.

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Response `200 OK`:** Single complaint object.

**Error responses:**

| Status | Reason |
|--------|--------|
| `404` | Complaint not found |

**Example:**

```bash
curl http://localhost:8000/api/complaints/7f3c2a1b-.../ \
  -H "Authorization: Bearer <access_token>"
```

---

#### PATCH `/api/complaints/{id}/status/`

Update the status of a complaint.

- **Auth required:** Yes
- **Role required:** `committee_member` or `admin`

**Request body:**

```json
{
  "status": "in_progress"
}
```

Valid status values: `pending`, `in_progress`, `resolved`

**Response `200 OK`:** Updated complaint object.

**Side effects:** When status changes to `in_progress` or `resolved`, a notification is sent to the complaint's original submitter (if not anonymous).

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Invalid status value |
| `403` | Insufficient role (resident) |
| `404` | Complaint not found |

**Example:**

```bash
curl -X PATCH http://localhost:8000/api/complaints/7f3c2a1b-.../status/ \
  -H "Authorization: Bearer <committee_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
```

---

### Comments

---

#### POST `/api/comments/`

Post a comment on a complaint.

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Request body:**

```json
{
  "complaint_id": "7f3c2a1b-...",
  "text": "We are looking into this issue."
}
```

**Response `201 Created`:**

```json
{
  "id": "a1b2c3d4-...",
  "complaint_id": "7f3c2a1b-...",
  "created_by": "550e8400-...",
  "text": "We are looking into this issue.",
  "created_at": "2026-04-07T10:10:00+00:00"
}
```

**Side effects:** A notification is sent to the complaint owner (if not anonymous and not the commenter themselves).

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | Validation error |
| `404` | Referenced complaint not found |

**Example:**

```bash
curl -X POST http://localhost:8000/api/comments/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"complaint_id":"7f3c2a1b-...","text":"We are looking into this."}'
```

---

#### GET `/api/comments/{complaint_id}/`

List all comments for a complaint, ordered by `created_at` ascending.

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Response `200 OK`:**

```json
[
  {
    "id": "a1b2c3d4-...",
    "complaint_id": "7f3c2a1b-...",
    "created_by": "550e8400-...",
    "text": "We are looking into this issue.",
    "created_at": "2026-04-07T10:10:00+00:00"
  }
]
```

**Example:**

```bash
curl http://localhost:8000/api/comments/7f3c2a1b-.../ \
  -H "Authorization: Bearer <access_token>"
```

---

### Notifications

---

#### GET `/api/notifications/`

List notifications for the authenticated user, ordered by `created_at` descending.

- **Auth required:** Yes
- **Role required:** Any authenticated user

**Response `200 OK`:**

```json
[
  {
    "id": "n1b2c3d4-...",
    "user_id": "550e8400-...",
    "message": "Your complaint status has been updated to 'in_progress'.",
    "read_status": false,
    "created_at": "2026-04-07T10:15:00+00:00"
  }
]
```

**Example:**

```bash
curl http://localhost:8000/api/notifications/ \
  -H "Authorization: Bearer <access_token>"
```

---

#### PATCH `/api/notifications/{id}/read/`

Mark a notification as read.

- **Auth required:** Yes
- **Role required:** Owner of the notification

**Response `200 OK`:** Updated notification object with `read_status: true`.

**Error responses:**

| Status | Reason |
|--------|--------|
| `403` | Notification belongs to a different user |
| `404` | Notification not found |

**Example:**

```bash
curl -X PATCH http://localhost:8000/api/notifications/n1b2c3d4-.../read/ \
  -H "Authorization: Bearer <access_token>"
```

---

### Admin Analytics

---

#### GET `/api/admin/analytics/`

Get aggregated complaint statistics.

- **Auth required:** Yes
- **Role required:** `admin`

**Response `200 OK`:**

```json
{
  "total": 42,
  "by_status": {
    "pending": 20,
    "in_progress": 15,
    "resolved": 7
  },
  "by_category": {
    "water": 10,
    "security": 8,
    "maintenance": 12,
    "noise": 5,
    "cleanliness": 4,
    "other": 3
  }
}
```

Note: `by_status` values and `by_category` values each sum to `total`.

**Error responses:**

| Status | Reason |
|--------|--------|
| `403` | Not an admin |

**Example:**

```bash
curl http://localhost:8000/api/admin/analytics/ \
  -H "Authorization: Bearer <admin_access_token>"
```

---

## Firestore Schema

All data is stored in Firebase Firestore. The following collections are used:

### Collection: `users`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Document ID |
| `name` | string | Full name |
| `email` | string | Unique email address |
| `phone` | string | Phone number |
| `role` | string | `resident` \| `committee_member` \| `admin` |
| `flat_number` | string | Society flat/unit identifier |
| `password_hash` | string | bcrypt hash — never returned in API responses |
| `created_at` | string (ISO 8601) | Account creation timestamp |

### Collection: `complaints`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Document ID |
| `text` | string | Complaint description |
| `audio_url` | string \| null | Firebase Storage URL of audio file |
| `created_by` | string \| null | User ID of submitter (null if anonymous) |
| `anonymous` | boolean | Whether submitter identity is hidden |
| `category` | string | `water` \| `security` \| `maintenance` \| `noise` \| `cleanliness` \| `other` |
| `status` | string | `pending` \| `in_progress` \| `resolved` |
| `created_at` | string (ISO 8601) | Submission timestamp |

### Collection: `comments`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Document ID |
| `complaint_id` | string | Reference to a `complaints` document |
| `created_by` | string | User ID of commenter |
| `text` | string | Comment body |
| `created_at` | string (ISO 8601) | Comment timestamp |

### Collection: `notifications`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Document ID |
| `user_id` | string | Reference to a `users` document |
| `message` | string | Notification text |
| `read_status` | boolean | `false` = unread, `true` = read |
| `created_at` | string (ISO 8601) | Notification timestamp |

---

## Environment Variables

All secrets and configuration are loaded from a `.env` file (or system environment). Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret key — use a long random string in production |
| `DEBUG` | No | `True` for development, `False` for production (default: `False`) |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of allowed hostnames (e.g. `localhost,127.0.0.1`) |
| `FIREBASE_CREDENTIALS_PATH` | Yes | Absolute path to Firebase service account JSON key file |
| `FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket name (e.g. `your-project.appspot.com`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for Whisper transcription |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173`) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | No | Access token lifetime in minutes (default: `60`) |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | No | Refresh token lifetime in days (default: `7`) |
