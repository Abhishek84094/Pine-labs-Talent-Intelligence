<div align="center">

<img src="./logo/pine-labs-logo.png" alt="Pine Labs Logo" width="140" />

# Pine Labs Talent Intelligence

**AI-Powered Resume & Project Evaluation Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat-square)](https://groq.com/)
[![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

> A full-stack intelligent recruitment platform built for Pine Labs that automates resume screening, project code evaluation, and candidate shortlisting — powered by Groq LLM inference.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Hiring Workflow](#hiring-workflow)
- [Screenshots](#screenshots)

---

## Overview

Pine Labs Talent Intelligence is a **production-grade AI recruitment pipeline** that eliminates manual resume screening. Candidates submit their resume and a project ZIP via a polished web interface. The platform's backend runs a multi-stage LLM evaluation pipeline using Groq to:

1. **Parse & analyse the resume** — extracts skills, experience, education, and red flags
2. **Inspect the project code** — reads file structure, identifies architecture patterns, evaluates code quality
3. **Generate a unified evaluation report** — produces a structured JSON report with scores, strengths, weaknesses, and custom interview questions

The **Hiring Dashboard** gives the recruiting team a real-time view of all applicants, lets them review and shortlist candidates, and sends beautifully branded **Pine Labs interview invitation emails** via Gmail SMTP — all from a single interface.

---

## Features

### Candidate-Facing
- 🖊️ **Multi-step submission form** — name, email, phone, job role, GitHub/LinkedIn/portfolio links
- 📄 **Resume upload** — PDF or DOCX (up to 10 MB)
- 🗜️ **Project ZIP upload** — full project code (up to 50 MB), with safety validation
- ⏳ **Real-time evaluation progress** — polling with animated status updates
- ✅ **Confirmation screen** — submission receipt and expected timeline

### AI Evaluation Pipeline
- 📑 **Resume analysis** — skills extraction, experience scoring, consistency checks, red flag detection
- 💻 **Project code analysis** — architecture overview, tech stack identification, code quality metrics, complexity assessment
- 🧠 **Synthesis report** — unified LLM-generated report with overall score (0–100), strengths/weaknesses, and 5 tailored interview questions
- 🔄 **Automatic retry** — tenacity-based LLM retry with exponential backoff; JSON-repair fallback for malformed responses

### Hiring Dashboard
- 📊 **Live applicant table** — search, filter by role/status/review state
- ✔️ **Review checklist** — 5-point checklist modal to mark candidate evaluation complete
- ☑️ **Multi-select shortlisting** — checkbox-select multiple candidates for batch actions
- 📧 **One-click interview invitation** — configure 3-round schedule (Online Assessment, Technical, HR) and send a branded email
- 📥 **PDF download** — download full evaluation report as PDF from the report page
- 🏷️ **Status badges** — Needs Review / Reviewed / Shortlisted / Rejected

### Email System
- 🔖 **Branded Pine Labs HTML email** — dark forest header, lime-green accents, 3-round schedule card
- 📬 **Gmail SMTP delivery** — real emails to candidates' inboxes
- 📋 **Plain-text fallback** — always includes a text/plain part for email clients that block HTML

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CANDIDATE BROWSER                           │
│  Landing Page → Submission Form → Confirmation → (Report View)     │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTP / REST (Vite Proxy → :8000)
┌────────────────────────▼────────────────────────────────────────────┐
│                     FASTAPI BACKEND  (:8000)                        │
│                                                                     │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────────┐  │
│  │  Submission │   │  Evaluation      │   │  Hiring / Review    │  │
│  │  Routes     │   │  Pipeline        │   │  Routes             │  │
│  │  POST /sub  │   │  (Background)    │   │  PATCH /review      │  │
│  │  GET  /sub  │──▶│                  │   │  POST /batch-review │  │
│  │  DELETE     │   │  ┌────────────┐  │   │  POST /send-invite  │  │
│  └─────────────┘   │  │ Resume     │  │   └─────────────────────┘  │
│                    │  │ Parser     │  │                             │
│  ┌─────────────┐   │  │ (PyMuPDF/  │  │   ┌─────────────────────┐  │
│  │  Email      │   │  │  docx)     │  │   │  Email Service      │  │
│  │  Routes     │   │  └─────┬──────┘  │   │  (Gmail SMTP)       │  │
│  │  GET status │   │        │         │   └─────────────────────┘  │
│  └─────────────┘   │  ┌─────▼──────┐  │                             │
│                    │  │ Project    │  │   ┌─────────────────────┐  │
│  ┌─────────────┐   │  │ Analyser   │  │   │  SQLite DB          │  │
│  │  Repository │   │  │ (ZIP walk) │  │   │  (aiosqlite /       │  │
│  │  Layer      │◀──│  └─────┬──────┘  │   │   SQLAlchemy)       │  │
│  └─────────────┘   │        │         │   └─────────────────────┘  │
│                    │  ┌─────▼──────┐  │                             │
│                    │  │ Groq LLM   │  │                             │
│                    │  │ (LangChain)│  │                             │
│                    │  └────────────┘  │                             │
│                    └──────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│                     HIRING TEAM BROWSER                             │
│  Dashboard → Review Checklist → Shortlist → Send Invitation Email  │
│  Report Page → View AI Report → Download PDF                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Evaluation Pipeline — Sequence

```
Candidate submits form
        │
        ▼
[1] File validation (size, MIME, ZIP safety)
        │
        ▼
[2] Files saved to /storage/{uuid}/
        │
        ▼
[3] SQLite record created (status: queued)
        │
        ▼
[4] Background task triggered
        │
        ├──▶ [4a] Resume Parser
        │         PyMuPDF extracts text from PDF / python-docx for DOCX
        │         LangChain prompt → Groq LLM → structured JSON
        │
        ├──▶ [4b] Project Analyser
        │         ZIP walked → file tree built → key files read
        │         LangChain prompt → Groq LLM → structured JSON
        │
        └──▶ [4c] Report Synthesiser
                  Combined context → Groq LLM → final report JSON
                  Score (0–100), strengths, weaknesses, interview Qs
                  Stored in DB as evaluation_report column
        │
        ▼
[5] Status → "completed" | "partial" | "failed"
        │
        ▼
[6] Frontend polls /status → renders Report Page
```

---

## Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| API Framework | **FastAPI 0.115** | REST API, background tasks, dependency injection |
| ASGI Server | **Uvicorn** | Production-grade async server |
| LLM Inference | **Groq API** (via LangChain) | Ultra-fast LLM inference for resume/project analysis |
| LLM Orchestration | **LangChain 0.3 + langchain-groq** | Prompt templates, chain composition |
| PDF Parsing | **PyMuPDF (fitz)** | Extract text from PDF resumes |
| DOCX Parsing | **python-docx** | Extract text from Word resumes |
| Database ORM | **SQLAlchemy 2.0 (async)** | Async DB operations |
| Database | **SQLite + aiosqlite** | Lightweight async persistence |
| Data Validation | **Pydantic v2** | Request/response schemas |
| Config | **pydantic-settings** | `.env` file loading |
| Retry Logic | **Tenacity** | Exponential backoff for LLM calls |
| JSON Repair | **json-repair** | Fixes malformed LLM JSON output |
| Email | **smtplib (Gmail SMTP)** | Branded candidate invitation emails |
| File Safety | **python-magic-bin** | MIME type validation |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React 18 + TypeScript** | Component-based UI |
| Build Tool | **Vite 5** | Lightning-fast dev server and bundler |
| Routing | **React Router v6** | Client-side navigation |
| Styling | **Tailwind CSS 3** | Utility-first styling with custom Pine Labs design tokens |
| Icons | **Lucide React** | Crisp, consistent icon set |
| HTTP Client | **Axios** | REST API calls with base URL proxy |
| PDF Export | **jsPDF + html2canvas** | Client-side PDF generation of reports |
| Fonts | **Inter (Google Fonts)** | Premium typography |

### Design System — Pine Labs Tokens

| Token | Value | Usage |
|---|---|---|
| `pine-forest` | `#00262C` | Primary dark — headers, nav |
| `pine-forest-deep` | `#001A1E` | Deep backgrounds |
| `pine-lime` | `#D0F255` | Brand accent — CTAs, badges |
| `pine-mint` | `#13BBCA` | Teal accent — highlights |
| `pine-cream` | `#F3F5F1` | Background base |
| `pine-slate` | `#1E2D2F` | Body text |

---

## Project Structure

```
pine-labs-talent-intelligence/
│
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   └── submissions.py  # All REST endpoints
│   │   │   └── schemas/
│   │   │       ├── candidate.py    # Pydantic request/response models
│   │   │       └── evaluation.py   # Evaluation report schemas
│   │   ├── core/
│   │   │   └── config.py           # Settings from .env
│   │   ├── db/
│   │   │   ├── database.py         # SQLAlchemy engine + session
│   │   │   ├── models.py           # ORM models (submissions table)
│   │   │   └── repository.py       # DB query layer
│   │   ├── llm/
│   │   │   └── groq_client.py      # LangChain + Groq setup
│   │   ├── services/
│   │   │   ├── evaluation_service.py  # Pipeline orchestrator
│   │   │   ├── resume_parser.py       # PDF/DOCX → structured JSON
│   │   │   ├── project_analyser.py    # ZIP → code analysis JSON
│   │   │   └── email_service.py       # Gmail SMTP invitation sender
│   │   ├── utils/
│   │   │   └── file_validation.py  # MIME, size, ZIP safety checks
│   │   └── main.py                 # FastAPI app entrypoint + CORS
│   ├── .env                        # Secrets (git-ignored)
│   ├── .env.example                # Template for setup
│   └── requirements.txt
│
├── frontend/                       # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx              # Top navigation bar
│   │   │   ├── FileUpload.tsx          # Drag-and-drop file uploader
│   │   │   ├── StepIndicator.tsx       # Multi-step form progress
│   │   │   ├── ReviewChecklistModal.tsx # Recruiter review checklist
│   │   │   └── InvitationModal.tsx     # Shortlist & send email modal
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx         # Hero, role info, how-it-works
│   │   │   ├── SubmissionPage.tsx      # Candidate application form
│   │   │   ├── ConfirmationPage.tsx    # Post-submission receipt
│   │   │   ├── DashboardPage.tsx       # Hiring team dashboard
│   │   │   └── ReportPage.tsx          # Full AI evaluation report
│   │   ├── services/
│   │   │   └── api.ts                  # Axios API client
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces
│   │   ├── data/
│   │   │   └── roleConfig.ts           # Job role configuration
│   │   ├── index.css                   # Tailwind + design tokens
│   │   └── App.tsx                     # Router setup
│   ├── .env.example
│   └── package.json
│
├── docs/                           # Internal documentation
├── logo/                           # Pine Labs brand assets
├── storage/                        # Uploaded files (git-ignored)
├── run_backend.bat                 # Windows: start backend
├── run_frontend.bat                # Windows: start frontend
└── run_all.bat                     # Windows: start both
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Groq API key** — free at [console.groq.com](https://console.groq.com)
- **Gmail account** with an [App Password](https://myaccount.google.com/apppasswords) (for email sending)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/pine-labs-talent-intelligence.git
cd pine-labs-talent-intelligence
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Start the API server
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Open in browser

| URL | Description |
|---|---|
| `http://localhost:5173/` | Candidate landing page & application form |
| `http://localhost:5173/dashboard` | Hiring team dashboard |
| `http://127.0.0.1:8000/docs` | FastAPI interactive API docs (Swagger UI) |

### Windows one-click launch

```bat
# From project root — starts both backend and frontend
run_all.bat
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# ─── LLM ──────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b          # or llama-3.3-70b-versatile

# ─── Database ─────────────────────────────────────────────────────
DATABASE_URL=sqlite+aiosqlite:///./pine_labs_talent.db

# ─── Storage ──────────────────────────────────────────────────────
UPLOAD_DIR=../../storage

# ─── File Limits ──────────────────────────────────────────────────
MAX_RESUME_SIZE_MB=10
MAX_PROJECT_ZIP_SIZE_MB=50

# ─── CORS ─────────────────────────────────────────────────────────
FRONTEND_ORIGIN=http://localhost:5173

# ─── Gmail SMTP (for shortlist invitation emails) ─────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16char_app_password   # Google App Password, NOT your login password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=Pine Labs Talent Intelligence
SMTP_USE_TLS=true
```

> **Getting a Gmail App Password:**
> 1. Enable 2-Step Verification at [myaccount.google.com/security](https://myaccount.google.com/security)
> 2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> 3. Create a new App Password → copy the 16-character code into `SMTP_PASSWORD`

---

## API Reference

### Submissions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/submissions` | Submit candidate application (multipart: resume + zip) |
| `GET` | `/api/submissions` | List all submissions (search, filter, pagination) |
| `GET` | `/api/submissions/stats` | Dashboard statistics |
| `GET` | `/api/submissions/{id}` | Get single submission |
| `GET` | `/api/submissions/{id}/status` | Poll evaluation status |
| `GET` | `/api/submissions/{id}/report` | Get full AI evaluation report |
| `DELETE` | `/api/submissions/{id}` | Delete submission and files |
| `POST` | `/api/submissions/{id}/retry` | Retry failed evaluation |

### Hiring Review

| Method | Endpoint | Description |
|---|---|---|
| `PATCH` | `/api/submissions/{id}/review` | Update review status + checklist |
| `POST` | `/api/submissions/batch-review` | Bulk update review status |
| `POST` | `/api/submissions/send-invitation` | Send shortlist invitation emails |

Full interactive documentation available at: `http://127.0.0.1:8000/docs`

---

## Hiring Workflow

```
1. Candidate submits application via Landing Page
         │
         ▼
2. AI pipeline evaluates resume + project (1–3 mins)
         │
         ▼
3. Hiring team opens Dashboard
         │
         ├── Search / filter candidates by name, role, status
         ├── Click candidate row → view full AI Report
         │         ├── Resume analysis: skills, experience, red flags
         │         ├── Project analysis: architecture, code quality
         │         ├── Synthesis score (0–100) with strengths/weaknesses
         │         ├── 5 custom interview questions
         │         └── Download PDF button
         │
         ├── Click "Review Checklist" → tick 5-point verification
         │         ├── ☑ Executive summary reviewed
         │         ├── ☑ Resume skills verified
         │         ├── ☑ Project architecture assessed
         │         ├── ☑ Red flags checked
         │         └── ☑ Interview questions prepared
         │
         └── Select candidates → "Shortlist & Send Mail"
                   ├── Configure: Online Assessment date
                   ├── Configure: Round 1 Technical interview date
                   ├── Configure: Round 2 HR interview date
                   ├── Optional: personalized note
                   └── Send → Branded Pine Labs email delivered instantly
```

---

## Screenshots

> Dashboard, Report page, and Invitation modal screenshots can be found in the [`docs/`](./docs/) folder.

---

## Contributing

This project was built as a talent evaluation platform for Pine Labs internal hiring. For questions or contributions, please open an issue.

---

<div align="center">

Built with ❤️ for Pine Labs · Powered by Groq LLM

</div>
