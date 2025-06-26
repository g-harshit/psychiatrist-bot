from fastapi import APIRouter, UploadFile, File, Form, Query, Response
from db.repository import repo
from services.session_service import SessionService
from services.speech import speech_to_text, text_to_speech
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64

router = APIRouter()
session_service = SessionService()

class SessionRequest(BaseModel):
    user_id: int

@router.post("/register/")
def register(name: str = Form(...), age: int = Form(...), sex: str = Form(...)):
    existing_user = repo.get_user_by_name(name)
    if existing_user:
        user = existing_user
        # Use the most recent session if it exists, else create a new one
        session = user.sessions[-1] if user.sessions else repo.create_session(user.id)
    else:
        user = repo.create_user(name, age, sex)
        session = repo.create_session(user.id)
    return {"user": user, "session": session}

@router.post("/session/")
def create_session(req: SessionRequest):
    session = repo.create_session(req.user_id)
    return session

@router.post("/chat/audio/")
def chat_audio(user_id: int = Form(...), session_id: int = Form(...), audio: UploadFile = File(...)):
    audio_bytes = audio.file.read()
    try:
        transcribed_text = session_service.llm_strategy.llm.transcribe_audio(audio_bytes)
    except Exception as e:
        print("Transcription error:", e)
        transcribed_text = "[Could not transcribe audio]"
    try:
        result = session_service.chat(user_id, session_id, transcribed_text)
        audio_response = text_to_speech(result["response"])
        audio_b64 = base64.b64encode(audio_response).decode("utf-8")
        return {"response": result["response"], "history": result["history"], "transcribed_text": transcribed_text, "audio_b64": audio_b64}
    except Exception as e:
        print("Chat/audio error:", e)
        session = repo.get_session(session_id)
        return JSONResponse(status_code=500, content={
            "error": str(e),
            "history": session.messages if session else [],
            "transcribed_text": transcribed_text
        })

@router.post("/chat/text/")
def chat_text(user_id: int = Form(...), session_id: int = Form(...), message: str = Form(...)):
    try:
        result = session_service.chat(user_id, session_id, message)
        audio_response = text_to_speech(result["response"])
        audio_b64 = base64.b64encode(audio_response).decode("utf-8")
        return {**result, "audio_b64": audio_b64}
    except Exception as e:
        print("Chat/text error:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/user/{user_id}/sessions/")
def get_sessions(user_id: int):
    user = repo.get_user(user_id)
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found"})
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "messages": s.messages,
            "timestamp": getattr(s, 'timestamp', None)
        } for s in user.sessions
    ]

@router.get("/chat/speech/")
def chat_speech(text: str = Query(..., min_length=1)):
    try:
        audio_bytes = text_to_speech(text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        print("Speech error:", e)
        return Response(content=b"", media_type="audio/mpeg") 