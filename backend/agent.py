"""
==============================================================================
AI Student Support Assistant - Agentic Workflow Orchestrator (agent.py)
==============================================================================
Implements the multi-step Agentic Decision Workflow:

Student Question
  │
  ▼
AI Agent Planning & Reasoning
  │
  ├─► Memory Recall (Context & Follow-ups)
  ├─► Tool Selection & Execution (FAQ search / Academic lookup)
  └─► RAG Retrieval (Vector similarity across institutional documents)
  │
  ▼
Gemini Synthesis (gemini-3.8-flash)
  │
  ▼
Structured Student Response (Answer + Citations + Tool Logs + Reasoning Trace)
==============================================================================
"""

import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Google GenAI SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

from .rag import knowledge_base, RAGRetrievalResult
from .tools import execute_tool, AVAILABLE_TOOLS
from .memory import memory_manager


class SourceCitation(BaseModel):
    """Source reference shown to the student."""
    doc_name: str
    page_number: Optional[int] = None
    chunk_id: str
    score: float
    excerpt: str


class ToolExecutionRecord(BaseModel):
    """Log of a Python tool executed during agent decision flow."""
    tool_name: str
    arguments: Dict[str, Any]
    output: Dict[str, Any]


class AgentResponse(BaseModel):
    """Final structured response returned to the frontend."""
    answer: str
    sources: List[SourceCitation] = Field(default_factory=list)
    tools_used: List[ToolExecutionRecord] = Field(default_factory=list)
    decision_reasoning: str
    session_id: str


