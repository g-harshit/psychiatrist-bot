from .base import LLMBase
from .openai_llm import OpenAILLM
from .gemini_llm import GeminiLLM
from typing import List, Dict

class LLMStrategy:
    def __init__(self, llm: LLMBase = None, provider: str = "openai"):
        if llm:
            self.llm = llm
        elif provider == "gemini":
            self.llm = GeminiLLM()
        else:
            self.llm = OpenAILLM()

    def get_response(self, messages: List[Dict]) -> str:
        return self.llm.get_response(messages) 