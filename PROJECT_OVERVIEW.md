# Algo-AI — Operational Memory & Workflow Copilot

> **An AI-powered operational memory system that unifies scattered enterprise data into a structured, evidence-grounded knowledge graph, provides a natural language copilot, and automates organizational workflows.**

---

## 1. Problem Statements Solved

In modern organizations, critical business context is fragmented across siloed communication channels, documents, task boards, and chat logs. This results in several core operational bottlenecks:

| Problem | Root Cause | Algo-AI Solution |
| :--- | :--- | :--- |
| **Fragmented Institutional Memory** | Decisions, project assignments, and processes are buried in Slack threads, PDFs, and meeting notes. | **Unified Multi-Source Ingestion** automatically parses files, Slack transcripts, and raw notes into a centralized operational database. |
| **Unanchored AI Hallucinations** | Standard LLM RAG pipelines pull unstructured snippets without understanding who owns what or why decisions were made. | **Operational Knowledge Graph** structures facts into typed entities (`Person`, `Project`, `Decision`, etc.) with 6 multi-directional relationships and confidence scores. |
| **Lack of Evidence Provenance** | Employees cannot trust AI answers if they don't know the origin of the information. | **Evidence-Grounded Copilot** attaches exact source quotes, document links, and confidence ratings to every generated answer. |
| **Onboarding & Knowledge Loss** | Departing employees take tacit knowledge with them; new hires spend weeks asking "Who handles X?" or "Why did we pick Y?". | **Searchable Memory & Knowledge Graph Visualizer** allows instant discovery of past decisions, project ownerships, and process steps. |
| **Manual Workflow Execution** | Repeated processes (e.g., client onboarding) require manual coordination across CRM, email, and task managers. | **Workflow Intelligence** extracts recurring workflow patterns and generates actionable execution plans requiring human-in-the-loop approval. |

---

## 2. Core Features & Capabilities

### 📥 1. Multi-Source Ingestion Engine
- **File Upload Support**: Ingests PDF, DOCX, and TXT documents.
- **Slack & Chat Parser**: Parses multi-participant Slack conversations and message logs.
- **Raw Text Paste**: Quick ingestion for unstructured notes, emails, or meeting summaries.
- **Automated Text Extraction**: Pre-processes raw inputs into clean text chunks ready for AI processing.

### 🧠 2. AI Knowledge Extraction & Schema Enforcement
- **Powered by Gemini 2.5 Flash**: Utilizes Google GenAI SDK (`google-genai`) for high-speed, structured JSON extraction.
- **8 Core Entity Types**: `Person`, `Project`, `Decision`, `Task`, `Process`, `Event`, `Document`, `Workflow`.
- **Typed Relationship Mapping**: Connects entities with explicit relationships (e.g., `Person` ── *owns* ──→ `Project`, `Decision` ── *affects* ──→ `Project`).
- **Confidence Scoring & Evidence Quotes**: Assigns a confidence score ($0.0 \text{ to } 1.0$) and extracts exact quotes from source documents for every extracted fact.
- **Resilient Fallback**: Uses `json_repair` to recover from malformed LLM outputs automatically.

### 🕸️ 3. Interactive Knowledge Graph Visualizer
- **Visual Graph Engine**: Powered by `@xyflow/react` (React Flow v12).
- **Entity Nodes & Custom Cards**: Color-coded nodes with icons for each of the 8 entity types.
- **Animated Directional Edges**: Displays relationship direction and strength visually.
- **Interactive Controls**: Pan, zoom, fit view, 1-hop neighbor search highlight.
- **Confidence Filtering**: Slide threshold filters (`All`, `High`, `Very High`, `Verified`).
- **Evidence Drawer (`Sheet`)**: Clicking any node or edge opens a slide-over panel showing complete entity details, linked edges, and exact source evidence quotes.

