import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.api.dependencies.auth import get_active_exam_student
from app.api.dependencies.services import SpeechServiceDep
from app.core.exceptions import ValidationException
from app.schemas.response import APIResponse
from app.schemas.speech import SpeechTranscriptionResponse
from app.schemas.token import TokenPayload

logger = logging.getLogger(__name__)

router = APIRouter()

# 16 kHz mono 16-bit PCM is ~32 KB/s; this comfortably covers the configured
# maximum clip length (and 48 kHz clips) while rejecting abusive uploads early.
MAX_AUDIO_UPLOAD_BYTES = 12 * 1024 * 1024


@router.post("/transcribe", response_model=APIResponse[SpeechTranscriptionResponse])
async def transcribe_student_audio(
    token_payload: Annotated[TokenPayload, Depends(get_active_exam_student)],
    speech_service: SpeechServiceDep,
    file: Annotated[UploadFile, File(description="Mono 16-bit PCM WAV recording")],
    language: Annotated[str, Form(max_length=35)] = "en-US",
):
    """
    Transcribe a dictation clip recorded during a descriptive examination.

    Recognition runs fully offline on the exam server (Vosk), so dictation works
    on air-gapped exam networks and student audio never leaves the server.
    Requires an elevated exam session token.
    """
    audio = await file.read(MAX_AUDIO_UPLOAD_BYTES + 1)
    if len(audio) > MAX_AUDIO_UPLOAD_BYTES:
        raise ValidationException("The dictation recording is too large.")

    logger.info(
        "Transcribing dictation for student %s (%d bytes, language %s)",
        token_payload.sub,
        len(audio),
        language,
    )

    # Vosk decoding is CPU-bound; keep it off the event loop.
    result = await run_in_threadpool(speech_service.transcribe, audio, language)

    return APIResponse(
        success=True,
        message="Audio dictation transcribed successfully" if result.text else "No speech was detected",
        data=result,
    )
