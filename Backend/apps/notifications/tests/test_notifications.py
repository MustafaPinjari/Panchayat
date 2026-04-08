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


# ---------------------------------------------------------------------------
# NotificationService tests
# ---------------------------------------------------------------------------

class TestNotificationService:
    """Tests for NotificationService helper methods."""

    @patch('apps.notifications.service.firestore_service')
    def test_notify_manager_assigned_creates_notification(self, mock_fs):
        """notify_manager_assigned should create a notification with complaint summary."""
        from apps.notifications.service import NotificationService

        service = NotificationService()
        manager_id = str(uuid.uuid4())
        complaint_id = str(uuid.uuid4())
        complaint_text = 'This is a test complaint with more than 100 characters. ' * 3

        service.notify_manager_assigned(manager_id, complaint_id, complaint_text)

        mock_fs.set.assert_called_once()
        call_args = mock_fs.set.call_args
        assert call_args[0][0] == 'notifications'
        notif_data = call_args[0][2]
        assert notif_data['user_id'] == manager_id
        assert complaint_id in notif_data['message']
        assert len(notif_data['message']) <= 200  # ID + summary should be reasonable length

    @patch('apps.notifications.service.firestore_service')
    def test_notify_manager_assigned_truncates_long_text(self, mock_fs):
        """notify_manager_assigned should truncate complaint text to 100 chars."""
        from apps.notifications.service import NotificationService

        service = NotificationService()
        manager_id = str(uuid.uuid4())
        complaint_id = str(uuid.uuid4())
        complaint_text = 'A' * 200  # Long text

        service.notify_manager_assigned(manager_id, complaint_id, complaint_text)

        call_args = mock_fs.set.call_args
        notif_data = call_args[0][2]
        # The summary should be exactly 100 chars of the complaint text
        assert 'A' * 100 in notif_data['message']
        assert 'A' * 101 not in notif_data['message']

    @patch('apps.notifications.service.firestore_service')
    def test_notify_manager_assigned_handles_short_text(self, mock_fs):
        """notify_manager_assigned should handle complaint text shorter than 100 chars."""
        from apps.notifications.service import NotificationService

        service = NotificationService()
        manager_id = str(uuid.uuid4())
        complaint_id = str(uuid.uuid4())
        complaint_text = 'Short complaint'

        service.notify_manager_assigned(manager_id, complaint_id, complaint_text)

        call_args = mock_fs.set.call_args
        notif_data = call_args[0][2]
        assert 'Short complaint' in notif_data['message']
        assert complaint_id in notif_data['message']

    @patch('apps.notifications.service.firestore_service')
    def test_notify_property_manager_creates_notification(self, mock_fs):
        """notify_property_manager should create a notification with the given message."""
        from apps.notifications.service import NotificationService

        service = NotificationService()
        manager_id = str(uuid.uuid4())
        message = 'Complaint status updated to resolved'

        service.notify_property_manager(manager_id, message)

        mock_fs.set.assert_called_once()
        call_args = mock_fs.set.call_args
        assert call_args[0][0] == 'notifications'
        notif_data = call_args[0][2]
        assert notif_data['user_id'] == manager_id
        assert notif_data['message'] == message
        assert notif_data['read_status'] is False

    @patch('apps.notifications.service.firestore_service')
    def test_notify_property_manager_with_empty_message(self, mock_fs):
        """notify_property_manager should handle empty messages."""
        from apps.notifications.service import NotificationService

        service = NotificationService()
        manager_id = str(uuid.uuid4())
        message = ''

        service.notify_property_manager(manager_id, message)

        mock_fs.set.assert_called_once()
        call_args = mock_fs.set.call_args
        notif_data = call_args[0][2]
        assert notif_data['user_id'] == manager_id
        assert notif_data['message'] == ''
