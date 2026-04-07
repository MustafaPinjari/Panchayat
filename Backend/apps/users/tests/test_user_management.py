"""
Tests for Admin user management endpoints:
  GET/PUT/DELETE /api/users/ and /api/users/{id}/
"""
import uuid
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_jwt(user_id: str, role: str, email: str = 'user@example.com') -> str:
    """Create a real JWT with custom claims for testing."""
    _uid = user_id
    _email = email
    _role = role

    class _FakeUser:
        pk = _uid
        id = _uid
        firestore_id = _uid
        is_active = True

    _FakeUser.email = _email  # set after class definition to avoid scoping issue

    refresh = RefreshToken.for_user(_FakeUser())
    refresh['user_id'] = _uid
    refresh['email'] = _email
    refresh['role'] = _role
    return str(refresh.access_token)


def _sample_user(role='resident', uid=None):
    uid = uid or str(uuid.uuid4())
    return {
        'id': uid,
        'name': 'Sample User',
        'email': f'{uid[:8]}@example.com',
        'phone': '9876543210',
        'role': role,
        'flat_number': 'B-202',
        'created_at': '2024-01-01T00:00:00+00:00',
    }


# ---------------------------------------------------------------------------
# UserListView tests
# ---------------------------------------------------------------------------

class TestUserListView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.admin_token = _make_jwt(str(uuid.uuid4()), 'admin')
        self.resident_token = _make_jwt(str(uuid.uuid4()), 'resident')

    @patch('apps.users.views.firestore_service')
    def test_admin_can_list_users(self, mock_fs):
        """Admin GET /api/users/ returns paginated list."""
        mock_fs.query.return_value = [_sample_user(), _sample_user()]

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.get('/api/users/')

        assert resp.status_code == 200
        data = resp.json()
        assert 'results' in data
        assert 'count' in data

    @patch('apps.users.views.firestore_service')
    def test_list_response_excludes_password_hash(self, mock_fs):
        """User list must never expose password_hash."""
        user = _sample_user()
        user['password_hash'] = '$2b$12$fakehash'
        mock_fs.query.return_value = [user]

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.get('/api/users/')

        assert resp.status_code == 200
        assert 'password_hash' not in resp.content.decode()

    def test_non_admin_gets_403_on_list(self):
        """Non-admin cannot list users."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.resident_token}')
        resp = self.client.get('/api/users/')
        assert resp.status_code == 403

    def test_unauthenticated_gets_401_on_list(self):
        """Unauthenticated request returns 401."""
        resp = self.client.get('/api/users/')
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# UserDetailView tests
# ---------------------------------------------------------------------------

class TestUserDetailView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.admin_token = _make_jwt(str(uuid.uuid4()), 'admin')
        self.resident_token = _make_jwt(str(uuid.uuid4()), 'resident')

    @patch('apps.users.views.firestore_service')
    def test_admin_can_get_user(self, mock_fs):
        """Admin can retrieve a specific user."""
        mock_fs.get.return_value = _sample_user(uid=self.user_id)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.get(f'/api/users/{self.user_id}/')

        assert resp.status_code == 200
        assert resp.json()['id'] == self.user_id

    @patch('apps.users.views.firestore_service')
    def test_get_nonexistent_user_returns_404(self, mock_fs):
        """GET on missing user returns 404."""
        mock_fs.get.return_value = None

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.get(f'/api/users/{self.user_id}/')

        assert resp.status_code == 404

    @patch('apps.users.views.firestore_service')
    def test_admin_can_delete_user(self, mock_fs):
        """Admin DELETE returns 204."""
        mock_fs.get.return_value = _sample_user(uid=self.user_id)
        mock_fs.delete.return_value = None

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.delete(f'/api/users/{self.user_id}/')

        assert resp.status_code == 204
        mock_fs.delete.assert_called_once_with('users', self.user_id)

    def test_non_admin_cannot_delete_user(self):
        """Non-admin DELETE returns 403."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.resident_token}')
        resp = self.client.delete(f'/api/users/{self.user_id}/')
        assert resp.status_code == 403

    @patch('apps.users.serializers.firestore_service')
    @patch('apps.users.views.firestore_service')
    def test_admin_can_update_user(self, mock_view_fs, mock_ser_fs):
        """Admin PUT updates user and returns updated data."""
        existing = _sample_user(uid=self.user_id)
        mock_view_fs.get.return_value = existing
        mock_ser_fs.query.return_value = []   # no duplicate email
        mock_view_fs.set.return_value = None

        update_payload = {
            'name': 'Updated Name',
            'email': 'updated@example.com',
            'phone': '1112223333',
            'role': 'committee_member',
            'flat_number': 'C-303',
            'password': 'NewPass456',
        }
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        resp = self.client.put(f'/api/users/{self.user_id}/', update_payload, format='json')

        assert resp.status_code == 200
        assert resp.json()['name'] == 'Updated Name'


# ---------------------------------------------------------------------------
# RBAC edge cases
# ---------------------------------------------------------------------------

class TestRBACEdgeCases:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()

    def test_unauthenticated_request_returns_401(self):
        """No token → 401 on protected endpoint."""
        resp = self.client.get('/api/users/')
        assert resp.status_code == 401

    def test_resident_cannot_delete_user(self):
        """Resident role → 403 on DELETE /api/users/{id}/."""
        token = _make_jwt(str(uuid.uuid4()), 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.delete(f'/api/users/{uuid.uuid4()}/')
        assert resp.status_code == 403

    def test_committee_member_cannot_delete_user(self):
        """Committee member → 403 on DELETE /api/users/{id}/."""
        token = _make_jwt(str(uuid.uuid4()), 'committee_member')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.delete(f'/api/users/{uuid.uuid4()}/')
        assert resp.status_code == 403
