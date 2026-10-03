"""Offline speech-to-text for descriptive answer dictation.

Exam LANs are frequently air-gapped, so cloud recognisers (Google Web Speech,
the browser's native ``webkitSpeechRecognition`` in Chromium) cannot be relied
upon. This service transcribes audio entirely on the exam server with Vosk.

Audio contract
--------------
The exam client decodes its microphone recording in the browser and uploads a
mono, 16-bit PCM WAV file (16 kHz preferred). Accepting only WAV keeps the
server free of heavyweight codec dependencies such as ffmpeg; Python's standard
``wave`` module is sufficient to read it.
"""

from __future__ import annotations

import io
import json
import logging
import os
import threading
import wave
from typing import Any

from app.core.exceptions import ServiceUnavailableException, ValidationException
from app.schemas.speech import SpeechTranscriptionResponse

logger = logging.getLogger(__name__)

# Number of PCM frames fed to the recogniser per step (0.25 s at 16 kHz).
_CHUNK_FRAMES = 4000
_MIN_SAMPLE_RATE = 8000
_MAX_SAMPLE_RATE = 48000

UNAVAILABLE_MESSAGE = (
    "Speech dictation is not available on this exam server. "
    "Please type your response into the answer field."
)


class VoskModelProvider:
    """Loads the Vosk acoustic model once and shares it across requests.

    Loading the model takes roughly a second and a few hundred megabytes of
    memory, so it must not happen per request. A ``vosk.Model`` is safe to
    share between threads; each transcription creates its own recogniser.
    """

    def __init__(self, model_path: str) -> None:
        self._model_path = model_path
        self._model: Any | None = None
        self._lock = threading.Lock()

    @property
    def model_path(self) -> str:
        """Filesystem location of the configured acoustic model."""
        return self._model_path

    def get_model(self) -> Any:
        """Return the loaded model, loading it on first use.

        Raises:
            ServiceUnavailableException: If Vosk is not installed or the model
                directory is missing or unreadable.
        """
        if self._model is not None:
            return self._model

        with self._lock:
            if self._model is not None:
                return self._model

            try:
                import vosk
            except ImportError as exc:
                logger.error("Vosk is not installed; offline dictation disabled")
                raise ServiceUnavailableException(UNAVAILABLE_MESSAGE) from exc

            if not os.path.isdir(self._model_path):
                logger.error("Vosk model directory not found at %s", self._model_path)
                raise ServiceUnavailableException(UNAVAILABLE_MESSAGE)

            vosk.SetLogLevel(-1)
            try:
                self._model = vosk.Model(self._model_path)
            except Exception as exc:  # Vosk raises a bare Exception on bad models
                logger.exception("Failed to load Vosk model from %s", self._model_path)
                raise ServiceUnavailableException(UNAVAILABLE_MESSAGE) from exc

            logger.info("Loaded offline speech model from %s", self._model_path)
            return self._model

    def create_recognizer(self, sample_rate: int) -> Any:
        """Create a fresh, per-request recogniser for the given sample rate."""
        import vosk

        recognizer = vosk.KaldiRecognizer(self.get_model(), float(sample_rate))
        recognizer.SetWords(True)
        return recognizer


class SpeechTranscriptionService:
    """Validates uploaded dictation audio and transcribes it offline."""

    def __init__(
        self,
        model_provider: VoskModelProvider,
        supported_languages: list[str],
        max_audio_seconds: int,
    ) -> None:
        self._model_provider = model_provider
        self._supported_languages = [lang.lower() for lang in supported_languages]
        self._max_audio_seconds = max_audio_seconds

    def is_language_supported(self, language: str) -> bool:
        """Return True if the bundled model covers the BCP-47 ``language`` tag."""
        primary = (language or "").split("-")[0].lower()
        return primary in self._supported_languages

    def transcribe(self, audio: bytes, language: str) -> SpeechTranscriptionResponse:
        """Transcribe a mono 16-bit PCM WAV clip.

        Args:
            audio: Raw bytes of the uploaded WAV file.
            language: BCP-47 language tag requested by the client (e.g. "en-US").

        Returns:
            The recognised text (possibly empty when no speech was detected),
            the language and an average word confidence between 0 and 1.

        Raises:
            ValidationException: For empty, malformed, unsupported or overlong audio,
                or a language the bundled model cannot transcribe.
            ServiceUnavailableException: If the speech engine is not available.
        """
        if not audio:
            raise ValidationException("The dictation recording is empty.")

        if not self.is_language_supported(language):
            raise ValidationException(
                f"Speech dictation is not available for language '{language}' on this server."
            )

        sample_rate, frames = self._read_wav(audio)
        recognizer = self._model_provider.create_recognizer(sample_rate)

        segments: list[dict[str, Any]] = []
        bytes_per_chunk = _CHUNK_FRAMES * 2  # 16-bit mono => 2 bytes per frame
        for offset in range(0, len(frames), bytes_per_chunk):
            if recognizer.AcceptWaveform(frames[offset:offset + bytes_per_chunk]):
                segments.append(json.loads(recognizer.Result()))
        segments.append(json.loads(recognizer.FinalResult()))

        text = " ".join(seg.get("text", "").strip() for seg in segments if seg.get("text")).strip()
        words = [word for seg in segments for word in seg.get("result", [])]
        confidence = (
            round(sum(float(w.get("conf", 0.0)) for w in words) / len(words), 3) if words else 0.0
        )

        return SpeechTranscriptionResponse(text=text, language=language, confidence=confidence)

    def _read_wav(self, audio: bytes) -> tuple[int, bytes]:
        """Validate the WAV container and return (sample_rate, pcm_frames)."""
        try:
            with wave.open(io.BytesIO(audio), "rb") as wav:
                channels = wav.getnchannels()
                sample_width = wav.getsampwidth()
                sample_rate = wav.getframerate()
                frame_count = wav.getnframes()
                if channels != 1 or sample_width != 2 or wav.getcomptype() != "NONE":
                    raise ValidationException(
                        "Dictation audio must be mono 16-bit PCM WAV."
                    )
                if not _MIN_SAMPLE_RATE <= sample_rate <= _MAX_SAMPLE_RATE:
                    raise ValidationException(
                        f"Unsupported dictation sample rate {sample_rate} Hz."
                    )
                if frame_count / sample_rate > self._max_audio_seconds:
                    raise ValidationException(
                        f"Dictation clips are limited to {self._max_audio_seconds} seconds. "
                        "Please stop and restart dictation more often."
                    )
                frames = wav.readframes(frame_count)
        except (wave.Error, EOFError) as exc:
            raise ValidationException("Dictation audio is not a valid WAV file.") from exc

        return sample_rate, frames
