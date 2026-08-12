# Operational Memory & Workflow Copilot (Algo-AI)

An AI-powered operational memory layer that turns scattered company data (documents, Slack messages, tasks) into searchable structured knowledge, understands organizational workflows, and enables employees to interact with company memory using an evidence-backed AI copilot.

---

## Core Product Loop

```text
Company Data → Operational Memory → Copilot Q&A → Workflow Intelligence → Action
```

---

## MVP Implementation Roadmap & Status

### Phase 1 — Company Knowledge Model (Completed)
- **Core Entities:** `Person`, `Project`, `Decision`, `Task`, `Process`, `Event`, `Document`, `Workflow`.
- **Relationship Graph:** Multi-directional typed edge mapping (e.g., `Person` ── *owns* ──→ `Project`, `Decision` ── *affects* ──→ `Project`).
- **Database Schema:** PostgreSQL models with async SQLAlchemy repositories and alembic migration setup.

### Phase 2 — Data Ingestion (Completed)
- **Multi-Source Ingestion:** PDF, DOCX, TXT document parser, Slack message simulator, and text paste ingestion.
- **AI Extraction Pipeline:** Google Gemini LLM pipeline extracting structured entities, relationships, confidence scores, and raw evidence snippets.

### Phase 3 — Operational Knowledge Graph & Memory (Completed)
- **Explainable Operational Memory:** Dedicated `/memory` explorer page with search, entity type filters, and clean confidence thresholds (`All`, `High`, `Very High`, `Verified`).
- **Interactive Knowledge Graph:** `/knowledge` page powered by React Flow with visual confidence indicators, edge threshold filtering, connected 1-hop neighbor search, and an interactive side drawer (`Sheet`) for inspecting evidence provenance.
- **Chronological Learning Timeline:** Audit stream of facts and relationships learned over time.

### Phase 4 — Company Knowledge Copilot (Completed)
- **Natural Language Q&A:** `/copilot` page allowing employees to ask "Who handles client onboarding?", "Why did we choose React?", and status questions.
- **Evidence-Grounded Answers:** Answers are generated using operational context rather than generic LLM knowledge.
- **Official Chat Primitives:** Composed with official shadcn chat components (`MessageScroller`, `Message`, `Bubble`, `Attachment`, `Marker`).
- **Evidence Provenance Cards:** Every response includes confidence badges, source document quotes, and clickable entity links.

### Phase 5 — Workflow Intelligence (Planned)
- **Workflow Discovery:** Identify recurring workflows (e.g., client onboarding sequence) from historical execution patterns.
- **Workflow Confidence:** Rate learned workflow templates with confidence scores based on past execution cases.

### Phase 6 — Workflow Execution (Planned)
- **Action Generation & Approval:** Turn user requests (e.g. "Onboard Acme Corp") into actionable step-by-step execution plans requiring human approval before running against mock CRM, task manager, and email systems.

---

## System Architecture

```text
                  COMPANY DATA
              ↙       ↓       ↘
           Docs      Slack    Tasks
              \        |       /
               ↓       ↓      ↓
              ┌─────────────────┐
              │  AI EXTRACTION  │ (Gemini 2.5 Flash)
              └────────┬────────┘
                       ↓
              ┌──────────────────┐
              │ OPERATIONAL      │ (PostgreSQL + Knowledge Graph)
              │ KNOWLEDGE GRAPH  │
              └────────┬─────────┘
                       ↓
              ┌──────────────────┐
              │ COMPANY COPILOT  │ (Natural Language Q&A + Evidence)
              └────────┬─────────┘
                       ↓
              ┌────────┴─────────┐
              ↓                  ↓
         ASK QUESTIONS      FIND WORKFLOW
              ↓                  ↓
           Evidence          Action Plan
                                 ↓
                            Human Approval
                                 ↓
                             EXECUTION
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, Turbopack) & React 19
- **Styling:** Tailwind CSS v4, Vanilla CSS Design System, Lucide Icons
- **UI Components:** shadcn/ui, Base UI primitives, Radix UI
- **Graph Visualization:** `@xyflow/react` (React Flow v12)

### Backend
- **Framework:** FastAPI (Python 3.10+) & Uvicorn
- **ORM & DB:** SQLAlchemy (AsyncIO) & PostgreSQL (Neon / Local)
- **AI / LLM Integration:** Google GenAI SDK (`google-genai` - Gemini 2.5 Flash), `json_repair`

---

## How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database URL (or Neon connection string)
- Google Gemini API Key (`GEMINI_API_KEY`)

### Quick Start (Windows)
Run the root start batch script:
```cmd
start.bat
```

### Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` inside `backend/`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/op_memory
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:3000
```

Run migrations & start server:
```bash
python -m alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### 3. Access the Platform
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Company Copilot:** [http://localhost:3000/copilot](http://localhost:3000/copilot)
- **Operational Memory:** [http://localhost:3000/memory](http://localhost:3000/memory)
- **Knowledge Graph:** [http://localhost:3000/knowledge](http://localhost:3000/knowledge)
- **Backend Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
