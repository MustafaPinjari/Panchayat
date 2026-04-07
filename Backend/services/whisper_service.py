"""
WhisperService — wraps the OpenAI Whisper API for audio transcription.
"""
import logging
import os

logger = logging.getLogger(__name__)


class WhisperService:
    """Transcribes audio files using OpenAI Whisper API."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            import openai
            self._client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY', ''))
        return self._client

    def transcribe(self, file_path: str) -> str:
        """
        Transcribe an audio file using Whisper API.

        Args:
            file_path: Absolute path to the audio file on disk.

        Returns:
            Transcribed text string.

        Raises:
            RuntimeError: If the Whisper API returns an error (caller receives 502).
        """
        try:
            client = self._get_client()
            with open(file_path, 'rb') as audio_file:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )
            return response.text
        except Exception as exc:
            logger.error("Whisper API transcription failed: %s", exc)
            raise RuntimeError(f"Whisper API error: {exc}") from exc


whisper_service = WhisperService()