### 📊 4. Operational Memory Explorer
- **Search & Filter Table**: Filter company memory by entity types (`People`, `Projects`, `Decisions`, `Tasks`, etc.).
- **Confidence Badges**: Instant visual feedback on fact reliability (`Verified` $\ge 90\%$, `High` $\ge 80\%$, `Medium`, `Low`).
- **Detailed Fact Modal**: Inspect full property lists, timestamps, and origin metadata.

### 🤖 5. Evidence-Grounded Company Knowledge Copilot
- **Natural Language Q&A**: Employees ask questions such as:
  - *"Who handles client onboarding?"*
  - *"Why did we choose React over Vue?"*
  - *"What is the status of Project Optimus?"*
- **Evidence Provenance Cards**: Responses provide a clear answer alongside source document links, exact quotes, and confidence scores.
- **Custom Chat Primitives**: Built with custom shadcn chat primitives (`MessageScroller`, `Bubble`, `Attachment`, `Marker`).

### ⚙️ 6. Workflow Intelligence & Action Execution (Foundation)
- **Workflow Discovery**: Detects sequential execution patterns from company records (e.g., *New Client Signup → Create CRM Record → Assign Manager → Send Welcome Email*).
- **Human-in-the-Loop Approval**: Generates step-by-step execution plans requiring human sign-off before triggering mock actions (CRM creation, task assignment, email dispatch).

---

## 3. System Architecture

```text
                               ┌────────────────────────────────────────┐
                               │           COMPANY DATA INPUTS          │
                               │  (PDF / DOCX / TXT, Slack, Raw Text)   │
                               └──────────────────┬─────────────────────┘
                                                  │
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │        FASTAPI BACKEND SERVICE         │
                               │      (Ingestion & Parsing Engine)      │
                               └──────────────────┬─────────────────────┘
                                                  │
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │           AI EXTRACTION PIPELINE       │
                               │        (Google Gemini 2.5 Flash)       │
                               └──────────────────┬─────────────────────┘
                                                  │
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │       OPERATIONAL KNOWLEDGE GRAPH      │
                               │     (PostgreSQL + Async SQLAlchemy)    │
                               │   - 8 Entity Tables + Edge Mapping     │
                               │   - Extractions & Provenance Quotes    │
                               └────────┬──────────────────────┬────────┘
                                        │                      │
                                        ▼                      ▼
           ┌──────────────────────────────┐          ┌──────────────────────────────┐
           │      KNOWLEDGE VISUALIZER    │          │    COMPANY COPILOT ENGINE    │
           │    (React Flow v12 Canvas)   │          │ (Hybrid Subgraph RAG + Q&A)   │
           └──────────────────────────────┘          └──────────────┬───────────────┘
                                                                    │
                                                                    ▼
                                                     ┌──────────────────────────────┐
                                                     │     EVIDENCE-BACKED ANSWER   │
                                                     │ (Answer + Quotes + Badges)   │
                                                     └──────────────────────────────┘
```

### Architectural Tiers

1. **Frontend Presentation Tier (Next.js 16 / React 19)**
   - **App Router & Turbopack**: Fast server rendering and client navigation across `/copilot`, `/memory`, `/knowledge`, `/ingest`, and `/entities`.
   - **Styling**: Tailwind CSS v4 design system with custom CSS variables, dark mode support, glassmorphism, and responsive UI layouts.
   - **Graph Visualizer**: React Flow v12 rendering interactive node-edge networks with custom node implementations.

2. **Backend API Tier (FastAPI / Uvicorn)**
   - **Async Architecture**: Fully async Python 3.10+ application using `asyncio` and `asyncpg`.
   - **Clean Architecture & Repositories**: Separated into API Routers, Business Logic Services, Repositories, DB Models, and Pydantic Schemas.
   - **Automated Open API Docs**: Available natively at `/docs`.

3. **AI & Extraction Tier (Google Gemini 2.5 Flash)**
   - **Structured LLM Prompts**: Prompts configured with `response_mime_type="application/json"` to extract entity nodes and relationship edges.
   - **JSON Repair Middleware**: Uses `json_repair` to handle nested markdown wrappers or minor formatting flaws seamlessly.

