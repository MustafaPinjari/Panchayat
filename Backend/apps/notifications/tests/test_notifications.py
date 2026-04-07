"""
Tests for notification endpoints.
Firebase calls are mocked so no real Firebase connection is needed.
"""
import uuid
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_jwt(user_id: str, role: str = 'resident') -> str:
    _uid = user_id

    class _FakeUser:
        pk = _uid
        id = _uid
        firestore_id = _uid
        is_active = True
        email = 'user@example.com'

    refresh = RefreshToken.for_user(_FakeUser())
    refresh['user_id'] = _uid
    refresh['email'] = 'user@example.com'
    refresh['role'] = role
    return str(refresh.access_token)


def _sample_notification(user_id, read_status=False, created_at=None, nid=None):
    return {
        'id': nid or str(uuid.uuid4()),
        'user_id': user_id,
        'message': 'Your complaint status was updated.',
        'read_status': read_status,
        'created_at': created_at or '2024-01-01T00:00:00+00:00',
    }


# ---------------------------------------------------------------------------
# NotificationListView tests
# ---------------------------------------------------------------------------

class TestNotificationListView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.token = _make_jwt(self.user_id)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('apps.notifications.views.firestore_service')
    def test_list_notifications_returns_200(self, mock_fs):
        mock_fs.query.return_value = [
            _sample_notification(self.user_id),
            _sample_notification(self.user_id),
        ]

        resp = self.client.get('/api/notifications/')

        assert resp.status_code == 200
        assert len(resp.json()) == 2

    @patch('apps.notifications.views.firestore_service')
    def test_list_notifications_empty_returns_empty_list(self, mock_fs):
        mock_fs.query.return_value = []

        resp = self.client.get('/api/notifications/')

        assert resp.status_code == 200
        assert resp.json() == []

    @patch('apps.notifications.views.firestore_service')
    def test_notifications_ordered_descending(self, mock_fs):
        """Notifications should be returned newest first."""
        notifications = [
            _sample_notification(self.user_id, created_at='2024-01-01T08:00:00+00:00'),
            _sample_notification(self.user_id, created_at='2024-01-01T12:00:00+00:00'),
            _sample_notification(self.user_id, created_at='2024-01-01T10:00:00+00:00'),
        ]
        mock_fs.query.return_value = notifications

        resp = self.client.get('/api/notifications/')

        assert resp.status_code == 200
        timestamps = [n['created_at'] for n in resp.json()]
        assert timestamps == sorted(timestamps, reverse=True)

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        resp = self.client.get('/api/notifications/')
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# NotificationReadView tests
# ---------------------------------------------------------------------------

class TestNotificationReadView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.token = _make_jwt(self.user_id)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('apps.notifications.views.firestore_service')
    def test_mark_notification_read_returns_200(self, mock_fs):
        nid = str(uuid.uuid4())
        notif = _sample_notification(self.user_id, read_status=False, nid=nid)
        mock_fs.get.return_value = notif
        mock_fs.update.return_value = None

        resp = self.client.patch(f'/api/notifications/{nid}/read/')

        assert resp.status_code == 200
        assert resp.json()['read_status'] is True

    @patch('apps.notifications.views.firestore_service')
    def test_mark_nonexistent_notification_returns_404(self, mock_fs):
        mock_fs.get.return_value = None

        resp = self.client.patch(f'/api/notifications/{uuid.uuid4()}/read/')

        assert resp.status_code == 404

    @patch('apps.notifications.views.firestore_service')
    def test_cannot_mark_other_users_notification(self, mock_fs):
        """A user cannot mark another user's notification as read."""
        nid = str(uuid.uuid4())
        other_user_id = str(uuid.uuid4())
        notif = _sample_notification(other_user_id, nid=nid)
        mock_fs.get.return_value = notif

        resp = self.client.patch(f'/api/notifications/{nid}/read/')

        assert resp.status_code == 403

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        resp = self.client.patch(f'/api/notifications/{uuid.uuid4()}/read/')
        assert resp.status_code == 401
