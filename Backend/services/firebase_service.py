"""
FirestoreService — singleton wrapper around Firebase Admin SDK.
Initialized once at app startup via FIREBASE_CREDENTIALS_PATH env var.
"""
import logging
import os

logger = logging.getLogger(__name__)

_db = None


def _get_db():
    global _db
    if _db is None:
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', '')
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            _db = firestore.client()
        except Exception as exc:
            logger.error("Firebase SDK initialization failed: %s", exc)
            raise RuntimeError(f"Firebase SDK initialization failed: {exc}") from exc
    return _db


class FirestoreService:
    """Singleton Firestore CRUD wrapper."""

    def get(self, collection: str, doc_id: str) -> dict | None:
        doc = _get_db().collection(collection).document(doc_id).get()
        if doc.exists:
            return {"id": doc.id, **doc.to_dict()}
        return None

    def set(self, collection: str, doc_id: str, data: dict) -> None:
        _get_db().collection(collection).document(doc_id).set(data)

    def update(self, collection: str, doc_id: str, data: dict) -> None:
        _get_db().collection(collection).document(doc_id).update(data)

    def delete(self, collection: str, doc_id: str) -> None:
        _get_db().collection(collection).document(doc_id).delete()

    def query(
        self,
        collection: str,
        filters: list[tuple] | None = None,
        order_by: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        from google.cloud.firestore_v1.base_query import FieldFilter
        ref = _get_db().collection(collection)
        if filters:
            for field, op, value in filters:
                ref = ref.where(filter=FieldFilter(field, op, value))
        if order_by:
            ref = ref.order_by(order_by)
        if limit:
            ref = ref.limit(limit)
        return [{"id": doc.id, **doc.to_dict()} for doc in ref.stream()]

    def collection_ref(self, collection: str):
        return _get_db().collection(collection)


firestore_service = FirestoreService()
