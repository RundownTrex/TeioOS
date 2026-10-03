"""Tests for the offline speech transcription service (descriptive dictation)."""

import io
import json
import os
import unittest
import wave

from app.core.exceptions import ServiceUnavailableException, ValidationException
from app.services.speech_service import SpeechTranscriptionService, VoskModelProvider


def make_wav(
    seconds: float = 1.0,
    sample_rate: int = 16000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """Build a silent PCM WAV clip in memory."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(sample_width)
        wav.setframerate(sample_rate)
        wav.writeframes(b"\x00" * int(seconds * sample_rate) * channels * sample_width)
    return buffer.getvalue()


class FakeRecognizer:
    """Stands in for vosk.KaldiRecognizer, returning scripted segments."""

    def __init__(self, segments, final):
        self._segments = list(segments)
        self._final = final
        self.bytes_received = 0

    def AcceptWaveform(self, data):  # noqa: N802 - mirrors the Vosk API
        self.bytes_received += len(data)
        return bool(self._segments)

    def Result(self):  # noqa: N802
        return json.dumps(self._segments.pop(0))

    def FinalResult(self):  # noqa: N802
        return json.dumps(self._final)


class FakeProvider:
    def __init__(self, recognizer=None, error=None):
        self.recognizer = recognizer
        self.error = error
        self.requested_rates = []

    def create_recognizer(self, sample_rate):
        if self.error:
            raise self.error
        self.requested_rates.append(sample_rate)
        return self.recognizer


def build_service(provider, max_seconds=120):
    return SpeechTranscriptionService(
        model_provider=provider,
        supported_languages=["en"],
        max_audio_seconds=max_seconds,
    )


class TestSpeechTranscriptionService(unittest.TestCase):
    def test_combines_segments_and_averages_confidence(self):
        recognizer = FakeRecognizer(
            segments=[{"text": "photosynthesis converts light", "result": [{"conf": 1.0}, {"conf": 0.8}, {"conf": 0.9}]}],
            final={"text": "into energy", "result": [{"conf": 0.7}, {"conf": 0.6}]},
        )
        provider = FakeProvider(recognizer)

        result = build_service(provider).transcribe(make_wav(), "en-US")

        self.assertEqual(result.text, "photosynthesis converts light into energy")
        self.assertEqual(result.language, "en-US")
        self.assertAlmostEqual(result.confidence, 0.8)
        self.assertEqual(provider.requested_rates, [16000])
        self.assertEqual(recognizer.bytes_received, 16000 * 2)

    def test_silence_returns_empty_text(self):
        provider = FakeProvider(FakeRecognizer(segments=[], final={"text": ""}))

        result = build_service(provider).transcribe(make_wav(), "en-IN")

        self.assertEqual(result.text, "")
        self.assertEqual(result.confidence, 0.0)

    def test_rejects_empty_audio(self):
        with self.assertRaises(ValidationException):
            build_service(FakeProvider()).transcribe(b"", "en-US")

    def test_rejects_non_wav_audio(self):
        webm_header = b"\x1aE\xdf\xa3" + b"\x00" * 64
        with self.assertRaises(ValidationException):
            build_service(FakeProvider()).transcribe(webm_header, "en-US")

    def test_rejects_stereo_audio(self):
        with self.assertRaises(ValidationException):
            build_service(FakeProvider()).transcribe(make_wav(channels=2), "en-US")

    def test_rejects_8bit_audio(self):
        with self.assertRaises(ValidationException):
            build_service(FakeProvider()).transcribe(make_wav(sample_width=1), "en-US")

    def test_rejects_overlong_audio(self):
        with self.assertRaises(ValidationException):
            build_service(FakeProvider(), max_seconds=2).transcribe(make_wav(seconds=3), "en-US")

    def test_rejects_unsupported_language(self):
        with self.assertRaises(ValidationException):
            build_service(FakeProvider()).transcribe(make_wav(), "hi-IN")

    def test_language_matching_uses_primary_subtag(self):
        service = build_service(FakeProvider())
        self.assertTrue(service.is_language_supported("en-US"))
        self.assertTrue(service.is_language_supported("EN-gb"))
        self.assertFalse(service.is_language_supported("mr-IN"))
        self.assertFalse(service.is_language_supported(""))

    def test_engine_unavailable_propagates(self):
        provider = FakeProvider(error=ServiceUnavailableException("unavailable"))
        with self.assertRaises(ServiceUnavailableException):
            build_service(provider).transcribe(make_wav(), "en-US")


class TestVoskModelProvider(unittest.TestCase):
    def test_missing_model_directory_is_service_unavailable(self):
        provider = VoskModelProvider("/nonexistent/vosk-model")
        with self.assertRaises(ServiceUnavailableException):
            provider.get_model()


MODEL_PATH = os.environ.get("TEIOOS_TEST_VOSK_MODEL", "")


@unittest.skipUnless(MODEL_PATH and os.path.isdir(MODEL_PATH), "Set TEIOOS_TEST_VOSK_MODEL to run")
class TestVoskIntegration(unittest.TestCase):
    """Runs the real offline engine end to end against the bundled model."""

    @classmethod
    def setUpClass(cls):
        cls.service = SpeechTranscriptionService(
            model_provider=VoskModelProvider(MODEL_PATH),
            supported_languages=["en"],
            max_audio_seconds=120,
        )

    def test_silence_transcribes_to_empty_text(self):
        result = self.service.transcribe(make_wav(seconds=1.5), "en-US")
        self.assertEqual(result.text, "")

    def test_non_16k_sample_rate_is_accepted(self):
        result = self.service.transcribe(make_wav(seconds=1, sample_rate=48000), "en-US")
        self.assertIsInstance(result.text, str)

    def test_spoken_sample_is_transcribed(self):
        sample = os.environ.get("TEIOOS_TEST_SPEECH_WAV", "")
        if not (sample and os.path.isfile(sample)):
            self.skipTest("Set TEIOOS_TEST_SPEECH_WAV to a spoken mono 16-bit WAV")
        with open(sample, "rb") as handle:
            result = self.service.transcribe(handle.read(), "en-US")
        expected = os.environ.get("TEIOOS_TEST_SPEECH_EXPECT", "").lower().split()
        for word in expected:
            self.assertIn(word, result.text.lower())
        self.assertGreater(result.confidence, 0.0)


if __name__ == "__main__":
    unittest.main()
