"""
ValidateAudioFileMixin — reusable mixin for audio file validation.

Checks MIME type and file size before any processing occurs.
"""
from rest_framework import status
from rest_framework.response import Response

ALLOWED_MIME_TYPES = frozenset({
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/webm',
})
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


class ValidateAudioFileMixin:
    """
    Mixin that validates an uploaded audio file's MIME type and size.

    Usage: mix into any APIView that accepts an `audio_file` field.
    Call `self.validate_audio_file(request)` at the top of your handler;
    it returns a Response on failure or None on success.
    """

    def validate_audio_file(self, request):
        """
        Validate the `audio_file` field in request.FILES.

        Returns a DRF Response with an error if validation fails,
        or None if the file is valid.
        """
        audio_file = request.FILES.get('audio_file')

        if audio_file is None:
            return Response(
                {'error': 'No audio file provided. Use the field name "audio_file".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = audio_file.content_type or ''
        if content_type not in ALLOWED_MIME_TYPES:
            return Response(
                {
                    'error': 'Unsupported audio format.',
                    'detail': (
                        f'Supported formats: {", ".join(sorted(ALLOWED_MIME_TYPES))}'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if audio_file.size > MAX_FILE_SIZE_BYTES:
            return Response(
                {
                    'error': 'File too large.',
                    'detail': 'Maximum allowed file size is 25 MB.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return None  # validation passed
