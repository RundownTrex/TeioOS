from pydantic import BaseModel, Field


class SpeechTranscriptionResponse(BaseModel):
    """
    Schema for transcribed speech response.
    """
    text: str = Field(..., description="Transcribed text from the audio input")
    language: str = Field("en-US", description="Language used for transcription")
    confidence: float = Field(1.0, description="Transcription confidence score (0.0 to 1.0)")
