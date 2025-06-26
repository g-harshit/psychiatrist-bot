from typing import List, Dict
from abc import ABC, abstractmethod

class LLMBase(ABC):
    @abstractmethod
    def get_response(self, messages: List[Dict]) -> str:
        pass

    def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Optional: Transcribe audio to text. Override in subclasses if supported."""
        raise NotImplementedError("This LLM does not support audio transcription.") 