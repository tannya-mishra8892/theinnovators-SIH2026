from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import speech_recognition as sr

router = APIRouter()


class VoiceRequest(BaseModel):
    language: str = "en-IN"


@router.post("/voice-to-text")
async def voice_to_text(req: VoiceRequest):
    recognizer = sr.Recognizer()

    try:
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(
                source,
                duration=0.5
            )

            audio = recognizer.listen(
                source,
                timeout=5,
                phrase_time_limit=10
            )

        text = recognizer.recognize_google(
            audio,
            language=req.language
        )

        return {
            "success": True,
            "text": text
        }

    except sr.WaitTimeoutError:
        raise HTTPException(
            status_code=408,
            detail="No voice detected. Please speak after starting recording."
        )

    except sr.UnknownValueError:
        raise HTTPException(
            status_code=400,
            detail="Could not understand the voice."
        )

    except sr.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Speech recognition service unavailable: {e}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )