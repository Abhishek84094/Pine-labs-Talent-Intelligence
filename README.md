# Pine Labs — AI-Powered Candidate Project & Resume Evaluation Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205+-3178C6.svg)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python%203.10+-3776AB.svg)](https://www.python.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-F55036.svg)](https://groq.com)
[![Tests](https://img.shields.io/badge/Tests-52%20Passing-success.svg)](backend/tests)
[![Security](https://img.shields.io/badge/Security-ZipSlip%20%26%20Bomb%20Guards-brightgreen.svg)](docs/security.md)

An enterprise-grade technical hiring platform developed for **Pine Labs**. The platform enables candidates to submit their resume along with a ZIP archive of a real-world software project they have built. The platform performs safe, isolated static code inspection, analyzes resume claims against actual codebase evidence, and generates comprehensive, rubric-graded technical evaluation reports with tailored interview questions for the engineering team.

---

## 🌟 Key Features

- **Candidate Submission Portal**:
  - Intuitive 4-step responsive workflow: Profile Info → Resume Upload → Project ZIP Upload → Review & Submit.
  - Multi-file drag-and-drop with client-side format & size validation.
  - Real-time upload progress tracking.

- **Zero-Execution Static Code Inspector**:
  - Inspects project archives without running arbitrary code.
  - **Zip Slip Guard**: Blocks all path traversal attacks (`../`, absolute paths, drive letters).
  - **Zip Bomb Guard**: Enforces strict compression ratio, file count (<5,000), and uncompressed size limits (<200MB).
  - **Credential Redaction**: Detects and excludes sensitive files (`.env`, `.pem`, `*.key`, `id_rsa`) from AI analysis.
  - **Intelligent File Prioritization**: Parses READMEs, manifests (`package.json`, `go.mod`, `pom.xml`, `requirements.txt`), and core source files while ignoring heavy build artifacts (`node_modules`, `.git`, `dist`).

- **3-Stage LLM Evaluation Pipeline (Groq + LangChain)**:
  - **Stage 1 (Resume Analysis)**: Extracts structured career history, tech stacks, certifications, and highlighted claims.
  - **Stage 2 (Project Analysis)**: Maps system architecture, frameworks, database designs, testing rigor, and code quality.
  - **Stage 3 (Synthesis & Triangulation)**: Cross-references resume claims with project code, scores against a 5-dimension rubric, flags potential concerns, and generates non-generic interview questions grounded in the candidate's exact code.

- **Recruiter & Hiring Team Dashboard**:
  - Real-time submission tracking with status badges (Queued, Analyzing, Completed, Partial, Failed).
  - Instant candidate search by name, email, or reference ID.
  - Filter by evaluation status.
  - One-click deletion and evaluation retry.

- **Deep Technical Reports & Export**:
  - Interactive evaluation reports with collapsible sections, score bars, and confidence ratings.
  - Code snippet citations linked to line numbers.
  - One-click export to **Markdown** or **JSON** for ATS integration.
  - Full print stylesheet for hiring panel packets.

---

## 🏛 Architecture & Tech Stack

```
pine-labs-talent-intelligence/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # Route handlers & Pydantic schemas
│   │   ├── core/             # Configuration & environment settings
│   │   ├── db/               # SQLAlchemy async models, database & seed script
│   │   ├── llm/              # Groq client, LangChain chains & prompts
│   │   ├── services/         # Resume parser, zip inspector & evaluation orchestrator
│   │   └── main.py           # FastAPI entrypoint & middleware
│   └── tests/                # 52 unit & integration tests
├── frontend/                 # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/       # Header, FileUpload, StepIndicator
│   │   ├── pages/            # SubmissionPage, DashboardPage, ReportPage, ConfirmationPage
│   │   ├── services/         # Axios API client
│   │   └── types/            # TypeScript schemas matching backend models
│   └── index.html
└── docs/                     # Comprehensive architecture and security documentation
    ├── architecture.md       # High-level architecture & trade-offs
    ├── security.md           # Threat model, Zip Slip, and credential protection
    └── prompts_and_chains.md # Prompt design & evaluation rubrics
```

### Technology Matrix
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, aiosqlite, Pydantic v2, PyMuPDF (`fitz`), python-docx.
- **AI / LLM**: LangChain, ChatGroq (`llama-3.3-70b-versatile`), Tenacity.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, React Hook Form, Zod.
- **Database**: SQLite with async `aiosqlite` engine (zero external infrastructure dependencies).

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm

### 1. Backend Setup
```bash
# Navigate to backend directory
cd pine-labs-talent-intelligence/backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Add your Groq API key in backend/.env for live LLM inference
# Obtain a free key at https://console.groq.com/
# GROQ_API_KEY=gsk_...

# Seed the database with 3 realistic candidate evaluations
python -m app.db.seed

# Start the backend server (runs on http://localhost:8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger API Documentation will be available at:
👉 **`http://localhost:8000/api/docs`**

---

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd pine-labs-talent-intelligence/frontend

# Install dependencies (already installed in workspace)
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`** — Candidate Submission Portal
👉 **`http://localhost:5173/dashboard`** — Recruiter Hiring Dashboard

---

## 🧪 Running Automated Tests

The backend includes a comprehensive test suite of **52 unit and integration tests** covering:
- File format and MIME type validation
- Zip safety (Zip Slip rejection, Zip Bomb threshold limits, corrupt archive handling)
- Sensitive file detection (`.env`, `.pem`, `.key`)
- Directory exclusion rules (`node_modules`, `.git`, `__pycache__`)
- Resume PDF and DOCX text extraction
- Submission API lifecycle (Create, Read, List, Search, Filter, Delete, Retry)
- LLM failure modes and graceful fallback handling

To run tests:
```bash
cd pine-labs-talent-intelligence/backend
pytest tests/ -v
```

**Result:**
```
======================= 52 passed, 5 warnings in 3.43s ========================
```

---

## 🔒 Security & Safe Analysis Guarantee

1. **Zero Code Execution**: Code submitted in candidate ZIPs is **never** compiled, executed, or containerized. Static inspection reads file metadata and selective source text for pattern analysis.
2. **Path Traversal Protection**: Every archive entry is inspected against path canonicalization attacks before reading bytes.
3. **Secret Isolation**: Configuration files containing API keys, private certificates, or `.env` secrets are automatically redacted before LLM transmission.
4. **Prompt Injection Hardening**: All candidate data is isolated using markdown delimiter fences and evaluated via strict Pydantic JSON schemas.

For detailed security analysis, see [docs/security.md](docs/security.md).

---

## 📊 Evaluation Rubric Dimensions

Candidates are objectively evaluated on a 10-point scale across 5 standard dimensions:

| Dimension | Key Evaluation Criteria |
|---|---|
| **System Architecture & Design** | Modularity, separation of concerns, layer decoupling, scalability. |
| **Code Quality & Idiomatic Implementation** | Error handling, typing, naming conventions, clean syntax. |
| **Concurrency, Fault Tolerance & Performance** | Thread-safety, idempotency, race conditions, caching, backoff. |
| **Security & Edge-Case Handling** | Input validation, secret hygiene, SQL injection prevention, authentication. |
| **Testing & Observability** | Unit test depth, integration tests, mock stubs, logging and metrics. |

---

## 📄 License & Attribution
Designed and built for the **Pine Labs Technical Hiring Assessment**.
All Rights Reserved.
