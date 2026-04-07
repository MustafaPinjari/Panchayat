"""
NotificationService — helper for creating Firestore notification documents.
"""
import logging
import uuid
from datetime import datetime, timezone

from services.firebase_service import firestore_service

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class NotificationService:
    def create_notification(self, user_id: str, message: str) -> None:
        """Write a single notification document to Firestore `notifications` collection."""
        try:
            notif_id = str(uuid.uuid4())
            firestore_service.set(
                'notifications',
                notif_id,
                {
                    'id': notif_id,
                    'user_id': user_id,
                    'message': message,
                    'read_status': False,
                    'created_at': _now_iso(),
                },
            )
        except Exception as exc:
            logger.error('Failed to create notification for user %s: %s', user_id, exc)

    def notify_admins_and_committee(self, message: str) -> None:
        """Create a notification for every admin and committee_member user."""
        try:
            admins = firestore_service.query('users', filters=[('role', '==', 'admin')])
            committee = firestore_service.query(
                'users', filters=[('role', '==', 'committee_member')]
            )
            for user in admins + committee:
                self.create_notification(user['id'], message)
        except Exception as exc:
            logger.error('Failed to notify admins/committee: %s', exc)


notification_service = NotificationService()
