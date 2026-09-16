"""
==============================================================================
AI Student Support Assistant - Conversation Memory Module (memory.py)
==============================================================================
Role in Agentic Architecture:
Maintains contextual awareness and multi-turn dialog history across student
interactions. Enables natural follow-up questions (e.g., "What about medical leave?"
after discussing the 75% attendance rule) and offers session clearing.
==============================================================================
"""

import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    """
    Represents a single message exchange in conversational memory.
    """
    role: str  # 'user' | 'model' / 'assistant' | 'system'
    content: str
    timestamp: float = Field(default_factory=time.time)
    sources: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[str]] = None
    reasoning: Optional[str] = None


class ConversationSession:
    """
    Manages dialog state and chronological history for an individual student session.
    """
    def __init__(self, session_id: str):
        self.session_id: str = session_id
        self.created_at: float = time.time()
        self.last_accessed: float = time.time()
        self.messages: List[MessageItem] = []

    def add_message(
        self,
        role: str,
        content: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        tools_used: Optional[List[str]] = None,
        reasoning: Optional[str] = None,
    ) -> MessageItem:
        """Appends a new turn to the memory trace."""
        self.last_accessed = time.time()
        item = MessageItem(
            role=role,
            content=content,
            sources=sources,
            tools_used=tools_used,
            reasoning=reasoning,
        )
        self.messages.append(item)
        return item

    def get_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns the serialized history limited to the latest N turns."""
        self.last_accessed = time.time()
        history = self.messages[-limit:] if limit > 0 else self.messages
        return [msg.model_dump() for msg in history]

    def get_formatted_context(self, max_turns: int = 6) -> str:
        """
        Formats recent turns into a structured string suitable for feeding into
        Gemini prompts to maintain conversational continuity and resolve anaphoras
        (e.g., 'What about that?' or 'How do I apply for it?').
        """
        self.last_accessed = time.time()
        recent = self.messages[-max_turns:]
        if not recent:
            return "No previous conversation context (new session)."

        formatted_turns = []
        for msg in recent:
            speaker = "Student" if msg.role == "user" else "AI Assistant"
            formatted_turns.append(f"{speaker}: {msg.content.strip()}")

        return "\n".join(formatted_turns)

    def clear(self) -> None:
        """Resets all recorded conversation memory for this session."""
        self.messages.clear()
        self.last_accessed = time.time()


class ConversationMemoryManager:
    """
    Singleton-style memory registry managing all active student sessions.
    """
    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}

    def get_session(self, session_id: str = "default_student_session") -> ConversationSession:
        """Retrieves an existing session or initializes a new one."""
        if session_id not in self._sessions:
            self._sessions[session_id] = ConversationSession(session_id=session_id)
        return self._sessions[session_id]

    def add_turn(
        self,
        session_id: str,
        user_message: str,
        assistant_message: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        tools_used: Optional[List[str]] = None,
        reasoning: Optional[str] = None,
    ):
        """Records a completed user-assistant interaction cycle."""
        session = self.get_session(session_id)
        session.add_message(role="user", content=user_message)
        session.add_message(
            role="assistant",
            content=assistant_message,
            sources=sources,
            tools_used=tools_used,
            reasoning=reasoning,
        )

    def get_context(self, session_id: str, max_turns: int = 6) -> str:
        """Convenience method to retrieve formatted context for prompting."""
        return self.get_session(session_id).get_formatted_context(max_turns=max_turns)

    def get_history(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves raw history list for API responses."""
        return self.get_session(session_id).get_history(limit=limit)

    def clear_session(self, session_id: str) -> bool:
        """Clears memory for a specific session."""
        if session_id in self._sessions:
            self._sessions[session_id].clear()
            return True
        return False

    def list_sessions(self) -> List[Dict[str, Any]]:
        """Returns metadata for all tracked sessions."""
        return [
            {
                "session_id": sid,
                "message_count": len(sess.messages),
                "created_at": sess.created_at,
                "last_accessed": sess.last_accessed,
            }
            for sid, sess in self._sessions.items()
        ]


# Global memory manager instance
memory_manager = ConversationMemoryManager()
