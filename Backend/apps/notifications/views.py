"""
Notification views:
  NotificationListView  GET   /api/notifications/
  NotificationReadView  PATCH /api/notifications/{id}/read/
"""
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.serializers import NotificationSerializer
from services.firebase_service import firestore_service

logger = logging.getLogger(__name__)


class NotificationListView(APIView):
    """GET /api/notifications/ — returns notifications for the authenticated user, newest first."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = getattr(request.user, 'user_id', None)
        try:
            notifications = firestore_service.query(
                'notifications',
                filters=[('user_id', '==', user_id)],
                order_by='created_at',
            )
        except Exception as exc:
            logger.error('Firestore query failed in NotificationListView: %s', exc)
            return Response(
                {'error': 'Could not retrieve notifications.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Sort descending by created_at (Firestore order_by is ascending)
        notifications = sorted(
            notifications, key=lambda n: n.get('created_at', ''), reverse=True
        )

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationReadView(APIView):
    """PATCH /api/notifications/{id}/read/ — marks a notification as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        user_id = getattr(request.user, 'user_id', None)

        try:
            notification = firestore_service.get('notifications', id)
        except Exception as exc:
            logger.error('Firestore get failed in NotificationReadView: %s', exc)
            return Response(
                {'error': 'Could not retrieve notification.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if notification is None:
            return Response(
                {'error': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if notification.get('user_id') != user_id:
            return Response(
                {'error': 'You do not have permission to update this notification.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            firestore_service.update('notifications', id, {'read_status': True})
        except Exception as exc:
            logger.error('Firestore update failed in NotificationReadView: %s', exc)
            return Response(
                {'error': 'Could not update notification.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        notification['read_status'] = True
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