class StudentSupportAgent:
    """
    Autonomous AI Agent coordinating Memory, Tools, RAG, and Gemini LLM synthesis.
    """
    def __init__(self, model_name: str = "gemini-3.6-flash"):
        self.model_name = os.getenv("LLM_MODEL", model_name)
        self._client: Optional[Any] = None

    def _get_client(self) -> Optional[Any]:
        """Lazy initialization of Gemini client using GEMINI_API_KEY."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None
        if self._client is None and genai is not None:
            try:
                self._client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"[Agent] Warning: Failed to initialize Gemini client: {e}")
                return None
        return self._client

    # --------------------------------------------------------------------------
    # Autonomous Tool & RAG Routing Decision
    # --------------------------------------------------------------------------
    def _evaluate_agent_plan(self, question: str, history_context: str) -> Dict[str, Any]:
        """
        Determines which cognitive capabilities (RAG, Tool 1, Tool 2) are required
        to address the student's inquiry accurately.
        """
        q_lower = question.lower()
        plan = {
            "use_rag": True,  # Default to RAG for campus regulations/syllabus
            "tool_to_call": None,
            "tool_args": {},
            "reasoning_steps": []
        }

        # Step 1: Detect greetings or pleasantries
        if q_lower.strip() in ["hi", "hello", "hey", "good morning", "good afternoon", "who are you"]:
            plan["use_rag"] = False
            plan["reasoning_steps"].append("Conversational greeting detected; responding directly without RAG/tools.")
            return plan

        # Step 2: Academic Information Lookup Tool evaluation
        academic_keywords = [
            "grading", "grade point", "gpa", "sgpa", "cgpa", "dean's list", "deans list",
            "probation", "prerequisite", "prereq", "credit requirement", "credits to graduate"
        ]
        if any(kw in q_lower for kw in academic_keywords):
            plan["tool_to_call"] = "academic_info_lookup"
            if "dean" in q_lower:
                topic = "deans_list"
            elif any(g in q_lower for g in ["sgpa", "cgpa", "calculate"]):
                topic = "gpa_calculation"
            elif any(g in q_lower for g in ["probation", "warning"]):
                topic = "academic_probation"
            elif any(g in q_lower for g in ["prereq", "prerequisite", "cs101", "cs201"]):
                topic = "course_prerequisites"
            elif any(g in q_lower for g in ["credit", "graduation"]):
                topic = "graduation_credits"
            else:
                topic = "grading_scale"
            plan["tool_args"] = {"topic": topic}
            plan["reasoning_steps"].append(f"Student inquired about official academic metrics; selected academic_info_lookup(topic='{topic}').")

        # Step 3: College FAQ Search Tool evaluation
        faq_keywords = [
            "library", "borrow", "clinic", "doctor", "health", "ambulance", "wifi", "wi-fi",
            "password", "lost id", "smart card", "bursar", "installment", "hostel", "curfew"
        ]
        if any(kw in q_lower for kw in faq_keywords):
            plan["tool_to_call"] = "college_faq_search"
            category = "all"
            if any(w in q_lower for w in ["library", "hostel", "curfew"]):
                category = "campus_facilities"
            elif any(w in q_lower for w in ["health", "doctor", "clinic", "ambulance", "sick"]):
                category = "health_and_wellness"
            elif any(w in q_lower for w in ["wifi", "wi-fi", "password", "network"]):
                category = "it_services"
            elif any(w in q_lower for w in ["id", "lost", "fee", "bursar", "installment"]):
                category = "administrative_services"
            plan["tool_args"] = {"query": question, "category": category}
            plan["reasoning_steps"].append(f"Student inquired about campus facilities/services; selected college_faq_search(query='{question}', category='{category}').")

        # Step 4: RAG Knowledge base retrieval
        plan["reasoning_steps"].append("Retrieved semantic context from local vector knowledge base (regulations, policies, syllabus).")
        return plan

    # --------------------------------------------------------------------------
    # Main Agent Execution Loop
    # --------------------------------------------------------------------------
    def chat(
        self,
        question: str,
        session_id: str = "default_student_session",
        use_rag: bool = True,
        use_tools: bool = True,
    ) -> AgentResponse:
        """
        Executes the full agentic workflow for a student query.
        """
        # 1. Retrieve dialog history from Memory
        history_context = memory_manager.get_context(session_id=session_id, max_turns=6)

        # 2. Agent Decision & Planning
        plan = self._evaluate_agent_plan(question, history_context)

        # 3. Execute Tool if recommended
        tools_executed: List[ToolExecutionRecord] = []
        tool_results_text = ""
        if use_tools and plan["tool_to_call"]:
            tool_name = plan["tool_to_call"]
            args = plan["tool_args"]
            tool_result = execute_tool(tool_name, args)
            tools_executed.append(ToolExecutionRecord(
                tool_name=tool_name,
                arguments=args,
                output=tool_result
            ))
            tool_results_text = f"\n[EXECUTED PYTHON TOOL: {tool_name}]\nArguments: {args}\nOutput: {tool_result}\n"

        # 4. Execute RAG Retrieval if enabled
        retrieved_sources: List[SourceCitation] = []
        rag_context_text = ""
        if use_rag and plan["use_rag"]:
            # Perform query rewriting with memory context for follow-up questions
            search_query = question
            if len(question.split()) < 5 and "No previous" not in history_context:
                search_query = f"{history_context.splitlines()[-2] if len(history_context.splitlines()) >= 2 else ''} {question}"

            rag_results: List[RAGRetrievalResult] = knowledge_base.search(search_query, top_k=3)
            
            if rag_results:
                context_blocks = []
                for res in rag_results:
                    retrieved_sources.append(SourceCitation(
                        doc_name=res.doc_name,
                        page_number=res.page_number,
                        chunk_id=res.chunk_id,
                        score=res.score,
                        excerpt=res.text[:180] + ("..." if len(res.text) > 180 else "")
                    ))
                    page_str = f" (Page {res.page_number})" if res.page_number else ""
                    context_blocks.append(f"--- Document: {res.doc_name}{page_str} [Relevance: {res.score}] ---\n{res.text}")
                rag_context_text = "\n\n".join(context_blocks)
            else:
                rag_context_text = "No matching document excerpts found in the vector knowledge base."

        # 5. Synthesize Answer via Gemini LLM
        client = self._get_client()
        decision_reasoning_summary = " → ".join(plan["reasoning_steps"])

        system_instruction = (
            "You are the official AI Student Support Assistant for Apex University. "
            "Your objective is to provide accurate, helpful, encouraging, and institutional answers to students.\n\n"
            "STRICT GROUNDING & CITATION RULES:\n"
            "1. Answer based ONLY on the provided RETRIEVED KNOWLEDGE BASE EXCERPTS and TOOL RESULTS.\n"
            "2. When stating facts, explicitly mention the source document (e.g. 'According to the Student Attendance Policy...').\n"
            "3. If the answer cannot be found in the knowledge base or tool results, state clearly and politely: "
            "'This specific information is not available in the college knowledge base. Please reach out to the relevant department office for official guidance.' "
            "DO NOT make up or hallucinate policies, dates, fees, or grades.\n"
            "4. For follow-up questions, use the provided conversation history to maintain context.\n"
            "5. Use clear Markdown formatting with bullet points and bold highlights for readability."
        )

        user_prompt = f"""
