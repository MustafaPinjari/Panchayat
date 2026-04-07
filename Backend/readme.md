# 🏢 Smart Society Management System

A modern, AI-powered web application designed to streamline communication and issue management in residential societies. This platform enables residents, committee members, and administrators to efficiently manage complaints, announcements, and daily operations.

---

## 🚀 Features

### 🎤 Voice-Based Complaints

* Record complaints using audio
* Automatically converted to text using AI (Speech-to-Text)
* Posted in the society feed

### 🕵️ Anonymous Reporting

* Users can submit complaints anonymously
* Ensures privacy and encourages transparency

### 💬 Structured Communication

* Centralized complaint feed (no messy chats)
* Thread-based discussions for each issue

### 👥 Role-Based Access Control

* **Resident** – Submit complaints, view feed
* **Committee Member** – Manage and respond to issues
* **Admin** – Full control, analytics, and user management

### 📊 Admin Dashboard

* View complaint statistics
* Track resolved vs pending issues
* Category-based insights

### 🔔 Notifications

* Real-time updates for:

  * New complaints
  * Status changes

---

## 🏗️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* Django
* Django REST Framework

### Database & Storage

* Firebase Firestore
* Firebase Storage

### AI Integration

* OpenAI Whisper (Speech-to-Text)

---

## 📂 Project Structure

```
root/
│
├── Frontend/          # React application
├── Backend/           # Django backend
├── .kiro/             # Internal specs (ignored in git)
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### 🔹 1. Clone Repository

```bash
git clone https://github.com/your-username/society-management.git
cd society-management
```

---

### 🔹 2. Backend Setup (Django)

```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Run server
python manage.py runserver
```

---

### 🔹 3. Frontend Setup (React)

```bash
cd Frontend

npm install
npm start
```

---

### 🔹 4. Environment Variables

Create `.env` file in Backend:

```
OPENAI_API_KEY=your_key
FIREBASE_CREDENTIALS=your_json
SECRET_KEY=your_secret
```

---

## 🔌 API Endpoints

### 🎤 Audio Upload

```
POST /api/complaints/audio-upload/
```

### 📢 Create Complaint

```
POST /api/complaints/
```

### 📄 Get All Complaints

```
GET /api/complaints/
```

### 🔄 Update Complaint Status

```
PATCH /api/complaints/{id}/status
```

---

## 🔐 Roles & Permissions

| Role             | Permissions                  |
| ---------------- | ---------------------------- |
| Resident         | Create complaints, view feed |
| Committee Member | Manage complaints            |
| Admin            | Full access                  |

---

## 🧠 How It Works (Flow)

1. User records audio 🎤
2. Audio is sent to backend
3. Converted to text using AI
4. Complaint is created
5. Appears in feed for committee
6. Status updated (Resolved/Pending)

---

## 📸 Screens (From Figma)

* Login / Signup
* Dashboard Feed
* Voice Complaint Screen
* Admin Panel

---

## 🔒 Security

* JWT Authentication
* Role-based authorization
* Secure file upload validation
* Environment variable protection

---

## 🚀 Future Enhancements

* Voting system for issues
* Push notifications
* AI-based complaint categorization
* Meeting scheduling
* Mobile app (React Native)

---

## 🤝 Contribution

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Commit changes
4. Submit a PR

---

## 📜 License

This project is licensed under the MIT License.

---

## 👨‍💻 Team

**Team Chaos ⚡**
