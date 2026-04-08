"""
Complaint views:
  ComplaintListCreateView  GET/POST  /api/complaints/
  ComplaintDetailView      GET       /api/complaints/{id}/
  ComplaintStatusView      PATCH     /api/complaints/{id}/status/
  CommentCreateView        POST      /api/comments/
  CommentListView          GET       /api/comments/{complaint_id}/
  AnalyticsView            GET       /api/admin/analytics/
"""
import logging
import os
import uuid
from datetime import datetime, timezone

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.complaints.serializers import (
    VALID_STATUSES,
    CommentSerializer,
    ComplaintSerializer,
)
from apps.notifications.service import notification_service
from apps.roles_permissions.permissions import IsAdmin, IsCommitteeOrAdmin, IsManagerOrCommitteeOrAdmin
from services.firebase_service import firestore_service

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class _ComplaintPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ComplaintListCreateView(APIView):
    """
    GET  /api/complaints/  — paginated list with optional ?category=, ?status=, ?search=
    POST /api/complaints/  — create a new complaint
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = []
        category = request.query_params.get('category')
        status_param = request.query_params.get('status')
        search = request.query_params.get('search', '').strip().lower()

        if category:
            filters.append(('category', '==', category))
        if status_param:
            filters.append(('status', '==', status_param))

        try:
            complaints = firestore_service.query('complaints', filters=filters or None)
        except Exception as exc:
            logger.error('Firestore query failed in ComplaintListCreateView.get: %s', exc)
            return Response(
                {'error': 'Could not retrieve complaints.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Case-insensitive text search (Firestore doesn't support full-text natively)
        if search:
            complaints = [
                c for c in complaints if search in c.get('text', '').lower()
            ]

        serializer = ComplaintSerializer(
            complaints, many=True, context={'request': request}
        )
        paginator = _ComplaintPagination()
        page = paginator.paginate_queryset(serializer.data, request)
        return paginator.get_paginated_response(page)

    def post(self, request):
        serializer = ComplaintSerializer(
            data=request.data, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'detail': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        complaint_id = str(uuid.uuid4())
        user_id = getattr(request.user, 'user_id', None)

        complaint_data = {
            'id': complaint_id,
            'text': serializer.validated_data['text'],
            'audio_url': serializer.validated_data.get('audio_url') or None,
            'created_by': user_id,
            'anonymous': serializer.validated_data.get('anonymous', False),
            'category': serializer.validated_data['category'],
            'status': 'pending',
            'priority': serializer.validated_data.get('priority', 'medium'),
            'created_at': _now_iso(),
            'assigned_to': None,
            'approved_by': None,
            'resolved_at': None,
        }

        try:
            firestore_service.set('complaints', complaint_id, complaint_data)
        except Exception as exc:
            logger.error('Firestore write failed in ComplaintListCreateView.post: %s', exc)
            return Response(
                {'error': 'Could not create complaint.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Notify admins and committee members about the new complaint
        notification_service.notify_admins_and_committee(
            f"New complaint submitted: {complaint_data['text'][:100]}"
        )

        out = ComplaintSerializer(complaint_data, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class ComplaintDetailView(APIView):
    """GET /api/complaints/{id}/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            complaint = firestore_service.get('complaints', id)
        except Exception as exc:
            logger.error('Firestore get failed in ComplaintDetailView: %s', exc)
            return Response(
                {'error': 'Could not retrieve complaint.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if complaint is None:
            return Response(
                {'error': 'Complaint not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ComplaintSerializer(complaint, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


_STATUS_TRANSITIONS = {
    'committee_member': {
        'pending': {'approved', 'rejected'},
    },
    'manager': {
        'assigned': {'in_progress'},
        'in_progress': {'resolved'},
    },
}

_TERMINAL_STATUSES = {'resolved', 'rejected'}


class ComplaintStatusView(APIView):
    """PATCH /api/complaints/{id}/status/ — role-based transition matrix."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        new_status = request.data.get('status')
        if new_status not in VALID_STATUSES:
            return Response(
                {
                    'error': 'Invalid status.',
                    'detail': f"status must be one of: {', '.join(VALID_STATUSES)}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            complaint = firestore_service.get('complaints', id)
        except Exception as exc:
            logger.error('Firestore get failed in ComplaintStatusView: %s', exc)
            return Response(
                {'error': 'Could not retrieve complaint.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if complaint is None:
            return Response(
                {'error': 'Complaint not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_status = complaint.get('status')
        role = getattr(request.user, 'role', None)

        # Terminal state guard
        if current_status in _TERMINAL_STATUSES:
            return Response(
                {'error': 'Complaint is already in a terminal state.'},
                status=status.HTTP_409_CONFLICT,
            )

        _forbidden = Response(
            {'error': 'You do not have permission to perform this status transition.'},
            status=status.HTTP_403_FORBIDDEN,
        )

        if role == 'admin':
            # Admin bypasses matrix
            pass
        elif role == 'resident':
            return _forbidden
        elif role == 'manager':
            user_id = getattr(request.user, 'user_id', None)
            if complaint.get('assigned_to') != user_id:
                return _forbidden
            allowed = _STATUS_TRANSITIONS.get('manager', {}).get(current_status, set())
            if new_status not in allowed:
                return Response(
                    {
                        'error': 'Invalid status transition.',
                        'detail': f"Cannot move from '{current_status}' to '{new_status}'.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )
        elif role == 'committee_member':
            allowed = _STATUS_TRANSITIONS.get('committee_member', {}).get(current_status, set())
            if new_status not in allowed:
                return Response(
                    {
                        'error': 'Invalid status transition.',
                        'detail': f"Cannot move from '{current_status}' to '{new_status}'.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )
        else:
            return _forbidden

        update_data = {'status': new_status}
        if new_status == 'approved':
            update_data['approved_by'] = getattr(request.user, 'user_id', None)
        if new_status == 'resolved':
            update_data['resolved_at'] = _now_iso()

        try:
            firestore_service.update('complaints', id, update_data)
        except Exception as exc:
            logger.error('Firestore update failed in ComplaintStatusView: %s', exc)
            return Response(
                {'error': 'Could not update complaint status.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        complaint.update(update_data)

        submitter_id = complaint.get('created_by')
        if submitter_id and not complaint.get('anonymous'):
            if new_status == 'approved':
                notification_service.create_notification(submitter_id, "Your complaint has been approved.")
            elif new_status == 'in_progress':
                notification_service.create_notification(submitter_id, "Your complaint status has been updated to 'in_progress'.")
            elif new_status == 'resolved':
                notification_service.create_notification(submitter_id, "Your complaint has been resolved.")

        serializer = ComplaintSerializer(complaint, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ComplaintAssignView(APIView):
    """PATCH /api/complaints/{id}/assign/ — Committee or Admin only."""

    permission_classes = [IsCommitteeOrAdmin]

    def patch(self, request, id):
        manager_id = request.data.get('manager_id')
        if not manager_id:
            return Response(
                {'error': 'manager_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            complaint = firestore_service.get('complaints', id)
        except Exception as exc:
            logger.error('Firestore get failed in ComplaintAssignView: %s', exc)
            return Response(
                {'error': 'Could not retrieve complaint.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if complaint is None:
            return Response(
                {'error': 'Complaint not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if complaint.get('status') != 'approved':
            return Response(
                {
                    'error': 'Invalid status transition.',
                    'detail': "Complaint must be in 'approved' status to be assigned.",
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            target_user = firestore_service.get('users', manager_id)
        except Exception as exc:
            logger.error('Firestore get failed for user in ComplaintAssignView: %s', exc)
            target_user = None

        if not target_user or target_user.get('role') != 'manager':
            return Response(
                {'error': 'Target user is not a valid Property Manager.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            assigned_complaints = firestore_service.query(
                'complaints',
                filters=[('assigned_to', '==', manager_id), ('status', '==', 'assigned')],
            )
            in_progress_complaints = firestore_service.query(
                'complaints',
                filters=[('assigned_to', '==', manager_id), ('status', '==', 'in_progress')],
            )
        except Exception as exc:
            logger.error('Firestore query failed in ComplaintAssignView capacity check: %s', exc)
            return Response(
                {'error': 'Could not check manager capacity.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if len(assigned_complaints) + len(in_progress_complaints) >= 20:
            return Response(
                {
                    'error': 'Manager is at capacity.',
                    'detail': 'This manager already has 20 or more active complaints.',
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        update_data = {'assigned_to': manager_id, 'status': 'assigned'}
        try:
            firestore_service.update('complaints', id, update_data)
        except Exception as exc:
            logger.error('Firestore update failed in ComplaintAssignView: %s', exc)
            return Response(
                {'error': 'Could not assign complaint.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        complaint.update(update_data)

        notification_service.create_notification(
            manager_id,
            f"You have been assigned complaint {id}: {complaint.get('text', '')[:100]}",
        )

        submitter_id = complaint.get('created_by')
        if submitter_id and not complaint.get('anonymous'):
            notification_service.create_notification(
                submitter_id,
                "Your complaint has been assigned to a property manager.",
            )

        serializer = ComplaintSerializer(complaint, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ManagerTaskListView(APIView):
    """GET /api/manager/tasks/ — Manager, Committee, or Admin."""

    permission_classes = [IsManagerOrCommitteeOrAdmin]

    def get(self, request):
        role = getattr(request.user, 'role', None)

        try:
            if role == 'manager':
                complaints = firestore_service.query(
                    'complaints',
                    filters=[('assigned_to', '==', request.user.user_id)],
                )
            else:
                # admin or committee_member: return all assigned complaints
                all_complaints = firestore_service.query('complaints')
                complaints = [c for c in all_complaints if c.get('assigned_to') is not None]
        except Exception as exc:
            logger.error('Firestore query failed in ManagerTaskListView: %s', exc)
            return Response(
                {'error': 'Could not retrieve tasks.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = ComplaintSerializer(complaints, many=True, context={'request': request})
        paginator = _ComplaintPagination()
        page = paginator.paginate_queryset(serializer.data, request)
        return paginator.get_paginated_response(page)


class CommentCreateView(APIView):
    """POST /api/comments/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'detail': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        complaint_id = serializer.validated_data['complaint_id']

        # Verify the complaint exists
        try:
            complaint = firestore_service.get('complaints', complaint_id)
        except Exception as exc:
            logger.error('Firestore get failed in CommentCreateView: %s', exc)
            return Response(
                {'error': 'Could not verify complaint.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if complaint is None:
            return Response(
                {'error': 'Complaint not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user_id = getattr(request.user, 'user_id', None)
        comment_id = str(uuid.uuid4())
        comment_data = {
            'id': comment_id,
            'complaint_id': complaint_id,
            'created_by': user_id,
            'text': serializer.validated_data['text'],
            'created_at': _now_iso(),
        }

        try:
            firestore_service.set('comments', comment_id, comment_data)
        except Exception as exc:
            logger.error('Firestore write failed in CommentCreateView: %s', exc)
            return Response(
                {'error': 'Could not create comment.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Notify complaint owner if not anonymous and not the same user
        owner_id = complaint.get('created_by')
        if owner_id and not complaint.get('anonymous') and owner_id != user_id:
            notification_service.create_notification(
                owner_id,
                f"A new comment was posted on your complaint.",
            )

        out = CommentSerializer(comment_data)
        return Response(out.data, status=status.HTTP_201_CREATED)


class CommentListView(APIView):
    """GET /api/comments/{complaint_id}/ — ordered by created_at ascending."""

    permission_classes = [IsAuthenticated]

    def get(self, request, complaint_id):
        try:
            comments = firestore_service.query(
                'comments',
                filters=[('complaint_id', '==', complaint_id)],
            )
        except Exception as exc:
            logger.error('Firestore query failed in CommentListView: %s', exc)
            return Response(
                {'error': 'Could not retrieve comments.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        comments = sorted(comments, key=lambda c: c.get('created_at', ''))

        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnalyticsView(APIView):
    """GET /api/admin/analytics/ — Admin only."""

    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            complaints = firestore_service.query('complaints')
        except Exception as exc:
            logger.error('Firestore query failed in AnalyticsView: %s', exc)
            return Response(
                {'error': 'Could not retrieve analytics.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        total = len(complaints)
        by_status: dict = {}
        by_category: dict = {}

        for c in complaints:
            s = c.get('status', 'unknown')
            cat = c.get('category', 'unknown')
            by_status[s] = by_status.get(s, 0) + 1
            by_category[cat] = by_category.get(cat, 0) + 1

        return Response(
            {'total': total, 'by_status': by_status, 'by_category': by_category},
            status=status.HTTP_200_OK,
        )


class CategorizationView(APIView):
    """
    POST /api/complaints/categorize/
    Body: { "text": "..." }
    Returns: { "category": "water" | "security" | "maintenance" | "noise" | "cleanliness" | "other",
               "confidence": "high" | "medium" | "low" }
    Uses OpenAI GPT to suggest a category for the complaint text.
    Falls back gracefully if OpenAI is unavailable.
    """

    permission_classes = [IsAuthenticated]

    CATEGORIES = ['water', 'security', 'maintenance', 'noise', 'cleanliness', 'other']

    def post(self, request):
        text = (request.data.get('text') or '').strip()
        if not text:
            return Response(
                {'error': 'text is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = os.environ.get('OPENAI_API_KEY', '')
        if not api_key:
            return Response(
                {'category': 'other', 'confidence': 'low'},
                status=status.HTTP_200_OK,
            )

        try:
            import openai
            client = openai.OpenAI(api_key=api_key)
            prompt = (
                f"Classify this housing society complaint into exactly one category.\n"
                f"Categories: water, security, maintenance, noise, cleanliness, other\n"
                f"Complaint: \"{text[:500]}\"\n"
                f"Reply with JSON only: {{\"category\": \"<category>\", \"confidence\": \"high\"|\"medium\"|\"low\"}}"
            )
            response = client.chat.completions.create(
                model='gpt-3.5-turbo',
                messages=[{'role': 'user', 'content': prompt}],
                max_tokens=50,
                temperature=0,
            )
            import json
            raw = response.choices[0].message.content.strip()
            result = json.loads(raw)
            category = result.get('category', 'other').lower()
            if category not in self.CATEGORIES:
                category = 'other'
            confidence = result.get('confidence', 'medium')
            return Response({'category': category, 'confidence': confidence}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.warning('AI categorization failed, returning fallback: %s', exc)
            return Response({'category': 'other', 'confidence': 'low'}, status=status.HTTP_200_OK)
