"""
AudioUploadView — POST /api/audio/audio-upload/

Receives an audio file, transcribes it via OpenAI Whisper, and returns
the transcript. Audio is NOT stored — only the transcript text is returned
for the user to review and submit as a complaint.
"""
import logging
import os
import tempfile

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from services.whisper_service import whisper_service
from .mixins import ValidateAudioFileMixin

logger = logging.getLogger(__name__)


class AudioUploadView(ValidateAudioFileMixin, APIView):
    """
    POST /api/audio/audio-upload/

    Accepts a multipart/form-data request with an `audio_file` field.
    Transcribes with Whisper and returns { "audio_url": null, "transcript": "..." }.
    Audio is not stored — only the transcript is returned.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        error_response = self.validate_audio_file(request)
        if error_response is not None:
            return error_response

        audio_file = request.FILES['audio_file']
        filename = audio_file.name or 'upload'
        suffix = os.path.splitext(filename)[1] or '.webm'

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp_path = tmp.name
                for chunk in audio_file.chunks():
                    tmp.write(chunk)

            transcript = whisper_service.transcribe(tmp_path)
        except RuntimeError as exc:
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
            {'audio_url': None, 'transcript': transcript},
            status=status.HTTP_200_OK,
        )
