<div align="center">

# ⚡ TEAM CHAOS — Panchayat | Smart Society Management System

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=800&lines=AI+Powered+Society+Management;Voice+to+Complaint+Automation;Anonymous+Reporting+System;Built+with+React+%2B+Django+%2B+Firebase" />

<br>

<img src="https://user-images.githubusercontent.com/74038190/221352989-518609ab-b4d1-459e-929f-a08cd2bd9b3c.gif" width="400"/>

</div>

---

<img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif"/>

## 🧠 Overview

A **next-generation society management platform** designed to eliminate chaos in residential communication.

This system enables:

* 🎤 Voice-based complaints
* 🕵️ Anonymous reporting
* 📊 Structured issue tracking
* 👥 Role-based management

---

## 🚀 Core Features

### 🎤 Voice → Text Complaints

* Record issues using voice
* AI converts speech → text
* Instantly posted in feed

---

### 🕵️ Anonymous Reporting

* Submit complaints privately
* Encourages honest feedback
* Protected identity system

---

### 💬 Structured Feed System

* Organized complaint dashboard
* Category-based filtering
* No spam like WhatsApp groups

---

### 👥 Role-Based Access

| Role             | Access                   |
| ---------------- | ------------------------ |
| Resident         | Create & view complaints |
| Committee Member | Manage & respond         |
| Admin            | Full system control      |

---

### 📊 Admin Analytics

* Complaint insights
* Status tracking
* Category distribution

---

<img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4d1c14c0247f.gif"/>

## 🧰 Tech Stack

<div align="center">

### ⚛️ Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)
![Tailwind](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)

### 🐍 Backend

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge\&logo=django\&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-ff1709?style=for-the-badge)

### 🔥 Database & Storage

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge\&logo=firebase\&logoColor=black)

### 🤖 AI

![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge)

</div>

---

## 🏗️ Architecture

```
Frontend (React)
        ↓
Backend (Django REST)
        ↓
Firebase (DB + Storage)
        ↓
Whisper API (Speech → Text)
```

---

## 📂 Project Structure

```
.
├── Frontend/        # React App
├── Backend/         # Django Backend
│   ├── apps/
│   ├── services/
│   └── config/
├── .kiro/           # Private specs (ignored)
└── README.md
```

---

<img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4d1c14c0247f.gif"/>

## ⚙️ Setup Guide

### 🔹 Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

pip install -r requirements.txt
python manage.py runserver
```

---

### 🔹 Frontend

```bash
cd Frontend
npm install
npm start
```

---

### 🔐 Environment Variables

```
OPENAI_API_KEY=your_key
FIREBASE_CREDENTIALS=your_json
SECRET_KEY=your_secret
```

---

## 🔌 API Endpoints

| Method | Endpoint                     | Description      |
| ------ | ---------------------------- | ---------------- |
| POST   | /api/complaints/audio-upload | Audio → Text     |
| POST   | /api/complaints              | Create complaint |
| GET    | /api/complaints              | Fetch complaints |
| PATCH  | /api/complaints/{id}         | Update status    |

---

## 🧠 System Flow

```
User → Records Voice 🎤
        ↓
Backend → Converts to Text 🤖
        ↓
Complaint Created 📢
        ↓
Visible to Committee 👥
        ↓
Resolved / Updated ✅
```

---

<img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4d1c14c0247f.gif"/>

## 🔒 Security

* JWT Authentication
* Role-based authorization
* Secure file uploads
* Environment protection

---

## 🚀 Future Enhancements

* 📱 Mobile App
* 🔔 Push Notifications
* 🧠 AI Auto Categorization
* 🗳️ Voting System

---

## 🤝 Contribution

```bash
Fork → Branch → Commit → PR
```

---

## ⚡ Team

<div align="center">

# TEAM CHAOS ⚡

Building systems that turn chaos into structure.

</div>

---
