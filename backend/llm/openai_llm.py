from .base import LLMBase
import openai
import os
import tempfile
from typing import List, Dict

class OpenAILLM(LLMBase):
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = openai.OpenAI(api_key=self.api_key)
        self.system_prompt = {
            "role": "system",
            "content": (
                "You are a compassionate, professional psychiatrist. "
                "Always respond with empathy, encouragement, and helpful advice. "
                "Keep your answers supportive, non-judgmental, and focused on mental well-being. "
                "If the user is in distress, encourage them to seek help from a real professional."
            )
        }

    def get_response(self, messages: List[Dict]) -> str:
        openai_messages = [self.system_prompt] + [
            {"role": "user" if m["role"] == "user" else "assistant", "content": m["content"]}
            for m in messages
        ]
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=openai_messages
        )
        return response.choices[0].message.content

    def transcribe_audio(self, audio_bytes: bytes) -> str:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio.flush()
            with open(temp_audio.name, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            return transcript.text
 