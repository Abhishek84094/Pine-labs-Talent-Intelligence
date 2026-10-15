"""Seed database with realistic Pine Labs technical hiring candidates and evaluation reports"""
import asyncio
import json
import os
import uuid
from datetime import datetime, timezone, timedelta
from app.db.database import AsyncSessionLocal, init_db
from app.db.models import Submission, ProcessingStatus
from app.core.config import get_settings

settings = get_settings()


async def seed():
    await init_db()
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select, func
        count = await session.execute(select(func.count(Submission.id)))
        if (count.scalar() or 0) > 0:
            print("Database already contains submissions. Skipping seed.")
            return

        now = datetime.now(timezone.utc)
        os.makedirs(settings.upload_dir, exist_ok=True)

        # ---------------- Candidate 1: Priya Sharma ----------------
        id1 = str(uuid.uuid4())
        ref1 = "PL-2026-PRIYA"
        sub1 = Submission(
            id=id1,
            reference_id=ref1,
            full_name="Priya Sharma",
            email="priya.sharma.dev@gmail.com",
            phone="+91 98765 43210",
            job_role="Senior Backend Engineer (Payments & FinTech)",
            github_url="https://github.com/priyasharma-dev/idempotent-payment-engine",
            linkedin_url="https://linkedin.com/in/priyasharma-payments",
            portfolio_url="https://priyasharma.tech",
            resume_filename="Priya_Sharma_Resume.pdf",
            resume_file_path=os.path.join(settings.upload_dir, "priya_resume.pdf"),
            resume_file_size=142850,
            project_filename="idempotent-payment-engine.zip",
            project_file_path=os.path.join(settings.upload_dir, "priya_project.zip"),
            project_file_size=524288,
            status=ProcessingStatus.COMPLETED,
            model_used=settings.groq_model,
            submitted_at=now - timedelta(hours=3),
            analysis_started_at=now - timedelta(hours=3),
            analysis_completed_at=now - timedelta(hours=2, minutes=58),
            resume_analysis=json.dumps({
                "candidate_name": "Priya Sharma",
                "professional_summary": "Senior Backend Engineer with 5+ years building fault-tolerant microservices, distributed transaction processing, and fintech payment gateways. Core expertise in Go, PostgreSQL, Redis, and Kafka.",
                "technical_skills": ["Go", "Python", "PostgreSQL", "Redis", "Kafka", "Docker", "Kubernetes", "gRPC", "Distributed Systems", "Idempotency Patterns"],
                "programming_languages": ["Go", "Python", "SQL", "Bash"],
                "frameworks_and_libraries": ["Gin", "GORM", "FastAPI", "SQLAlchemy", "Sarama (Kafka)", "Redigo"],
                "tools_and_platforms": ["Docker", "Kubernetes", "AWS", "GitHub Actions", "Prometheus", "Grafana"],
                "work_experience": [
                    {
                        "title": "Senior Software Engineer",
                        "organization": "RazorPay Financial Technologies",
                        "start_date": "2023-01",
                        "end_date": "Present",
                        "description": "Architected merchant transaction ledger processing 12M+ daily transactions. Reduced settlement reconciliation latency by 42%.",
                        "technologies": ["Go", "PostgreSQL", "Kafka", "Redis"],
                        "is_internship": False
                    },
                    {
                        "title": "Backend Software Engineer",
                        "organization": "PayU Payments",
                        "start_date": "2021-06",
                        "end_date": "2022-12",
                        "description": "Implemented payment gateway routing algorithms and card tokenization vaults adhering to RBI guidelines.",
                        "technologies": ["Go", "Python", "MySQL", "Docker"],
                        "is_internship": False
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Computer Science & Engineering",
                        "institution": "National Institute of Technology (NIT) Trichy",
                        "graduation_year": "2021",
                        "gpa": "8.9 / 10"
                    }
                ],
                "projects": [
                    {
                        "title": "Idempotent Payment Engine",
                        "description": "Distributed two-phase transaction coordinator with distributed locks and double-entry book-keeping ledger.",
                        "technologies": ["Go", "PostgreSQL", "Redis", "Docker"]
                    }
                ],
                "certifications": ["AWS Certified Solutions Architect - Associate"],
                "relevant_highlights": [
                    "5+ years direct payments and transaction processing experience",
                    "Demonstrated mastery of distributed idempotency and concurrency controls"
                ],
                "claims_needing_verification": [
                    "Claimed 12M+ daily transactions ledger throughput at RazorPay"
                ]
            }),
            project_analysis=json.dumps({
                "project_title": "Idempotent Payment Settlement & Ledger Engine",
                "description": "A production-grade transaction orchestration service implementing two-phase commit, Redis distributed mutexes, and an immutable double-entry ledger for merchant settlement.",
                "architecture_overview": "Hexagonal / Clean Architecture in Go: separate domain, ports, adapters, and HTTP transport layers. Database transactions wrapped in serializable isolation for settlement balance calculations.",
                "backend_technologies": ["Go 1.22", "Gin-Gonic", "pgx / PostgreSQL", "Redis Redlock"],
                "databases_and_services": ["PostgreSQL 16", "Redis 7", "Docker Compose"],
                "main_functionality": [
                    "Idempotent API key hashing with TTL cache",
                    "Atomic account balance hold and debit operations",
                    "Immutable audit trail logging all balance transitions",
                    "Automated integration tests with testcontainers-go"
                ],
                "testing_approach": "Comprehensive unit tests and end-to-end integration test suite using testcontainers for spin-up of isolated Postgres and Redis instances. 84% statement coverage.",
                "security_observations": "Constant-time signature verification on webhooks. Sensitive fields (API secrets, CVV) strictly prohibited in logs. SQL parameterized queries exclusively.",
                "code_organization": "cmd/server, internal/domain, internal/service, internal/repository, pkg/idempotency, migrations.",
                "documentation_quality": "High. Clear architectural diagram, API OpenAPI spec, and setup instructions with docker-compose.",
                "deployment_readiness": "Containerized with multi-stage Dockerfile and health check endpoints (/health/live, /health/ready)."
            }),
            evaluation_report=json.dumps({
                "submission_id": id1,
                "candidate_name": "Priya Sharma",
                "job_role": "Senior Backend Engineer (Payments & FinTech)",
                "executive_summary": "Priya Sharma is a top-tier backend engineer with deep, highly relevant domain knowledge in payment gateways and transaction consistency. Her submission exhibits exceptional architectural maturity: clean separation of concerns, defensive concurrency controls using Redis distributed locking, and thorough integration test suites simulating payment timeouts and network retries.",
                "resume_overview": "Strong 5-year background in Tier-1 Indian FinTech organizations (RazorPay, PayU), with hands-on systems programming in Go and high-scale SQL databases.",
                "project_overview": "The submitted repository ('idempotent-payment-engine') is exceptionally well constructed. It directly tackles the core payments problem of duplicate charges and network partitions.",
                "rubric_assessments": [
                    {
                        "dimension": "System Architecture & Design",
                        "description": "Evaluation of modularity, separation of concerns, and clean architectural boundaries.",
                        "score": 9.2,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": [
                            "Strict adherence to Hexagonal Architecture separating domain entities from PostgreSQL persistence.",
                            "Graceful shutdown handling with context timeouts."
                        ],
                        "notes": "Excellent design tailored for enterprise payments infrastructure."
                    },
                    {
                        "dimension": "Code Quality & Idiomatic Implementation",
                        "description": "Idiomatic Go usage, error handling conventions, and readability.",
                        "score": 9.0,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": [
                            "Custom sentinel errors with %w wrapping for clean root-cause tracing.",
                            "Minimal external dependencies; clean zero-allocation patterns in hot paths."
                        ]
                    },
                    {
                        "dimension": "Concurrency & Fault Tolerance",
                        "description": "Thread safety, race condition prevention, and distributed locks.",
                        "score": 9.5,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": [
                            "Redlock distributed lock implementation preventing concurrent debits on same wallet.",
                            "PostgreSQL SELECT FOR UPDATE used defensively for row-level balance locks."
                        ]
                    },
                    {
                        "dimension": "Security & Edge-Case Handling",
                        "description": "Input sanitization, authentication, secret isolation, and defensive validations.",
                        "score": 8.8,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": [
                            "No secrets checked into git repository.",
                            "HMAC-SHA256 signature verification implemented for webhook endpoints."
                        ]
                    },
                    {
                        "dimension": "Testing & Observability",
                        "description": "Unit testing, integration testing, structured logging, and metrics.",
                        "score": 8.5,
                        "max_score": 10.0,
                        "confidence": "medium",
                        "evidence": [
                            "84% statement test coverage with dockerized testcontainers.",
                            "Structured JSON logging with correlation IDs."
                        ],
                        "missing_evidence": [
                            "No load testing benchmarks or p99 latency stress reports included in repository."
                        ]
                    }
                ],
                "strengths": [
                    {
                        "claim": "Real-world payment idempotency implementation",
                        "source": "pkg/idempotency/lock.go:L42",
                        "excerpt": "func (m *Mutex) AcquireWithTTL(ctx context.Context, key string, ttl time.Duration) (string, error)",
                        "confidence": "high"
                    },
                    {
                        "claim": "Immutable double-entry ledger bookkeeping",
                        "source": "internal/domain/ledger.go:L18",
                        "excerpt": "type JournalEntry struct { DebitAccountID string; CreditAccountID string; Amount int64; Timestamp time.Time }",
                        "confidence": "high"
                    },
                    {
                        "claim": "End-to-end integration tests using isolated test containers",
                        "source": "tests/integration/settlement_test.go:L55",
                        "excerpt": "postgresC, err := testcontainers.GenericContainer(ctx, ...)",
                        "confidence": "high"
                    }
                ],
                "potential_concerns": [
                    {
                        "category": "Scalability Under Lock Contention",
                        "observation": "Heavy reliance on Redis Redlock could become a bottleneck under extreme concurrent requests targeting the same merchant wallet.",
                        "severity": "info",
                        "is_positive": False,
                        "evidence": [
                            {
                                "claim": "Lock acquisition timeout set to 5000ms",
                                "source": "internal/service/payment.go:L88",
                                "excerpt": "lockTTL = 5 * time.Second",
                                "confidence": "high"
                            }
                        ]
                    }
                ],
                "technical_observations": [
                    {
                        "category": "Architecture",
                        "observation": "Clear domain-driven design that isolates business rules from HTTP transport and database technology.",
                        "is_positive": True
                    },
                    {
                        "category": "Testing",
                        "observation": "Tests verify idempotency duplicate key submissions and ensure no double debit occurs.",
                        "is_positive": True
                    }
                ],
                "consistency_checks": [
                    {
                        "item": "Go / Golang",
                        "in_resume": True,
                        "in_project": True,
                        "notes": "Primary language of submitted project matches resume claim of 4+ years Go experience.",
                        "confidence": "high"
                    },
                    {
                        "item": "PostgreSQL & Transactions",
                        "in_resume": True,
                        "in_project": True,
                        "notes": "Clean SQL migrations and transaction isolation matches resume claims.",
                        "confidence": "high"
                    },
                    {
                        "item": "Kafka",
                        "in_resume": True,
                        "in_project": False,
                        "notes": "Resume emphasizes Kafka streaming, but project utilizes in-memory channel dispatcher rather than external Kafka broker.",
                        "confidence": "medium"
                    }
                ],
                "interview_questions": [
                    {
                        "question": "In your payment engine, you chose Redis Redlock for transaction idempotency. If a Redis node fails mid-lock or experiences a network partition, how does your system guarantee against double-settlement?",
                        "relevance": "Directly probes the candidate's understanding of distributed system failure modes in financial systems.",
                        "evidence_or_uncertainty": "Project uses single-instance Redis fallback in development configs.",
                        "strong_answer_demonstrates": "Awareness of Martin Kleppmann's critique of Redlock, fencing tokens, and database-level unique constraint fallbacks."
                    },
                    {
                        "question": "How would you evolve your ledger implementation to handle 50,000 TPS across thousands of retail POS terminals during a peak festive flash sale at Pine Labs?",
                        "relevance": "Assesses scalability thinking specific to Pine Labs high-throughput retail merchant processing.",
                        "evidence_or_uncertainty": "Current implementation locks row-level balances sequentially.",
                        "strong_answer_demonstrates": "Partitioning balances by merchant sub-buckets, write-ahead event sourcing, and asynchronous reconciliation."
                    },
                    {
                        "question": "Your resume highlights Kafka event streaming at RazorPay, while the project uses in-memory channels. Walk us through how you would publish outbox events reliably to Kafka without losing events during service crashes.",
                        "relevance": "Checks consistency between claimed resume skills and project implementation choices.",
                        "evidence_or_uncertainty": "Resume lists Kafka extensively; project implements transactional outbox pattern partially in comments.",
                        "strong_answer_demonstrates": "Clear explanation of Transactional Outbox Pattern with Debezium CDC or polling publisher."
                    }
                ],
                "limitations": [
                    "Static code review only; performance benchmarks and live database failover scenarios were not tested with live traffic."
                ],
                "hiring_team_takeaway": "STRONGLY RECOMMEND PROCEEDING. Priya demonstrates rare practical mastery of financial engineering concerns: idempotency, ledger integrity, and clean Go systems architecture. Tailor the technical round to distributed system partitions and high-throughput scaling."
            })
        )
        session.add(sub1)

        # ---------------- Candidate 2: Rahul Nair ----------------
        id2 = str(uuid.uuid4())
        ref2 = "PL-2026-RAHUL"
        sub2 = Submission(
            id=id2,
            reference_id=ref2,
            full_name="Rahul Nair",
            email="rahul.nair.dev@outlook.com",
            phone="+91 97112 34567",
            job_role="Full Stack Platform Engineer",
            github_url="https://github.com/rahulnair-dev/merchant-portal-v2",
            linkedin_url="https://linkedin.com/in/rahulnair-fullstack",
            portfolio_url="https://rahulnair.dev",
            resume_filename="Rahul_Nair_Resume.pdf",
            resume_file_path=os.path.join(settings.upload_dir, "rahul_resume.pdf"),
            resume_file_size=125400,
            project_filename="merchant-analytics-portal.zip",
            project_file_path=os.path.join(settings.upload_dir, "rahul_project.zip"),
            project_file_size=843200,
            status=ProcessingStatus.COMPLETED,
            model_used=settings.groq_model,
            submitted_at=now - timedelta(hours=6),
            analysis_started_at=now - timedelta(hours=6),
            analysis_completed_at=now - timedelta(hours=5, minutes=57),
            resume_analysis=json.dumps({
                "candidate_name": "Rahul Nair",
                "professional_summary": "Full Stack Engineer with 3+ years experience creating merchant dashboard interfaces, real-time analytics, and REST/WebSocket APIs with React, TypeScript, Node.js, and Python.",
                "technical_skills": ["React", "TypeScript", "Next.js", "Node.js", "FastAPI", "Tailwind CSS", "WebSockets", "MongoDB", "Redis"],
                "programming_languages": ["TypeScript", "JavaScript", "Python"],
                "frameworks_and_libraries": ["React 18", "Next.js 14", "FastAPI", "TanStack Query", "Zustand", "TailwindCSS"],
                "tools_and_platforms": ["Docker", "Vercel", "GitHub Actions", "Vite"],
                "work_experience": [
                    {
                        "title": "Frontend / Full Stack Developer",
                        "organization": "KredX Trade Financing",
                        "start_date": "2022-04",
                        "end_date": "Present",
                        "description": "Built invoice discounting portal used by 2,000+ SMB merchants. Implemented real-time status updates via WebSockets.",
                        "technologies": ["React", "TypeScript", "Node.js", "MongoDB"],
                        "is_internship": False
                    }
                ],
                "education": [
                    {
                        "degree": "B.E. in Information Technology",
                        "institution": "PES University, Bengaluru",
                        "graduation_year": "2022",
                        "gpa": "8.4 / 10"
                    }
                ],
                "projects": [
                    {
                        "title": "Merchant Terminal Analytics",
                        "description": "Live dashboard tracking terminal status, transaction success rates, and settlement breakdowns.",
                        "technologies": ["React", "FastAPI", "WebSockets", "Tailwind"]
                    }
                ],
                "relevant_highlights": [
                    "Strong UI craftsmanship with modern React and TypeScript",
                    "Working knowledge of both frontend state and backend async APIs"
                ]
            }),
            project_analysis=json.dumps({
                "project_title": "Real-time Merchant Terminal Analytics Hub",
                "description": "Full-stack dashboard application featuring interactive transaction charts, live POS device telemetry streams via WebSockets, and merchant settlement filters.",
                "architecture_overview": "Client-Server architecture: React/TypeScript frontend built with Vite, paired with a lightweight FastAPI backend for streaming mock POS events.",
                "frontend_technologies": ["React 18", "TypeScript", "Vite", "Tailwind CSS", "Recharts", "Lucide React"],
                "backend_technologies": ["Python 3.11", "FastAPI", "WebSockets", "Pydantic"],
                "main_functionality": [
                    "Live terminal status monitor (Online / Offline / Processing)",
                    "Transaction volume timeline with aggregations by payment method (UPI, Card, EMI)",
                    "Interactive merchant fee calculator"
                ],
                "testing_approach": "Frontend component unit tests using Vitest and React Testing Library (14 tests). Backend unit tests are minimal (only 2 basic health tests).",
                "code_organization": "Clean frontend folder structure (components, hooks, pages, types). Backend is a single main.py file.",
                "documentation_quality": "Good README with setup instructions and screenshots.",
                "potential_limitations": [
                    "Backend lacks database persistence; uses in-memory simulation.",
                    "Missing reconnection backoff on WebSocket client."
                ]
            }),
            evaluation_report=json.dumps({
                "submission_id": id2,
                "candidate_name": "Rahul Nair",
                "job_role": "Full Stack Platform Engineer",
                "executive_summary": "Rahul Nair demonstrates polished frontend capabilities with strong TypeScript typing and intuitive UI layout. His merchant dashboard is responsive, visually compelling, and showcases real-time telemetry updates. The backend portion is somewhat lightweight (simulation-only), making him stronger on frontend and client-state management than deep distributed systems.",
                "resume_overview": "3 years experience in merchant portals and financial dashboards. Solid education and practical React ecosystem experience.",
                "project_overview": "Merchant Terminal Analytics Hub built with React + Vite + FastAPI WebSockets. Clean visuals and good component structuring.",
                "rubric_assessments": [
                    {
                        "dimension": "Frontend Engineering & UI/UX",
                        "description": "Modern React practices, responsive design, component reusability, and state management.",
                        "score": 8.8,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": ["Clean custom hooks for WebSocket event subscription", "Responsive grid layout with Tailwind"]
                    },
                    {
                        "dimension": "Backend & API Architecture",
                        "description": "API design, scalability, database persistence, and error handling.",
                        "score": 6.8,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": ["FastAPI async WebSocket endpoints implemented correctly"],
                        "missing_evidence": ["No database persistence; state stored entirely in Python memory dictionary"]
                    },
                    {
                        "dimension": "Testing & Reliability",
                        "description": "Automated unit tests, integration tests, and edge case coverage.",
                        "score": 6.2,
                        "max_score": 10.0,
                        "confidence": "medium",
                        "evidence": ["Vitest tests covering UI card components"],
                        "missing_evidence": ["No backend unit tests for WebSocket disconnection or packet malformation"]
                    }
                ],
                "strengths": [
                    {
                        "claim": "Strong TypeScript types and schema consistency",
                        "source": "frontend/src/types/merchant.ts:L12",
                        "excerpt": "export interface TerminalTelemetry { id: string; status: 'online' | 'offline'; batteryPct: number; }",
                        "confidence": "high"
                    },
                    {
                        "claim": "Modern custom hooks for live data feeds",
                        "source": "frontend/src/hooks/useTerminalFeed.ts:L24",
                        "excerpt": "useEffect(() => { const ws = new WebSocket(url); ... return () => ws.close() }, [url])",
                        "confidence": "high"
                    }
                ],
                "potential_concerns": [
                    {
                        "category": "Backend Depth",
                        "observation": "Backend relies entirely on mock memory dictionaries without database transactions or migrations.",
                        "severity": "concern",
                        "is_positive": False,
                        "evidence": [
                            {
                                "claim": "State held in memory variable",
                                "source": "backend/main.py:L15",
                                "excerpt": "terminals_db = {}",
                                "confidence": "high"
                            }
                        ]
                    }
                ],
                "technical_observations": [
                    {
                        "category": "Frontend",
                        "observation": "High visual quality with appropriate charts, status tags, and accessible contrast ratios.",
                        "is_positive": True
                    }
                ],
                "consistency_checks": [
                    {
                        "item": "React & TypeScript",
                        "in_resume": True,
                        "in_project": True,
                        "notes": "Matches resume claims very well.",
                        "confidence": "high"
                    },
                    {
                        "item": "MongoDB",
                        "in_resume": True,
                        "in_project": False,
                        "notes": "Resume mentions MongoDB experience, but project avoids database setup.",
                        "confidence": "high"
                    }
                ],
                "interview_questions": [
                    {
                        "question": "In your WebSocket feed hook, what happens if the network connection drops while a merchant is viewing terminal telemetry? How would you implement exponential backoff reconnection and state resynchronization?",
                        "relevance": "Tests client-side network resilience in live merchant operations.",
                        "evidence_or_uncertainty": "Current hook does not handle onError reconnection loops.",
                        "strong_answer_demonstrates": "Detailed knowledge of heartbeat pings, exponential jitter backoff, and snapshot reconciliation."
                    },
                    {
                        "question": "How would you persist this terminal telemetry in a real production environment where 50,000 terminals send heartbeat pings every 5 seconds?",
                        "relevance": "Checks candidate's backend scaling knowledge beyond the in-memory prototype.",
                        "evidence_or_uncertainty": "Project uses in-memory state.",
                        "strong_answer_demonstrates": "Recommends time-series database (TimescaleDB / ClickHouse) or Redis TTL keys with stream buffer."
                    }
                ],
                "limitations": [
                    "Backend persistence and high-load WebSocket concurrency not present in the submitted project."
                ],
                "hiring_team_takeaway": "RECOMMEND PROCEEDING FOR FRONTEND / FULL-STACK EMPHASIS. Candidate is strong in product UI and React. Needs evaluation on backend architectural patterns and database design during the interview."
            })
        )
        session.add(sub2)

        # ---------------- Candidate 3: Ananya Gupta ----------------
        id3 = str(uuid.uuid4())
        ref3 = "PL-2026-ANANYA"
        sub3 = Submission(
            id=id3,
            reference_id=ref3,
            full_name="Ananya Gupta",
            email="ananya.gupta.qa@gmail.com",
            phone="+91 99887 65432",
            job_role="SDET / Quality Engineering Lead",
            github_url="https://github.com/ananyag-qa/payment-chaos-harness",
            linkedin_url="https://linkedin.com/in/ananya-gupta-sdet",
            portfolio_url="https://ananyagupta.dev",
            resume_filename="Ananya_Gupta_Resume.pdf",
            resume_file_path=os.path.join(settings.upload_dir, "ananya_resume.pdf"),
            resume_file_size=118900,
            project_filename="payment-resilience-harness.zip",
            project_file_path=os.path.join(settings.upload_dir, "ananya_project.zip"),
            project_file_size=634000,
            status=ProcessingStatus.COMPLETED,
            model_used=settings.groq_model,
            submitted_at=now - timedelta(days=1, hours=2),
            analysis_started_at=now - timedelta(days=1, hours=2),
            analysis_completed_at=now - timedelta(days=1, hours=1, minutes=56),
            resume_analysis=json.dumps({
                "candidate_name": "Ananya Gupta",
                "professional_summary": "Lead Quality Engineer / SDET with 6+ years designing enterprise test automation frameworks, API performance harnesses, and chaos engineering simulations for banking and fintech platforms.",
                "technical_skills": ["Pytest", "Locust", "WireMock", "Docker", "Python", "Java", "CI/CD", "Prometheus", "Chaos Engineering"],
                "programming_languages": ["Python", "Java", "SQL", "Bash"],
                "frameworks_and_libraries": ["Pytest", "Requests", "Locust", "Pydantic", "Allure Reports", "RestAssured"],
                "tools_and_platforms": ["Docker", "GitHub Actions", "Jenkins", "Grafana", "JMeter"],
                "work_experience": [
                    {
                        "title": "Lead SDET",
                        "organization": "One97 Communications (Paytm)",
                        "start_date": "2021-08",
                        "end_date": "Present",
                        "description": "Architected end-to-end payment gateway resilience test suite. Automated 10,000+ API test scenarios in CI/CD pipeline.",
                        "technologies": ["Python", "Pytest", "Docker", "Locust"],
                        "is_internship": False
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Computer Science",
                        "institution": "Delhi Technological University (DTU)",
                        "graduation_year": "2019",
                        "gpa": "9.1 / 10"
                    }
                ],
                "projects": [
                    {
                        "title": "Payment Resilience & Chaos Harness",
                        "description": "Automated framework injecting network latency, HTTP 503 retries, and corrupted payloads against payment endpoints.",
                        "technologies": ["Python", "Pytest", "Locust", "WireMock", "Docker"]
                    }
                ],
                "relevant_highlights": [
                    "Exceptional depth in software quality engineering and automated resilience verification",
                    "Strong background in FinTech payments reliability"
                ]
            }),
            project_analysis=json.dumps({
                "project_title": "Payment Resilience & Chaos Injection Test Harness",
                "description": "A production-grade test automation and performance framework designed to validate payment API fault tolerance, idempotent retry policies, and latency SLA adherence.",
                "architecture_overview": "Modular Python test architecture with Pytest fixtures, mock stubs using WireMock in Docker, and Locust load testing scripts with SLA assertions.",
                "backend_technologies": ["Python 3.11", "Pytest", "Locust", "WireMock", "Docker Compose"],
                "main_functionality": [
                    "Chaos injection for simulating bank gateway timeouts and HTTP 504 errors",
                    "Idempotency retry validation verifying no duplicate ledger transactions",
                    "Automated Allure reporting with HTML dashboards and latency distributions"
                ],
                "testing_approach": "The project itself IS a comprehensive test framework with 48 automated test cases, parameterized test data, and CI/CD workflow files.",
                "documentation_quality": "Superb documentation with step-by-step reproduction instructions and CLI arguments.",
                "deployment_readiness": "Dockerized execution via Makefile: 'make test', 'make load-test', 'make report'."
            }),
            evaluation_report=json.dumps({
                "submission_id": id3,
                "candidate_name": "Ananya Gupta",
                "job_role": "SDET / Quality Engineering Lead",
                "executive_summary": "Ananya Gupta's submission is an exemplar of modern quality engineering. Her test automation harness specifically targets the most painful edge cases in financial transactions: partial network failures, third-party bank timeouts, and duplicate payment submissions. The framework exhibits superior modularity and engineering rigor.",
                "resume_overview": "6 years of distinguished SDET experience at Paytm with deep knowledge of banking protocols and high-throughput reliability.",
                "project_overview": "Payment Chaos & Resilience Test Harness in Python / Pytest / Locust. Outstanding test design and documentation.",
                "rubric_assessments": [
                    {
                        "dimension": "Test Architecture & Design",
                        "description": "Modularity, fixture reusability, test isolation, and parameterized execution.",
                        "score": 9.8,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": ["Clean fixture lifecycle with auto-teardown", "Custom retry assertions with jitter"]
                    },
                    {
                        "dimension": "Automation & CI/CD Integration",
                        "description": "Containerization, headless execution, and CI workflow pipelines.",
                        "score": 9.5,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": ["Complete GitHub Actions workflow with Allure report artifact generation"]
                    },
                    {
                        "dimension": "FinTech Domain & Failure Modes",
                        "description": "Understanding of payment gateway failure patterns, idempotency, and timeouts.",
                        "score": 9.5,
                        "max_score": 10.0,
                        "confidence": "high",
                        "evidence": ["Dedicated chaos scenarios testing bank gateway socket hangs and 200 vs 500 status ambiguities"]
                    }
                ],
                "strengths": [
                    {
                        "claim": "Advanced network partition and timeout simulation",
                        "source": "harness/chaos/network.py:L31",
                        "excerpt": "class NetworkFaultInjector: def inject_latency(self, endpoint: str, delay_ms: int)",
                        "confidence": "high"
                    },
                    {
                        "claim": "Comprehensive assertions on financial idempotency",
                        "source": "tests/test_idempotency_chaos.py:L48",
                        "excerpt": "assert len(settlement_records) == 1, 'Duplicate settlement detected under concurrent retry'",
                        "confidence": "high"
                    }
                ],
                "potential_concerns": [],
                "technical_observations": [
                    {
                        "category": "Quality Engineering",
                        "observation": "Exceptional understanding of edge cases in banking integrations.",
                        "is_positive": True
                    }
                ],
                "consistency_checks": [
                    {
                        "item": "Pytest & Python",
                        "in_resume": True,
                        "in_project": True,
                        "notes": "Matches resume perfectly.",
                        "confidence": "high"
                    },
                    {
                        "item": "Locust Load Testing",
                        "in_resume": True,
                        "in_project": True,
                        "notes": "Included runnable Locust load scenarios with custom user profiles.",
                        "confidence": "high"
                    }
                ],
                "interview_questions": [
                    {
                        "question": "When simulating payment gateway timeouts with WireMock, how do you handle tests where a transaction is in an ambiguous state (e.g. HTTP request timed out, but bank successfully deducted money)?",
                        "relevance": "Directly probes real-world financial reconciliation testing strategies.",
                        "evidence_or_uncertainty": "Framework tests timeout recovery via status inquiry API.",
                        "strong_answer_demonstrates": "Clear protocol for status inquiry polling, dual reconciliation queues, and dead-letter handling."
                    },
                    {
                        "question": "How would you integrate this chaos harness into a continuous deployment pipeline for Pine Labs terminal firmware without destabilizing testing environments?",
                        "relevance": "Evaluates leadership and strategy for shift-left testing in complex hardware-software ecosystems.",
                        "evidence_or_uncertainty": "Currently runs against containerized HTTP endpoints.",
                        "strong_answer_demonstrates": "Virtual device emulation, Canary deployment gating, and automated rollback triggers."
                    }
                ],
                "limitations": [],
                "hiring_team_takeaway": "STRONGLY RECOMMEND PROCEEDING WITH FAST-TRACK. Ananya is a top-decile Quality Engineering Lead who will immediately elevate test rigor, resilience standards, and automated performance testing for Pine Labs payment gateways."
            })
        )
        session.add(sub3)

        await session.commit()
        print(f"Successfully seeded 3 candidates:\n - {sub1.full_name} ({ref1})\n - {sub2.full_name} ({ref2})\n - {sub3.full_name} ({ref3})")


if __name__ == "__main__":
    asyncio.run(seed())
