# 🎓 AI Student Support Assistant (Agentic AI with Python & FastAPI)

An autonomous, production-ready AI Student Support Assistant web application designed for higher education institutions. Built with a pure **Python (FastAPI)** backend, **Google Gemini** generative model, **Retrieval-Augmented Generation (RAG)**, **deterministic Python tools**, **multi-turn session memory**, and a modern, responsive **React + Tailwind CSS** chat interface.

---

## 📌 1. Project Overview

Students in colleges navigate vast and frequently changing administrative policies, academic regulations, examination schedules, grading systems, and syllabus prerequisites. Traditional static FAQ pages and keyword search bars often lead to frustration or inaccurate advice.

This project delivers an **autonomous Agentic AI Support Assistant** that:
1. **Answers academic & administrative questions** with factual grounding.
2. **Performs vector similarity search (RAG)** over institutional policy documents (PDF & TXT).
3. **Executes deterministic Python tools** for calculations, grading matrices, and facility lookups.
4. **Maintains multi-turn conversational memory** to resolve follow-ups naturally.
5. **Cites verified sources** with chunk IDs, match percentages, and excerpts.
6. **Enforces a strict anti-hallucination policy**—declaring when information is unavailable rather than fabricating answers.

---

## 🏗️ 2. System Architecture & Workflow

```
                        ┌──────────────────────────────┐
                        │   Student Web UI (React)     │
                        │  (Chat, Citations, Modals)   │
                        └──────────────┬───────────────┘
                                       │ HTTP REST (/api/chat)
                                       ▼
                        ┌──────────────────────────────┐
                        │    FastAPI Python Backend    │
                        │  (backend/main.py, Port 8001)│
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │     StudentSupportAgent      │
                        │      (backend/agent.py)      │
                        └───────┬──────────────┬───────┘
                                │              │
           ┌────────────────────┴──┐        ┌──┴────────────────────┐
           ▼                       ▼        ▼                       ▼
┌─────────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Conversational      │ │ Autonomous     │ │ RAG Vector     │ │ Python Tools   │
│ Memory              │ │ Planner        │ │ Knowledge Base │ │ Execution      │
│ (backend/memory.py) │ │ (Intent/Plan)  │ │ (backend/rag)  │ │(backend/tools) │
└─────────────────────┘ └────────────────┘ └────────┬───────┘ └────────┬───────┘
                                                    │                  │
                                                    ▼                  ▼
                                        ┌──────────────────────────────┐
                                        │  Grounded Synthesis Prompt   │
                                        │    (Gemini 3.6 / 3.1 Flash)  │
                                        └──────────────┬───────────────┘
                                                       │
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │ Response + Sources + Tools   │
                                        │ Returned to Student Chat UI  │
                                        └──────────────────────────────┘
```

### Agentic Workflow Steps:
1. **Inquiry Ingestion:** The student asks a question via the React interface.
2. **Context Retrieval from Memory:** Active session history from `memory.py` is retrieved.
3. **Autonomous Tool Decision:** The agent decides whether to invoke Python tools (`tools.py`) based on intent and keywords.
4. **Semantic RAG Vector Retrieval:** The query is embedded and compared against chunked college documents via cosine similarity in `rag.py`.
5. **LLM Synthesis via Gemini:** Gemini synthesizes an accurate, friendly response grounded strictly in the retrieved excerpts and tool returns.
6. **Delivery & Citation:** The answer is delivered with verified document sources, match percentages, and an inspectable agent decision trace.

---

## 🛠️ 3. Tech Stack

### Backend:
- **Language:** Python 3.11+
- **Framework:** FastAPI + Uvicorn (REST API)
- **AI/LLM:** Google Gemini (`gemini-3.6-flash`, `gemini-3.1-flash-lite`) via the official `google-genai` SDK
- **Embeddings & Vector Search:** `text-embedding-004` (768-dimensional dense vectors) + Cosine Similarity + TF-IDF lexical re-ranking fallback
- **Document Extractors:** `pypdf` (PDF page parsing) and UTF-8 plain text readers

### Frontend:
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (modern clean light design, WCAG AA compliant)
- **Icons:** `lucide-react`
- **Animations:** `motion` (Motion for React)
- **Markdown:** `react-markdown`

---

## ⚙️ 4. Environment Variables

Store your credentials in `.env` (or set environment variables in your deployment environment). Never commit secret keys to version control.

```bash
# Gemini API Key (Required for LLM synthesis and embeddings)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Preferred model selection (defaults to gemini-3.6-flash)
LLM_MODEL=gemini-3.6-flash
EMBEDDING_MODEL=text-embedding-004
```

A template file is provided at `.env.example` and `backend/.env.example`.

---

## 🚀 5. Step-by-Step Setup & Local Execution

### Prerequisites:
- Python 3.10 or higher
- Node.js 18+ and npm
- A valid Gemini API key from Google AI Studio

### Step 1: Clone and Enter the Repository
```bash
git clone <repository-url>
cd ai-student-support-assistant
```

### Step 2: Set Up Python Backend
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment Variables
```bash
cp .env.example .env
# Edit .env and enter your GEMINI_API_KEY
```

### Step 4: Index the Initial Knowledge Base (Optional - auto-indexed on startup)
```bash
python3 -c "from backend.rag import knowledge_base; knowledge_base.ingest_directory('data/sample_documents')"
```

### Step 5: Start the Application

#### Option A: Unified Dev Server (Recommended)
```bash
npm install
npm run dev
```
This automatically boots:
- FastAPI Python backend on `http://127.0.0.1:8001`
- Vite React frontend on `http://localhost:3000` (with `/api` proxying)

#### Option B: Manual Multi-Terminal Execution
**Terminal 1 (Backend):**
```bash
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🔍 6. Technical Implementation Details

### A. RAG (Retrieval-Augmented Generation) — `backend/rag.py`
- **Text Extraction:** Ingests `.txt`, `.pdf`, and `.md` files using `pypdf` with page tracking.
- **Recursive Semantic Chunking:** Chunks documents into ~450 words with a 60-word overlap, respecting paragraph boundaries to maintain semantic coherence.
- **Dense Vector Store:** Calculates normalized embeddings using Gemini `text-embedding-004`. Embeddings are indexed in a local persistent JSON vector store (`data/vector_store.json`).
- **Hybrid Retrieval:** Computes cosine similarity between query embeddings and chunk vectors, augmented with token-overlap scoring to prioritize exact policy keyword matches.
- **Citation Grounding:** Returns the top $K$ relevant chunks with document name, page number, relevance score, and source excerpt.

### B. Agent Tools — `backend/tools.py`
Implemented deterministic institutional functions:
1. `academic_info_lookup(topic, detail_type)`:
   - Evaluates official grading scales (10-point framework: O, A+, A, B+, B, C, P, F, FA).
   - Computes SGPA and CGPA formula requirements.
   - Looks up Dean's Honor List criteria (SGPA $\ge 9.2$, no backlogs).
   - Retrieves academic probation thresholds and course prerequisites.
2. `college_faq_search(query, category)`:
   - Rapidly queries operational details for library hours, health clinic, IT Wi-Fi setups, ID card reissuance, and administrative offices.

### C. Conversational Memory — `backend/memory.py`
- Organizes multi-turn conversations by `session_id`.
- Stores user turns, assistant turns, retrieved source records, and tools called.
- Formats dynamic sliding-window context for Gemini prompts so students can ask contextual follow-up questions (e.g., "What is the fee for that?" after inquiring about medical leave).
- Supports clearing or deleting sessions via `DELETE /api/memory/{session_id}`.

### D. Agentic Orchestration — `backend/agent.py`
- Parses user intent and assesses whether tools or RAG vector searches are required.
- Robust multi-model fallback: cycles smoothly across candidate models (`gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`) to withstand transient 503/429 demand spikes.
- Restricts responses to official documentation with a strict anti-hallucination constraint.

---

## 🧪 7. Sample Questions to Test the System

Try entering these questions directly in the chat, or click them in the sidebar quick-access list:

### 1. Attendance & Condonation Policy (RAG Test)
- *"What is the minimum attendance requirement to write final exams?"*
  - **Expected Answer:** 75% minimum attendance threshold.
- *"Can attendance between 65% and 75% be condoned due to medical illness?"* (Follow-up Memory Test)
  - **Expected Answer:** Yes, with a medical certificate submitted within 5 working days and a $50 per course condonation fee.
- *"What is the penalty if attendance is below 65%?"*
  - **Expected Answer:** Detained (Grade 'FA'), barred from exams, must re-register for the course.

### 2. Examination & Grading System (Tool + RAG Test)
- *"What is the 10 point grading scale and passing marks?"*
  - **Expected Answer:** Calls `academic_info_lookup(topic='grading_scale')`, displaying O (10 pts), A+ (9 pts) down to P (4 pts) and F (0 pts), with 40% exam threshold.
- *"How is SGPA and CGPA calculated?"*
  - **Expected Answer:** $\Sigma(C_i \times G_i) / \Sigma C_i$.
- *"What are the criteria to make the Dean's Honor List?"*
  - **Expected Answer:** SGPA $\ge 9.20$, min 20 credits, zero backlogs or disciplinary records.

### 3. Campus Facilities & Administrative Support (Tool Test)
- *"What are the campus library hours on weekends?"*
  - **Expected Answer:** Calls `college_faq_search`, shows Saturday 9:00 AM – 8:00 PM, Sunday 10:00 AM – 6:00 PM.
- *"What should I do if I lose my student ID card?"*
  - **Expected Answer:** Report to Student Affairs (Room 104), pay $15 replacement fee, collect within 24 hours.

### 4. Course Syllabus & Prerequisites (RAG Test)
- *"What are the prerequisites for Machine Learning CS402?"*
  - **Expected Answer:** CS201 Data Structures and MA201 Linear Algebra & Probability.

### 5. Out-of-Scope / Anti-Hallucination Test
- *"What is the recipe for chocolate chip cookies?"*
  - **Expected Answer:** The assistant politely explains that the inquiry falls outside campus policies and declines to fabricate unrelated advice.

---

## 🔮 8. Future Improvements

1. **Voice Input & Text-to-Speech:** Real-time conversational audio using Gemini Live API or Web Speech API.
2. **Multi-Lingual Campus Support:** Localized advice in multiple campus languages (Spanish, French, Hindi, Mandarin).
3. **Student Information System (SIS) Integration:** Authenticated student login with read-only access to personal attendance percentages and unofficial transcripts via OAuth.
4. **Vector DB Scaling:** Migrate from local JSON vector index to ChromaDB, Milvus, or Cloud SQL pgvector for campuses with millions of historical records.
5. **Interactive Booking / Ticket Escalation:** Integrated ticketing system allowing students to directly book appointments with academic advisors when policies require in-person approval.

---

## 📄 License & Academic Integrity

This project is built for educational, research, and campus institutional support. Distributed under the Apache 2.0 License.
