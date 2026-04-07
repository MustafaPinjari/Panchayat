# Smart Society Management System — Backend

A production-ready REST API for managing society complaints, voice reports, threaded comments, notifications, and admin analytics. Built with Django + Django REST Framework, backed by Firebase Firestore and Firebase Storage, with OpenAI Whisper for audio transcription.

---

## Architecture

```
React Frontend (Vite)
        │
        │  HTTP REST (JSON)
        ▼
Django REST API  ──────────────────────────────────────────────────────────┐
  ├── JWT Auth (simplejwt)                                                  │
  ├── RBAC Middleware (resident / committee_member / admin)                 │
  ├── apps/users          — registration, login, user management           │
  ├── apps/complaints     — complaints, comments, analytics                 │
  ├── apps/notifications  — in-app notifications                           │
  ├── apps/audio_processing — audio upload + Whisper transcription         │
  └── services/
        ├── FirestoreService  ──────────────────────────► Firebase Firestore
        ├── StorageService    ──────────────────────────► Firebase Storage
        └── WhisperService    ──────────────────────────► OpenAI Whisper API
```

Full API reference: [`docs/API.md`](docs/API.md)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd Backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in all required values:

```env
SECRET_KEY=your-long-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

FIREBASE_CREDENTIALS_PATH=/absolute/path/to/serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

OPENAI_API_KEY=sk-...

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

To get a Firebase service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" and save the JSON file
3. Set `FIREBASE_CREDENTIALS_PATH` to its absolute path

### 3. Run migrations

```bash
python manage.py migrate
```

### 4. Start the development server

```bash
python manage.py runserver
```

API is available at `http://localhost:8000`.

### 5. Run tests

```bash
pytest
```

To run with verbose output:

```bash
pytest -v
```

---

## Project Structure

```
Backend/
├── manage.py
├── requirements.txt
├── pytest.ini
├── .env.example
├── config/
│   ├── settings.py          # All Django + DRF configuration
│   ├── settings_test.py     # Test-specific overrides
│   └── urls.py              # Root URL routing
├── apps/
│   ├── users/               # Registration, login, user management
│   ├── complaints/          # Complaints, comments, analytics
│   ├── notifications/       # In-app notifications
│   ├── roles_permissions/   # RBAC permission classes + JWT middleware
│   └── audio_processing/    # Audio upload + transcription
├── services/
│   ├── firebase_service.py  # Firestore CRUD wrapper
│   ├── storage_service.py   # Firebase Storage upload
│   └── whisper_service.py   # OpenAI Whisper transcription
└── docs/
    └── API.md               # Full API reference
```

---

## Frontend Integration

The React frontend (Vite, running on `http://localhost:5173`) communicates with this API over HTTP.

### Base URL

```
http://localhost:8000
```

In production, replace with your deployed API domain.

### Authentication header

All protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <access_token>
```

Obtain tokens from `POST /api/users/login/` or `POST /api/users/register/`.
Refresh an expired access token with `POST /api/users/token/refresh/`.

### CORS setup

The backend allows cross-origin requests from origins listed in `CORS_ALLOWED_ORIGINS`. For local development, ensure your `.env` contains:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

For production, add your deployed frontend URL:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Example: login and make an authenticated request (TypeScript)

```typescript
// Login
const loginRes = await fetch('http://localhost:8000/api/users/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
});
const { access, refresh } = await loginRes.json();

// Authenticated request
const complaintsRes = await fetch('http://localhost:8000/api/complaints/', {
  headers: { Authorization: `Bearer ${access}` },
});
const data = await complaintsRes.json();
```

### Key endpoints

| Action | Method | URL |
|--------|--------|-----|
| Register | POST | `/api/users/register/` |
| Login | POST | `/api/users/login/` |
| Refresh token | POST | `/api/users/token/refresh/` |
| List complaints | GET | `/api/complaints/` |
| Submit complaint | POST | `/api/complaints/` |
| Upload audio | POST | `/api/complaints/audio-upload/` |
| Update status | PATCH | `/api/complaints/{id}/status/` |
| List notifications | GET | `/api/notifications/` |
| Mark notification read | PATCH | `/api/notifications/{id}/read/` |
| Admin analytics | GET | `/api/admin/analytics/` |

See [`docs/API.md`](docs/API.md) for the complete reference including request/response shapes and curl examples.
