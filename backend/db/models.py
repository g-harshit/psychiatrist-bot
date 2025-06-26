from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class Session:
    id: int
    user_id: int
    messages: List[dict] = field(default_factory=list)

@dataclass
class User:
    id: int
    name: str
    age: int
    sex: str
    sessions: List[Session] = field(default_factory=list)

@dataclass
class ConversationHistory:
    id: int
    user_id: int
    session_id: int
    messages: List[Dict] = field(default_factory=list) 