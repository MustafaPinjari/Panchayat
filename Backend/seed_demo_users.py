"""
Run this script to create demo users in Firestore:
    python seed_demo_users.py
Make sure the backend server is running on http://localhost:8000
"""
import requests

BASE_URL = "http://localhost:8000"

DEMO_USERS = [
    {
        "name": "Admin User",
        "email": "admin@societyhub.com",
        "password": "Admin@123",
        "phone": "9000000001",
        "role": "admin",
        "flat_number": "A-00",
    },
    {
        "name": "Committee Member",
        "email": "committee@societyhub.com",
        "password": "Committee@123",
        "phone": "9000000002",
        "role": "committee_member",
        "flat_number": "B-01",
    },
    {
        "name": "Resident User",
        "email": "resident@societyhub.com",
        "password": "Resident@123",
        "phone": "9000000003",
        "role": "resident",
        "flat_number": "C-02",
    },
    {
        "name": "Property Manager",
        "email": "manager@societyhub.com",
        "password": "Manager@123",
        "phone": "9000000004",
        "role": "manager",
        "flat_number": "D-03",
    },
]

for user in DEMO_USERS:
    resp = requests.post(f"{BASE_URL}/api/users/register/", json=user)
    if resp.status_code == 201:
        print(f"[OK] Created {user['role']}: {user['email']}")
    elif resp.status_code == 400 and "already exists" in resp.text:
        print(f"[SKIP] Already exists: {user['email']}")
    else:
        print(f"[FAIL] {user['email']} — {resp.status_code}: {resp.text}")