4. **Persistence Tier (PostgreSQL + Async SQLAlchemy)**
   - **Relational Schema**: 8 separate entity tables (`people`, `projects`, `decisions`, `tasks`, `processes`, `events`, `documents`, `workflows`).
   - **Edge & Provenance Schema**: `relationships` table storing source/target entity IDs, types, metadata, and confidence scores; `extractions` table tracking evidence quotes and source references.
   - **Schema Migrations**: Managed using Alembic (`alembic upgrade head`).

---

## 4. Knowledge Model Schema

### 4.1 Core Entity Types

| Entity Type | Description | Key Attributes |
| :--- | :--- | :--- |
| `Person` | Employee, contractor, or external contact. | `name`, `role`, `department`, `email` |
| `Project` | Company initiative or product development track. | `name`, `status`, `description`, `target_date` |
| `Decision` | Key choice made by leadership or team members. | `title`, `rationale`, `decided_by`, `date` |
| `Task` | Individual actionable work item. | `title`, `status`, `assignee`, `due_date` |
| `Process` | Standard Operating Procedure (SOP) or business process. | `name`, `trigger`, `steps`, `owner` |
| `Event` | Milestone, client signup, complaint, or operational trigger. | `title`, `event_type`, `timestamp`, `details` |
| `Document` | Uploaded reference file or ingested communication. | `title`, `file_path`, `file_type`, `uploaded_at` |
| `Workflow` | Sequence of automated or semi-automated execution steps. | `name`, `trigger_event`, `action_steps`, `confidence` |

### 4.2 Core Relationship Types

```text
[Person]    ─── owns ─────────► [Project]
[Person]    ─── made ─────────► [Decision]
[Decision]  ─── affects ──────► [Project]
[Event]     ─── triggers ─────► [Workflow]
[Workflow]  ─── creates ──────► [Task]
[Task]      ─── assigned to ──► [Person]
```

---

## 5. Step-by-Step Technical Execution Flow

```text
[1. Ingest Data] ➔ [2. Parse & Extract] ➔ [3. Save Graph & Evidence] ➔ [4. Query Copilot] ➔ [5. Render Answer + Provenance]
```

### Step 1: Data Ingestion & Parsing
1. User uploads a file (e.g. `Onboarding_SOP.pdf`), inputs a Slack transcript, or pastes text via `/ingest`.
2. `parser_service.py` identifies the source format:
   - PDFs parsed via `pypdf` / text extractor.
   - DOCX parsed via `python-docx`.
   - Slack logs split into structured message objects.
3. A `Source` record is saved in PostgreSQL with status `pending`.

### Step 2: AI Knowledge Extraction
1. `extraction_service.py` sends the raw text to Google Gemini 2.5 Flash via `llm_service.py`.
2. Gemini evaluates the text against the enterprise ontology and returns structured JSON containing extracted entities, relationships, confidence scores, and evidence quotes.
3. If JSON syntax errors occur, `json_repair` fixes the string before parsing.

### Step 3: Graph Assembly & Persistence
1. `_create_or_match_entity()` checks if an entity already exists (by name & type matching). If present, it merges information; otherwise, it creates a new record.
2. Relationships are stored in the `relationships` table with source ID, target ID, relationship type, and confidence rating.
3. An `Extraction` record links the exact evidence snippet to the source document and generated graph elements.
4. Source status updates to `completed`.

### Step 4: Knowledge Graph Visualisation
1. Frontend calls `GET /api/graph` (or `GET /api/graph/subgraph`).
2. `graph_service.py` builds the node-edge payload with position metadata.
3. Frontend transforms the data into React Flow nodes and edges, applying color-coding and confidence line weights.
4. User can click any element to open the `Sheet` drawer and inspect underlying evidence.

### Step 5: Copilot Question Answering (RAG)
1. User asks a question in `/copilot` (e.g., *"Who owns client onboarding?"*).
2. `copilot_service.py`:
   - Searches the database for matching entities, relationships, and extraction snippets relevant to the query terms.
   - Constructs a structured context payload including graph facts and evidence quotes.
   - Sends the question and context to Gemini 2.5 Flash with strict instructions to answer **only** using operational memory.
