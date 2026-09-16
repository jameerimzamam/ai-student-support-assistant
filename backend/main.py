"""
==============================================================================
AI Student Support Assistant - FastAPI Backend Server (main.py)
==============================================================================
Main entry point for the Python REST API server.
Exposes modular endpoints for:
- Student Chat with Agentic Workflow (/api/chat)
- Document Upload & RAG Ingestion (/api/documents/upload)
- Document Catalog & Index Status (/api/documents)
- Tool Discovery & Direct Execution (/api/tools)
- Conversation Memory Management (/api/history, /api/clear)
- System Health & Diagnostics (/api/health)
==============================================================================
"""

import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load local environment variables from .env if present
load_dotenv()

from backend.agent import support_agent, AgentResponse
from backend.rag import knowledge_base
from backend.tools import AVAILABLE_TOOLS, execute_tool
from backend.memory import memory_manager

app = FastAPI(
    title="AI Student Support Assistant API",
    description="Agentic Student Support Assistant powered by Python, FastAPI, Gemini, RAG, and Tools.",
    version="1.0.0"
)

# Enable CORS for local development and proxying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Request / Response Schemas
# ------------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Student's inquiry or question")
    session_id: str = Field(default="default_student_session", description="Conversation session ID")
    use_rag: bool = Field(default=True, description="Toggle RAG document retrieval")
    use_tools: bool = Field(default=True, description="Toggle Python tool calling")


class ClearMemoryRequest(BaseModel):
    session_id: str = Field(default="default_student_session", description="Session ID to reset")


class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------
@app.get("/api/health")
def health_check():
    """Returns runtime health, API key presence, and RAG status."""
    has_gemini_key = bool(os.getenv("GEMINI_API_KEY"))
    docs = knowledge_base.list_documents()
    total_chunks = len(knowledge_base.chunks)

    return {
        "status": "healthy",
        "service": "AI Student Support Assistant",
        "backend": "Python 3.11 + FastAPI",
        "gemini_api_key_configured": has_gemini_key,
        "rag": {
            "total_documents": len(docs),
            "total_indexed_chunks": total_chunks,
        },
        "tools_registered": list(AVAILABLE_TOOLS.keys()),
        "active_memory_sessions": len(memory_manager.list_sessions()),
    }


@app.post("/api/chat", response_model=AgentResponse)
def chat_endpoint(request: ChatRequest):
    """
    Primary Agentic Chat endpoint.
    Orchestrates Memory, RAG vector search, Python tool execution,
    and Gemini response synthesis.
    """
    try:
        response = support_agent.chat(
            question=request.message,
            session_id=request.session_id,
            use_rag=request.use_rag,
            use_tools=request.use_tools,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


@app.get("/api/history/{session_id}")
def get_history_endpoint(session_id: str):
    """Retrieves conversation history for a specific session."""
    history = memory_manager.get_history(session_id=session_id)
    return {
        "session_id": session_id,
        "history": history,
        "turns_count": len(history),
    }


@app.post("/api/clear")
def clear_memory_endpoint(request: ClearMemoryRequest):
    """Resets memory for a specific conversation session."""
    memory_manager.clear_session(request.session_id)
    return {
        "status": "cleared",
        "session_id": request.session_id,
        "message": "Conversation memory has been reset successfully."
    }


@app.get("/api/documents")
def list_documents_endpoint():
    """Lists all institutional documents currently in the RAG vector store."""
    docs = knowledge_base.list_documents()
    total_chunks = len(knowledge_base.chunks)
    return {
        "documents": docs,
        "total_chunks": total_chunks,
    }


@app.post("/api/documents/upload")
async def upload_document_endpoint(file: UploadFile = File(...)):
    """
    Allows students/administrators to upload new college documents (PDF or TXT),
    extract text, generate chunks, compute vector embeddings, and update RAG index.
    """
    allowed_extensions = [".txt", ".pdf", ".md"]
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: {allowed_extensions}"
        )

    try:
        content_bytes = await file.read()
        chunks_added = knowledge_base.ingest_document(
            filename=file.filename,
            content_bytes=content_bytes,
            is_sample=False,
        )
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_added": chunks_added,
            "total_chunks": len(knowledge_base.chunks),
            "message": f"Successfully ingested {file.filename} into RAG vector knowledge base."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@app.post("/api/documents/reindex")
def reindex_documents_endpoint():
    """Forces a complete re-indexing of all sample and uploaded documents."""
    try:
        stats = knowledge_base.reindex_all()
        return {
            "status": "success",
            "message": "Reindexing completed.",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindexing failed: {str(e)}")


@app.get("/api/tools")
def list_tools_endpoint():
    """Returns available Python tools and their schema definitions."""
    tools_info = []
    for name, tool in AVAILABLE_TOOLS.items():
        tools_info.append({
            "name": name,
            "description": tool["description"],
            "parameters": tool["parameters"]
        })
    return {"tools": tools_info}


@app.post("/api/tools/execute")
def execute_tool_endpoint(request: ToolExecuteRequest):
    """Directly executes a Python tool for inspection and debugging."""
    result = execute_tool(request.tool_name, request.arguments)
    return {
        "tool_name": request.tool_name,
        "arguments": request.arguments,
        "result": result
    }


@app.get("/api/sample-questions")
def get_sample_questions_endpoint():
    """Provides curated sample questions demonstrating RAG, Tools, and Memory."""
    return {
        "categories": [
            {
                "category": "Attendance & Regulations (RAG)",
                "questions": [
                    "What is the minimum attendance percentage required to write exams?",
                    "Can attendance below 75% be condoned on medical grounds?",
                    "What happens if my attendance drops below 65% in a subject?",
                    "How many On-Duty (OD) days can I claim per semester?"
                ]
            },
            {
                "category": "Academic Info & Grading (Tool: Academic Lookup)",
                "questions": [
                    "What is the 10-point grading scale and passing marks?",
                    "How are SGPA and CGPA calculated?",
                    "What are the requirements to make the Dean's Honors List?",
                    "What are the consequences of Academic Probation?",
                    "What are the prerequisites for CS101 and CS201?"
                ]
            },
            {
                "category": "Campus Services & FAQs (Tool: College FAQ Search)",
                "questions": [
                    "What are the central library hours and borrowing limits?",
                    "Where is the student health clinic and what services are free?",
                    "How do I connect my laptop to campus Wi-Fi?",
                    "What should I do if I lose my student ID card?",
                    "Can I pay semester tuition fees in installments?"
                ]
            },
            {
                "category": "Examinations & Syllabus (RAG)",
                "questions": [
                    "What is the exam weightage between Continuous Assessment and FAT?",
                    "How do I apply for a makeup exam if I fell ill during CAT?",
                    "How do I apply for answer script re-evaluation?",
                    "What are the textbook recommendations for CS101 Data Structures?"
                ]
            },
            {
                "category": "Conversational Memory Test (Multi-turn)",
                "questions": [
                    "Ask: 'What is the attendance rule?' followed by 'What about the condonation fee?'",
                    "Ask: 'Tell me about the CS101 course' followed by 'Who is the instructor?'"
                ]
            }
        ]
    }


# Standalone runner for local execution
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting AI Student Support Assistant FastAPI backend on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