STUDENT QUESTION:
{question}

CONVERSATION HISTORY (MEMORY):
{history_context}

RETRIEVED KNOWLEDGE BASE (RAG CHUNKS):
{rag_context_text if rag_context_text else "None"}

PYTHON TOOLS OUTPUT:
{tool_results_text if tool_results_text else "None"}

Please provide a well-structured, student-friendly answer based strictly on the above verified data.
"""

        answer_text = ""
        if client is not None:
            # Candidate models to handle transient 503/429 spikes smoothly
            candidate_models = [
                self.model_name,
                "gemini-3.6-flash",
                "gemini-3.1-flash-lite",
                "gemini-flash-latest",
            ]
            # Deduplicate while preserving order
            seen = set()
            ordered_candidates = [m for m in candidate_models if not (m in seen or seen.add(m))]
            last_err = None
            for model_to_try in ordered_candidates:
                try:
                    response = client.models.generate_content(
                        model=model_to_try,
                        contents=user_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.2,  # Low temperature for factual precision
                        ),
                    )
                    if response and response.text:
                        answer_text = response.text
                        last_err = None
                        break
                except Exception as e:
                    last_err = e
                    print(f"[Agent] Model {model_to_try} attempt note: {e}")
                    continue

            if not answer_text and last_err:
                print(f"[Agent] All model attempts encountered errors: {last_err}")
                answer_text = (
                    f"**Institutional Knowledge Base Match**:\n\n"
                    f"{rag_context_text or tool_results_text or 'No specific policy found.'}\n\n"
                    f"*(Note: Temporary AI service status: {str(last_err)})*"
                )
        else:
            # Offline / Missing API key fallback
            if retrieved_sources or tools_executed:
                answer_text = (
                    "**Notice (Offline Demonstration Mode)**: GEMINI_API_KEY is not configured or client is offline. "
                    "Displaying verified facts retrieved directly from the RAG knowledge base and tools:\n\n"
                )
                if tool_results_text:
                    answer_text += f"**Tool Results**:\n{tool_results_text}\n\n"
                if retrieved_sources:
                    answer_text += f"**Document Matches ({retrieved_sources[0].doc_name})**:\n{retrieved_sources[0].excerpt}\n"
            else:
                answer_text = (
                    "Hello! I am your AI Student Support Assistant. Please ensure your `GEMINI_API_KEY` is configured in `.env` "
                    "to unlock full generative agent responses."
                )

        # 6. Update Memory with this turn
        memory_manager.add_turn(
            session_id=session_id,
            user_message=question,
            assistant_message=answer_text,
            sources=[s.model_dump() for s in retrieved_sources],
            tools_used=[t.tool_name for t in tools_executed],
            reasoning=decision_reasoning_summary,
        )

        return AgentResponse(
            answer=answer_text,
            sources=retrieved_sources,
            tools_used=tools_executed,
            decision_reasoning=decision_reasoning_summary,
            session_id=session_id,
        )


# Global agent instance
support_agent = StudentSupportAgent()
