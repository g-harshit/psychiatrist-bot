from db.repository import repo
from llm.strategy import LLMStrategy
from typing import Dict
from fastapi import HTTPException

class SessionService:
    def __init__(self, llm_strategy: LLMStrategy = None):
        self.llm_strategy = llm_strategy or LLMStrategy()

    def chat(self, user_id: int, session_id: int, user_message: str) -> Dict:
        session = repo.get_session(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")
        repo.add_message_to_session(session_id, {"role": "user", "content": user_message})
        response = self.llm_strategy.get_response(session.messages)
        repo.add_message_to_session(session_id, {"role": "therapist", "content": response})
        return {"response": response, "history": session.messages} 