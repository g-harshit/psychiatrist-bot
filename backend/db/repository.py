from .models import User, Session, ConversationHistory
from typing import Dict, List, Optional

class InMemoryRepository:
    def __init__(self):
        self.users: Dict[int, User] = {}
        self.sessions: Dict[int, Session] = {}
        self.histories: Dict[int, ConversationHistory] = {}
        self.user_counter = 1
        self.session_counter = 1
        self.history_counter = 1

    def create_user(self, name: str, age: int, sex: str) -> User:
        user = User(id=self.user_counter, name=name, age=age, sex=sex)
        self.users[self.user_counter] = user
        self.user_counter += 1
        return user

    def get_user(self, user_id: int) -> Optional[User]:
        return self.users.get(user_id)

    def get_user_by_name(self, name: str) -> Optional[User]:
        for user in self.users.values():
            if user.name == name:
                return user
        return None

    def create_session(self, user_id: int) -> Session:
        session = Session(id=self.session_counter, user_id=user_id, messages=[])
        self.sessions[self.session_counter] = session
        self.session_counter += 1
        self.users[user_id].sessions.append(session)
        # Create conversation history for this session
        history = ConversationHistory(
            id=self.history_counter,
            user_id=user_id,
            session_id=session.id,
        )
        self.histories[self.history_counter] = history
        self.history_counter += 1
        return session

    def get_session(self, session_id: int) -> Optional[Session]:
        session = self.sessions.get(session_id)
        if session is None:
            # Fallback: return a session with empty messages list (optional)
            return Session(id=session_id, user_id=-1, messages=[])
        return session

    def add_message_to_session(self, session_id: int, message: dict):
        session = self.sessions.get(session_id)
        if session:
            session.messages.append(message)
            # Also add to conversation history
            for history in self.histories.values():
                if history.session_id == session_id:
                    history.messages.append(message)

    def get_conversation_history(self, session_id: int) -> Optional[ConversationHistory]:
        for history in self.histories.values():
            if history.session_id == session_id:
                return history
        return None

repo = InMemoryRepository() 