# Smart Society Management System

A full-stack society management platform with complaint tracking, voice reports, notifications, and admin analytics.

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Django 4 + Django REST Framework + Firebase Firestore/Storage + OpenAI Whisper

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Firebase project | Service account key JSON |
| OpenAI API key | For audio transcription |

---

## Project Structure

```
/
├── Backend/          # Django REST API
│   ├── apps/
│   │   ├── users/            # Auth, registration, user management
│   │   ├── complaints/       # Complaints, comments, analytics
│   │   ├── notifications/    # In-app notifications
│   │   ├── audio_processing/ # Audio upload + Whisper transcription
│   │   └── roles_permissions/# JWT middleware + RBAC
│   ├── services/
│   │   ├── firebase_service.py
│   │   ├── storage_service.py
│   │   └── whisper_service.py
│   ├── config/               # Django settings, URLs
│   ├── docs/API.md           # Full API reference
│   └── requirements.txt
└── Frontend/         # React + Vite SPA
    ├── src/
    │   ├── services/api.ts       # Typed API client with JWT refresh
    │   ├── context/AuthContext.tsx
    │   ├── components/
    │   └── app/pages/
    └── package.json
```

---

## 1. Backend Setup

### 1.1 Install dependencies

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 1.2 Configure environment

```bash
cp .env.example .env
```

Edit `Backend/.env`:

```env
SECRET_KEY=your-long-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Firebase — download from Firebase Console → Project Settings → Service Accounts
FIREBASE_CREDENTIALS_PATH=/absolute/path/to/serviceAccountKey.json
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# OpenAI — https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Allow the frontend dev server
CORS_ALLOWED_ORIGINS=http://localhost:5173

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

> **Firebase setup**: Go to [Firebase Console](https://console.firebase.google.com) → your project → Project Settings → Service Accounts → Generate new private key. Save the JSON file and set its absolute path in `FIREBASE_CREDENTIALS_PATH`.

### 1.3 Run migrations

```bash
python manage.py migrate
```

### 1.4 Start the API server

```bash
python manage.py runserver
```

API is now live at **http://localhost:8000**

---

## 2. Frontend Setup

### 2.1 Install dependencies

```bash
cd Frontend
npm install
```

### 2.2 Verify environment

`Frontend/.env` should already contain:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 2.3 Start the dev server

```bash
npm run dev
```

App is now live at **http://localhost:5173**

---

## 3. Running Both Together

Open two terminals:

**Terminal 1 — Backend**
```bash
cd Backend
source .venv/bin/activate
python manage.py runserver
```

**Terminal 2 — Frontend**
```bash
cd Frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 4. Verifying the Integration

### 4.1 Health check

```bash
curl http://localhost:8000/api/users/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}'
# Expected: 401 {"detail": "..."} — confirms API is reachable
```

### 4.2 Register a user

```bash
curl http://localhost:8000/api/users/register/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resident@example.com",
    "password": "SecurePass123",
    "name": "Test Resident",
    "role": "resident",
    "flat_number": "A-101",
    "phone": "9876543210"
  }'
# Expected: 201 with user object
```

### 4.3 Login and get tokens

```bash
curl http://localhost:8000/api/users/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"resident@example.com","password":"SecurePass123"}'
# Expected: 200 with {"access": "...", "refresh": "..."}
```

### 4.4 Page-by-page smoke test

| Page | URL | What to verify |
|------|-----|----------------|
| Login | `/` | Enter credentials → redirects to `/dashboard` |
| Dashboard | `/dashboard` | Complaint cards load from API, search works, pagination works |
| Complaint detail | `/complaints/:id` | Complaint data loads, comments load, reply posts |
| Voice complaint | `/complaints/new` | Mic records audio, transcript appears, form submits |
| Notifications | `/notifications` | List loads, mark-read updates badge in TopNav |
| Admin analytics | `/admin` | Charts render with real data (admin role required) |
| User management | `/admin/users` | User list loads, add/edit/delete work (admin role required) |
| Settings | `/settings` | Profile loads, save updates, logout clears session |

### 4.5 Error handling verification

- **No connection**: Stop the backend, reload any page → "No connection" toast appears
- **Session expiry**: Delete `auth_access` from localStorage, make any API call → "Session expired, please log in again" toast, redirected to login
- **API errors**: Submit an invalid form → error message from API's `detail` field appears as toast

---

## 5. Running Tests

### Backend tests

```bash
cd Backend
source .venv/bin/activate
pytest                  # all tests
pytest -v               # verbose
pytest apps/users/      # specific app
```

### Frontend (no test suite configured)

Manual smoke testing via the checklist in section 4.4 above.

---

## 6. User Roles

| Role | Access |
|------|--------|
| `resident` | Submit complaints, view own complaints, notifications, settings |
| `committee_member` | All resident access + update complaint status, view all complaints |
| `admin` | Full access including analytics dashboard and user management |

Create users with different roles via `POST /api/users/register/` or the admin user management page.

---

## 7. Key API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
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
| List users | GET | `/api/users/` |

Full reference with request/response shapes: [`Backend/docs/API.md`](Backend/docs/API.md)

---

## 8. Common Issues

**`SECRET_KEY environment variable is not set`**
→ Make sure `Backend/.env` exists and has a `SECRET_KEY` value.

**CORS errors in browser**
→ Confirm `CORS_ALLOWED_ORIGINS=http://localhost:5173` is in `Backend/.env` and the backend was restarted after the change.

**Firebase errors on startup**
→ Check `FIREBASE_CREDENTIALS_PATH` points to a valid service account JSON file with the correct absolute path.

**Audio upload fails**
→ Verify `OPENAI_API_KEY` is set and valid. Check `FIREBASE_STORAGE_BUCKET` is correct.

**401 on every request after login**
→ Confirm the frontend `.env` has `VITE_API_BASE_URL=http://localhost:8000` and the Vite dev server was restarted after any `.env` change.


"email": "resident@example.com",
    "password": "SecurePass123",