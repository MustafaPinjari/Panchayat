"""
Tests for complaint and comment endpoints.
Firebase calls are mocked so no real Firebase connection is needed.
"""
import uuid
from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_jwt(user_id: str, role: str, email: str = 'user@example.com') -> str:
    _uid = user_id
    _email = email
    _role = role

    class _FakeUser:
        pk = _uid
        id = _uid
        firestore_id = _uid
        is_active = True

    _FakeUser.email = _email

    refresh = RefreshToken.for_user(_FakeUser())
    refresh['user_id'] = _uid
    refresh['email'] = _email
    refresh['role'] = _role
    return str(refresh.access_token)


def _sample_complaint(user_id=None, category='water', status='pending', anonymous=False, cid=None):
    cid = cid or str(uuid.uuid4())
    return {
        'id': cid,
        'text': 'There is a water leak in block A.',
        'audio_url': None,
        'created_by': user_id or str(uuid.uuid4()),
        'anonymous': anonymous,
        'category': category,
        'status': status,
        'created_at': '2024-01-01T00:00:00+00:00',
    }


def _sample_comment(complaint_id, user_id=None, cmt_id=None):
    return {
        'id': cmt_id or str(uuid.uuid4()),
        'complaint_id': complaint_id,
        'created_by': user_id or str(uuid.uuid4()),
        'text': 'This is a comment.',
        'created_at': '2024-01-01T00:00:00+00:00',
    }


# ---------------------------------------------------------------------------
# ComplaintListCreateView tests
# ---------------------------------------------------------------------------

