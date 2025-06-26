from .base import LLMBase
import google.generativeai as genai
import os
from typing import List, Dict

class GeminiLLM(LLMBase):
    def __init__(self, api_key="AIzaSyD7f3TxWTGJwg_VP8AYkPCd0Q_uhjR7FNg", model="gemini-pro"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.api_key)
        self.model = model

    def get_response(self, messages: List[Dict]) -> str:
        prompt = ""
        for m in messages:
            role = "User" if m["role"] == "user" else "Therapist"
            prompt += f"{role}: {m['content']}\n"
        model = genai.GenerativeModel(self.model)
        response = model.generate_content(prompt)
        return response.text

    def transcribe_audio(self, audio_bytes: bytes) -> str:
        raise NotImplementedError("Gemini does not support audio transcription.") 