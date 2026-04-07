"""
AudioUploadView — POST /api/complaints/audio-upload/

Validates the uploaded audio file, stores it in Firebase Storage,
transcribes it via OpenAI Whisper, and returns the URL + transcript.
"""
import logging
import os
import tempfile

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from services.storage_service import storage_service
from services.whisper_service import whisper_service
from .mixins import ValidateAudioFileMixin

logger = logging.getLogger(__name__)


class AudioUploadView(ValidateAudioFileMixin, APIView):
    """
    POST /api/complaints/audio-upload/

    Accepts a multipart/form-data request with an `audio_file` field.
    Validates MIME type and size via ValidateAudioFileMixin, uploads to
    Firebase Storage, transcribes with Whisper, and returns
    { "audio_url": "...", "transcript": "..." }.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delegate file validation to the mixin
        error_response = self.validate_audio_file(request)
        if error_response is not None:
            return error_response

        audio_file = request.FILES['audio_file']
        user_id = getattr(request.user, 'user_id', 'unknown')
        filename = audio_file.name or 'upload'

        # Upload to Firebase Storage
        try:
            audio_file.seek(0)
            audio_url = storage_service.upload_audio(audio_file, user_id, filename)
        except Exception as exc:
            logger.error('Firebase Storage upload failed: %s', exc)
            return Response(
                {'error': 'Failed to upload audio file.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Write to a temp file for Whisper (needs a real file path)
        suffix = os.path.splitext(filename)[1] or '.tmp'
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp_path = tmp.name
                audio_file.seek(0)
                for chunk in audio_file.chunks():
                    tmp.write(chunk)

            transcript = whisper_service.transcribe(tmp_path)
        except RuntimeError as exc:
            # WhisperService raises RuntimeError on API failure
            logger.error('Whisper transcription failed: %s', exc)
            return Response(
                {'error': 'Transcription service unavailable.', 'detail': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            logger.error('Unexpected error during transcription: %s', exc)
            return Response(
                {'error': 'Transcription failed.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

        return Response(
            {'audio_url': audio_url, 'transcript': transcript},
            status=status.HTTP_200_OK,
        )
