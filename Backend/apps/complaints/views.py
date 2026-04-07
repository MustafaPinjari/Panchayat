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
from apps.roles_permissions.permissions import IsAdmin, IsCommitteeOrAdmin
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
            'created_at': _now_iso(),
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


class ComplaintStatusView(APIView):
    """PATCH /api/complaints/{id}/status/ — Committee or Admin only."""

    permission_classes = [IsCommitteeOrAdmin]

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

        try:
            firestore_service.update('complaints', id, {'status': new_status})
        except Exception as exc:
            logger.error('Firestore update failed in ComplaintStatusView: %s', exc)
            return Response(
                {'error': 'Could not update complaint status.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        complaint['status'] = new_status

        # Notify the original submitter if not anonymous and status changed meaningfully
        if new_status in ('in_progress', 'resolved'):
            submitter_id = complaint.get('created_by')
            if submitter_id and not complaint.get('anonymous'):
                notification_service.create_notification(
                    submitter_id,
                    f"Your complaint status has been updated to '{new_status}'.",
                )

        serializer = ComplaintSerializer(complaint, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


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
                order_by='created_at',
            )
        except Exception as exc:
            logger.error('Firestore query failed in CommentListView: %s', exc)
            return Response(
                {'error': 'Could not retrieve comments.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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