3. Gemini returns a JSON object containing:
   - `answer`: Clear natural language response.
   - `confidence`: Overall confidence score.
   - `evidence`: Array of source names, types, and exact quotes.
   - `mentioned_entities`: List of entity IDs and names referenced.
4. Copilot UI renders the response using shadcn chat primitives, highlighting confidence badges and clickable evidence cards.

---

## 6. Technology Stack Reference

| Layer | Technology | Key Dependencies / Libraries | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) | React 19, Turbopack | Modern web UI, server components, fast routing. |
| **Styling & UI** | Tailwind CSS v4 | shadcn/ui, Radix UI, Lucide Icons | Responsive styling, component primitives, dark mode. |
| **Graph Visualizer** | `@xyflow/react` | React Flow v12 | Interactive node-edge visualization canvas. |
| **Backend API** | FastAPI | Python 3.10+, Uvicorn, Pydantic v2 | High-performance asynchronous REST API. |
| **ORM & Database** | SQLAlchemy (AsyncIO) | PostgreSQL, AsyncPG, Alembic | Graph-relational storage and database migrations. |
| **AI / LLM Engine** | Google GenAI SDK | `google-genai` (Gemini 2.5 Flash), `json_repair` | Entity extraction, relationship mapping, Copilot Q&A. |
| **Document Parsers** | Python Libraries | `pypdf`, `python-docx` | Extracting raw text from uploaded files. |

---

## 7. Project Structure Overview

```text
proj pitching (IITM)/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI entrypoint & middleware setup
│   │   ├── config.py                 # Environment & app settings
│   │   ├── database.py               # Async SQLAlchemy engine & session maker
│   │   ├── models/                   # 13 DB models (person, project, decision, task, etc.)
│   │   ├── schemas/                  # Pydantic schemas for requests/responses
│   │   ├── repositories/             # Async database queries and entity lookup maps
│   │   ├── routers/                  # API routes (copilot, graph, memory, ingestion, entities)
│   │   └── services/                 # Business logic (llm, extraction, copilot, graph, parser)
│   ├── alembic/                      # Database migration scripts
│   ├── seed.py                       # Initial sample data seeder
│   ├── requirements.txt              # Backend dependencies
│   └── .env                          # Environment variables (DB URL, Gemini API Key)
│
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   ├── page.tsx              # Landing / Dashboard page
│   │   │   ├── copilot/              # Copilot chat interface
│   │   │   ├── memory/               # Operational Memory Explorer table
│   │   │   ├── knowledge/            # Interactive Knowledge Graph page
│   │   │   ├── ingest/               # Ingestion page for docs, Slack & text
│   │   │   └── entities/             # Entity manager and explorer pages
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components (chat bubbles, sheets, badges, etc.)
│   │   │   ├── layout/               # Sidebar navigation, header, theme toggle
│   │   │   └── forms/                # Ingestion and entity forms
│   │   └── lib/                      # API client utilities and helpers
│   ├── package.json                  # Frontend dependencies
│   └── tailwind.config.ts            # Tailwind CSS configuration
│
├── README.md                         # Project summary & execution quickstart
├── PROJECT_OVERVIEW.md               # Detailed system architecture, features & workflow guide
├── MVP.md                            # Roadmap & phase-by-phase design document
├── TECH STACK.md                     # Deep-dive tech stack breakdown
└── start.bat                         # Unified Windows 1-click startup script
```

---

## 8. How to Run Locally

### Quick Start (Windows)
Run the root batch script to start both Backend and Frontend concurrently:
```cmd
start.bat
```

### Access Points
- 🌐 **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- 💬 **Company Copilot**: [http://localhost:3000/copilot](http://localhost:3000/copilot)
- 🧠 **Operational Memory**: [http://localhost:3000/memory](http://localhost:3000/memory)
- 🕸️ **Knowledge Graph**: [http://localhost:3000/knowledge](http://localhost:3000/knowledge)
- 📄 **Backend Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
