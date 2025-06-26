def speech_to_text(audio_bytes: bytes) -> str:
    # TODO: Integrate with Whisper, Google, etc.
    return "This is a dummy transcript."

from gtts import gTTS
import io

def text_to_speech(text: str) -> bytes:
    tts = gTTS(text=text, lang='en', slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return buf.read() 