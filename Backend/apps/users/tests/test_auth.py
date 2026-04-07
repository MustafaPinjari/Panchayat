"""
Tests for user registration, login, and token refresh.
Firebase calls are mocked so no real Firebase connection is needed.
"""
import uuid
from unittest.mock import MagicMock, patch

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user_payload(**overrides):
    base = {
        'name': 'Test User',
        'email': f'test_{uuid.uuid4().hex[:8]}@example.com',
        'password': 'SecurePass123',
        'phone': '1234567890',
        'role': 'resident',
        'flat_number': 'A-101',
    }
    base.update(overrides)
    return base


def _stored_user(payload, user_id=None):
    """Simulate what Firestore would return for a stored user."""
    import bcrypt
    uid = user_id or str(uuid.uuid4())
    pw_hash = bcrypt.hashpw(payload['password'].encode(), bcrypt.gensalt()).decode()
    return {
        'id': uid,
        'name': payload['name'],
        'email': payload['email'],
        'phone': payload['phone'],
        'role': payload['role'],
        'flat_number': payload['flat_number'],
        'password_hash': pw_hash,
        'created_at': '2024-01-01T00:00:00+00:00',
    }


# ---------------------------------------------------------------------------
# Registration tests
# ---------------------------------------------------------------------------

class TestRegisterView:
    @pytest.fixture(autouse=True)
    def client(self):
        self.client = APIClient()

    @patch('apps.users.serializers.firestore_service')
    @patch('apps.users.views.firestore_service')
    def test_register_returns_201_and_tokens(self, mock_view_fs, mock_ser_fs):
        """Valid registration returns 201 with access + refresh tokens."""
        mock_ser_fs.query.return_value = []   # no duplicate email
        mock_view_fs.set.return_value = None

        payload = _make_user_payload()
        resp = self.client.post('/api/users/register/', payload, format='json')

        assert resp.status_code == 201
        data = resp.json()
        assert 'access' in data
        assert 'refresh' in data
        assert 'user' in data

    @patch('apps.users.serializers.firestore_service')
    @patch('apps.users.views.firestore_service')
    def test_register_does_not_expose_password(self, mock_view_fs, mock_ser_fs):
        """Response must never contain raw password or password_hash."""
        mock_ser_fs.query.return_value = []
        mock_view_fs.set.return_value = None

        payload = _make_user_payload()
        resp = self.client.post('/api/users/register/', payload, format='json')

        assert resp.status_code == 201
        body = resp.content.decode()
        assert payload['password'] not in body
        assert 'password_hash' not in body

    @patch('apps.users.serializers.firestore_service')
    def test_register_duplicate_email_returns_400(self, mock_ser_fs):
        """Duplicate email must return 400."""
        existing = _stored_user(_make_user_payload(email='dup@example.com'))
        mock_ser_fs.query.return_value = [existing]

        payload = _make_user_payload(email='dup@example.com')
        resp = self.client.post('/api/users/register/', payload, format='json')

        assert resp.status_code == 400

    @patch('apps.users.serializers.firestore_service')
    def test_register_invalid_role_returns_400(self, mock_ser_fs):
        """Invalid role value must return 400."""
        mock_ser_fs.query.return_value = []

        payload = _make_user_payload(role='superuser')
        resp = self.client.post('/api/users/register/', payload, format='json')

        assert resp.status_code == 400

    @patch('apps.users.serializers.firestore_service')
    def test_register_missing_fields_returns_400(self, mock_ser_fs):
        """Missing required fields must return 400."""
        mock_ser_fs.query.return_value = []

        resp = self.client.post('/api/users/register/', {'email': 'x@x.com'}, format='json')
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------

class TestLoginView:
    @pytest.fixture(autouse=True)
    def client(self):
        self.client = APIClient()

    @patch('apps.users.views.firestore_service')
    def test_login_valid_credentials_returns_tokens(self, mock_fs):
        """Valid credentials return 200 with tokens."""
        payload = _make_user_payload()
        stored = _stored_user(payload)
        mock_fs.query.return_value = [stored]

        resp = self.client.post(
            '/api/users/login/',
            {'email': payload['email'], 'password': payload['password']},
            format='json',
        )

        assert resp.status_code == 200
        data = resp.json()
        assert 'access' in data
        assert 'refresh' in data

    @patch('apps.users.views.firestore_service')
    def test_login_wrong_password_returns_401(self, mock_fs):
        """Wrong password must return 401."""
        payload = _make_user_payload()
        stored = _stored_user(payload)
        mock_fs.query.return_value = [stored]

        resp = self.client.post(
            '/api/users/login/',
            {'email': payload['email'], 'password': 'WrongPassword!'},
            format='json',
        )
        assert resp.status_code == 401

    @patch('apps.users.views.firestore_service')
    def test_login_unknown_email_returns_401(self, mock_fs):
        """Unknown email must return 401."""
        mock_fs.query.return_value = []

        resp = self.client.post(
            '/api/users/login/',
            {'email': 'nobody@example.com', 'password': 'pass'},
            format='json',
        )
        assert resp.status_code == 401

    @patch('apps.users.views.firestore_service')
    def test_login_does_not_expose_password_hash(self, mock_fs):
        """Login response must not contain password_hash."""
        payload = _make_user_payload()
        stored = _stored_user(payload)
        mock_fs.query.return_value = [stored]

        resp = self.client.post(
            '/api/users/login/',
            {'email': payload['email'], 'password': payload['password']},
            format='json',
        )
        assert resp.status_code == 200
        assert 'password_hash' not in resp.content.decode()


# ---------------------------------------------------------------------------
# Token refresh tests
# ---------------------------------------------------------------------------

class TestTokenRefreshView:
    @pytest.fixture(autouse=True)
    def client(self):
        self.client = APIClient()

    @patch('apps.users.serializers.firestore_service')
    @patch('apps.users.views.firestore_service')
    def test_refresh_returns_new_access_token(self, mock_view_fs, mock_ser_fs):
        """A valid refresh token should yield a new access token."""
        mock_ser_fs.query.return_value = []
        mock_view_fs.set.return_value = None

        # Register to get a refresh token
        payload = _make_user_payload()
        reg_resp = self.client.post('/api/users/register/', payload, format='json')
        assert reg_resp.status_code == 201
        refresh_token = reg_resp.json()['refresh']

        resp = self.client.post(
            '/api/users/token/refresh/',
            {'refresh': refresh_token},
            format='json',
        )
        assert resp.status_code == 200
        assert 'access' in resp.json()