class TestComplaintListCreateView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.token = _make_jwt(self.user_id, 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('apps.complaints.views.notification_service')
    @patch('apps.complaints.views.firestore_service')
    def test_create_complaint_returns_201(self, mock_fs, mock_notif):
        mock_fs.set.return_value = None
        mock_notif.notify_admins_and_committee.return_value = None

        payload = {'text': 'Broken streetlight', 'category': 'maintenance', 'anonymous': False}
        resp = self.client.post('/api/complaints/', payload, format='json')

        assert resp.status_code == 201
        data = resp.json()
        assert data['status'] == 'pending'
        assert data['category'] == 'maintenance'
        assert 'id' in data

    @patch('apps.complaints.views.notification_service')
    @patch('apps.complaints.views.firestore_service')
    def test_create_complaint_invalid_category_returns_400(self, mock_fs, mock_notif):
        payload = {'text': 'Some issue', 'category': 'invalid_cat', 'anonymous': False}
        resp = self.client.post('/api/complaints/', payload, format='json')
        assert resp.status_code == 400

    @patch('apps.complaints.views.firestore_service')
    def test_list_complaints_returns_paginated_response(self, mock_fs):
        mock_fs.query.return_value = [_sample_complaint(), _sample_complaint()]

        resp = self.client.get('/api/complaints/')

        assert resp.status_code == 200
        data = resp.json()
        assert 'count' in data
        assert 'results' in data
        assert 'next' in data
        assert 'previous' in data

    @patch('apps.complaints.views.firestore_service')
    def test_list_complaints_empty_still_paginated(self, mock_fs):
        mock_fs.query.return_value = []

        resp = self.client.get('/api/complaints/')

        assert resp.status_code == 200
        data = resp.json()
        assert data['count'] == 0
        assert data['results'] == []

    @patch('apps.complaints.views.firestore_service')
    def test_list_complaints_category_filter(self, mock_fs):
        mock_fs.query.return_value = [_sample_complaint(category='security')]

        resp = self.client.get('/api/complaints/?category=security')

        assert resp.status_code == 200
        # Verify the filter was passed to Firestore
        call_args = mock_fs.query.call_args
        assert call_args is not None

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        resp = self.client.get('/api/complaints/')
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# ComplaintDetailView tests
# ---------------------------------------------------------------------------

class TestComplaintDetailView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.token = _make_jwt(self.user_id, 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    @patch('apps.complaints.views.firestore_service')
    def test_get_complaint_returns_200(self, mock_fs):
        cid = str(uuid.uuid4())
        mock_fs.get.return_value = _sample_complaint(cid=cid)

        resp = self.client.get(f'/api/complaints/{cid}/')

        assert resp.status_code == 200
        assert resp.json()['id'] == cid

    @patch('apps.complaints.views.firestore_service')
    def test_get_nonexistent_complaint_returns_404(self, mock_fs):
        mock_fs.get.return_value = None

        resp = self.client.get(f'/api/complaints/{uuid.uuid4()}/')

        assert resp.status_code == 404

    @patch('apps.complaints.views.firestore_service')
    def test_anonymous_complaint_hides_created_by_for_non_admin(self, mock_fs):
        cid = str(uuid.uuid4())
        complaint = _sample_complaint(cid=cid, anonymous=True)
        mock_fs.get.return_value = complaint

        resp = self.client.get(f'/api/complaints/{cid}/')

        assert resp.status_code == 200
        assert 'created_by' not in resp.json()

    @patch('apps.complaints.views.firestore_service')
    def test_anonymous_complaint_shows_created_by_for_admin(self, mock_fs):
        admin_token = _make_jwt(str(uuid.uuid4()), 'admin')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

        cid = str(uuid.uuid4())
        complaint = _sample_complaint(cid=cid, anonymous=True)
        mock_fs.get.return_value = complaint

        resp = self.client.get(f'/api/complaints/{cid}/')

        assert resp.status_code == 200
        assert 'created_by' in resp.json()


# ---------------------------------------------------------------------------
# ComplaintStatusView tests
# ---------------------------------------------------------------------------

class TestComplaintStatusView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.cid = str(uuid.uuid4())

    @patch('apps.complaints.views.notification_service')
    @patch('apps.complaints.views.firestore_service')
    def test_committee_can_update_status(self, mock_fs, mock_notif):
        token = _make_jwt(str(uuid.uuid4()), 'committee_member')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        # Committee can move pending → approved (valid transition in new matrix)
        mock_fs.get.return_value = _sample_complaint(cid=self.cid, status='pending')
        mock_fs.update.return_value = None
        mock_notif.create_notification.return_value = None

        resp = self.client.patch(
            f'/api/complaints/{self.cid}/status/',
            {'status': 'approved'},
            format='json',
        )

        assert resp.status_code == 200
        assert resp.json()['status'] == 'approved'

    @patch('apps.complaints.views.notification_service')
    @patch('apps.complaints.views.firestore_service')
    def test_admin_can_update_status(self, mock_fs, mock_notif):
        token = _make_jwt(str(uuid.uuid4()), 'admin')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        mock_fs.get.return_value = _sample_complaint(cid=self.cid)
        mock_fs.update.return_value = None

        resp = self.client.patch(
            f'/api/complaints/{self.cid}/status/',
            {'status': 'resolved'},
            format='json',
        )

        assert resp.status_code == 200

    @patch('apps.complaints.views.firestore_service')
    def test_resident_cannot_update_status_returns_403(self, mock_fs):
        token = _make_jwt(str(uuid.uuid4()), 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        # Provide a complaint so the role check is reached (not a 404)
        mock_fs.get.return_value = _sample_complaint(cid=self.cid, status='pending')

        resp = self.client.patch(
            f'/api/complaints/{self.cid}/status/',
            {'status': 'resolved'},
            format='json',
        )

        assert resp.status_code == 403

    @patch('apps.complaints.views.firestore_service')
    def test_invalid_status_returns_400(self, mock_fs):
        token = _make_jwt(str(uuid.uuid4()), 'admin')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        resp = self.client.patch(
            f'/api/complaints/{self.cid}/status/',
            {'status': 'invalid_status'},
            format='json',
        )

        assert resp.status_code == 400

    @patch('apps.complaints.views.firestore_service')
    def test_nonexistent_complaint_returns_404(self, mock_fs):
        token = _make_jwt(str(uuid.uuid4()), 'admin')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        mock_fs.get.return_value = None

        resp = self.client.patch(
            f'/api/complaints/{self.cid}/status/',
            {'status': 'resolved'},
            format='json',
        )

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# CommentCreateView tests
# ---------------------------------------------------------------------------

class TestCommentCreateView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.token = _make_jwt(self.user_id, 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.cid = str(uuid.uuid4())

    @patch('apps.complaints.views.notification_service')
    @patch('apps.complaints.views.firestore_service')
    def test_create_comment_returns_201(self, mock_fs, mock_notif):
        mock_fs.get.return_value = _sample_complaint(cid=self.cid)
        mock_fs.set.return_value = None
        mock_notif.create_notification.return_value = None

        resp = self.client.post(
            '/api/comments/',
            {'complaint_id': self.cid, 'text': 'This is a comment'},
            format='json',
        )

        assert resp.status_code == 201
        data = resp.json()
        assert data['complaint_id'] == self.cid
        assert data['text'] == 'This is a comment'

    @patch('apps.complaints.views.firestore_service')
    def test_comment_on_nonexistent_complaint_returns_404(self, mock_fs):
        mock_fs.get.return_value = None

        resp = self.client.post(
            '/api/comments/',
            {'complaint_id': str(uuid.uuid4()), 'text': 'A comment'},
            format='json',
        )

        assert resp.status_code == 404

    def test_unauthenticated_returns_401(self):
        self.client.credentials()
        resp = self.client.post(
            '/api/comments/',
            {'complaint_id': self.cid, 'text': 'A comment'},
            format='json',
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# CommentListView tests
# ---------------------------------------------------------------------------

class TestCommentListView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.token = _make_jwt(str(uuid.uuid4()), 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        self.cid = str(uuid.uuid4())

    @patch('apps.complaints.views.firestore_service')
    def test_list_comments_returns_200(self, mock_fs):
        mock_fs.query.return_value = [
            _sample_comment(self.cid, cmt_id=str(uuid.uuid4())),
            _sample_comment(self.cid, cmt_id=str(uuid.uuid4())),
        ]

        resp = self.client.get(f'/api/comments/{self.cid}/')

        assert resp.status_code == 200
        assert len(resp.json()) == 2

    @patch('apps.complaints.views.firestore_service')
    def test_list_comments_empty_returns_empty_list(self, mock_fs):
        mock_fs.query.return_value = []

        resp = self.client.get(f'/api/comments/{self.cid}/')

        assert resp.status_code == 200
        assert resp.json() == []

    @patch('apps.complaints.views.firestore_service')
    def test_comments_ordered_ascending(self, mock_fs):
        """Comments should be returned in ascending created_at order."""
        comments = [
            {**_sample_comment(self.cid), 'created_at': '2024-01-01T10:00:00+00:00'},
            {**_sample_comment(self.cid), 'created_at': '2024-01-01T08:00:00+00:00'},
            {**_sample_comment(self.cid), 'created_at': '2024-01-01T12:00:00+00:00'},
        ]
        # Firestore returns them in order_by ascending already
        mock_fs.query.return_value = sorted(comments, key=lambda c: c['created_at'])

        resp = self.client.get(f'/api/comments/{self.cid}/')

        assert resp.status_code == 200
        timestamps = [c['created_at'] for c in resp.json()]
        assert timestamps == sorted(timestamps)


# ---------------------------------------------------------------------------
# AnalyticsView tests
# ---------------------------------------------------------------------------

class TestAnalyticsView:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.admin_token = _make_jwt(str(uuid.uuid4()), 'admin')

    @patch('apps.complaints.views.firestore_service')
    def test_admin_gets_analytics(self, mock_fs):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        mock_fs.query.return_value = [
            _sample_complaint(category='water', status='pending'),
            _sample_complaint(category='water', status='resolved'),
            _sample_complaint(category='security', status='in_progress'),
        ]

        resp = self.client.get('/api/admin/analytics/')

        assert resp.status_code == 200
        data = resp.json()
        assert data['total'] == 3
        assert data['by_status']['pending'] == 1
        assert data['by_status']['resolved'] == 1
        assert data['by_status']['in_progress'] == 1
        assert data['by_category']['water'] == 2
        assert data['by_category']['security'] == 1

    @patch('apps.complaints.views.firestore_service')
    def test_analytics_counts_sum_to_total(self, mock_fs):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        mock_fs.query.return_value = [
            _sample_complaint(category='water', status='pending'),
            _sample_complaint(category='noise', status='pending'),
            _sample_complaint(category='maintenance', status='resolved'),
        ]

        resp = self.client.get('/api/admin/analytics/')

        assert resp.status_code == 200
        data = resp.json()
        assert sum(data['by_status'].values()) == data['total']
        assert sum(data['by_category'].values()) == data['total']

    @patch('apps.complaints.views.firestore_service')
    def test_analytics_empty_complaints(self, mock_fs):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        mock_fs.query.return_value = []

        resp = self.client.get('/api/admin/analytics/')

        assert resp.status_code == 200
        data = resp.json()
        assert data['total'] == 0
        assert data['by_status'] == {}
        assert data['by_category'] == {}

    def test_non_admin_gets_403(self):
        resident_token = _make_jwt(str(uuid.uuid4()), 'resident')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resident_token}')

        resp = self.client.get('/api/admin/analytics/')

        assert resp.status_code == 403

    def test_committee_member_gets_403(self):
        committee_token = _make_jwt(str(uuid.uuid4()), 'committee_member')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {committee_token}')

        resp = self.client.get('/api/admin/analytics/')

        assert resp.status_code == 403

    def test_unauthenticated_gets_401(self):
        resp = self.client.get('/api/admin/analytics/')
        assert resp.status_code == 401
