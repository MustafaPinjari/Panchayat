"""
StorageService — handles audio file uploads to Firebase Storage.
"""
import logging
import os
import time

logger = logging.getLogger(__name__)


class StorageService:
    """Uploads files to Firebase Storage and returns public download URLs."""

    def upload_audio(self, file_obj, user_id: str, filename: str) -> str:
        """
        Upload an audio file to Firebase Storage.

        Stores under: audio/{user_id}/{timestamp}_{filename}
        Returns a public download URL string.
        """
        try:
            import firebase_admin
            from firebase_admin import storage

            bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET', '')
            bucket = storage.bucket(bucket_name)

            timestamp = int(time.time())
            path = f"audio/{user_id}/{timestamp}_{filename}"
            blob = bucket.blob(path)
            blob.upload_from_file(file_obj)
            blob.make_public()
            return blob.public_url
        except Exception as exc:
            logger.error("Firebase Storage upload failed: %s", exc)
            raise

    def delete_file(self, path: str) -> None:
        """Delete a file from Firebase Storage by its storage path."""
        try:
            import firebase_admin
            from firebase_admin import storage

            bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET', '')
            bucket = storage.bucket(bucket_name)
            blob = bucket.blob(path)
            blob.delete()
        except Exception as exc:
            logger.error("Firebase Storage delete failed: %s", exc)
            raise


storage_service = StorageService()
