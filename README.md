# Grasim Industries — Intern Onboarding System
**MBDD / TRADC · React + FastAPI + PostgreSQL**

---

## Overview

A full-stack web application that digitalises the end-to-end intern onboarding process at Grasim Industries Ltd. Single URL, 5 role-based dashboards, candidate portal via secure token link.

---

## Roles & Access

| Role | Login | What they can do |
|------|-------|-----------------|
| **HR Admin** | Email + password | Initiate interns, verify docs, generate offer/certificate PDFs, export FY tracker |
| **Candidate** | Secure token link (no password) | Fill details, upload docs, sign Annexure A & B, accept/decline offer |
| **Accounts** | Email + password | Vendor setup, log monthly ₹7,000 stipend payments |
| **IT Team** | Email + password | Provision laptop, create ABG email, mark assets done |
| **Project Manager** | Email + password | Submit structured evaluation form (replaces QR Google Forms) |

---

## Tech Stack

- **Frontend** — React 18 + Vite + TailwindCSS + React Router + React Hook Form
- **Backend** — FastAPI + Python + SQLAlchemy + Alembic
- **Database** — PostgreSQL 16
- **PDF Generation** — WeasyPrint + Jinja2 (auto-generates Offer Letter, Annexure A, B, Certificate)
- **Auth** — JWT (Bearer token) for HR/Accounts/IT/Manager · Secure token URL for Candidate

---

## Project Structure

```
intern-onboarding/
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers (auth, hr, candidate, accounts, it, manager)
│   │   ├── core/          # Config, database, security/JWT
│   │   ├── models/        # SQLAlchemy models (16 tables)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Email, PDF, Excel export, file upload, audit
│   │   └── pdf/templates/ # HTML templates for WeasyPrint (offer letter, certificate)
│   ├── alembic/           # Database migrations
│   ├── seed.py            # Creates initial users
│   ├── .env.example       # Environment variable template
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/           # Axios API client
│       ├── components/    # Shared UI components + layout/sidebar
│       ├── context/       # Auth context (JWT state)
│       └── pages/
│           ├── hr/        # HR Dashboard, Initiate, Intern List, Intern Detail
│           ├── candidate/ # Portal Steps 1–4 (Details → Docs → Annexures → Offer)
│           ├── accounts/  # Accounts Dashboard, Task Detail + Stipend Tracker
│           ├── it/        # IT Dashboard, Task Detail (laptop, ABG email)
│           └── manager/   # Manager Dashboard, Review Form
└── docker-compose.yml
```

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16 running locally (or use Docker)

### 2. Database (Docker — easiest)
```bash
docker-compose up db -d
```
Or manually create:
```sql
CREATE DATABASE intern_onboarding;
```

### 3. Backend Setup
```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env — set your DATABASE_URL and SECRET_KEY at minimum

# Install dependencies
pip install -r requirements.txt

# Create all tables
python seed.py

# Start the server
uvicorn app.main:app --reload --port 8000
```
API docs available at: `http://localhost:8000/docs`

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
App available at: `http://localhost:5173`

---

## Default Login Credentials (after running seed.py)

| Role | Email | Password |
|------|-------|----------|
| HR (Sheba Banerjee) | sheba.banerjee@grasim.com | admin@123 |
| HR Admin | hr@grasim.com | admin@123 |
| Accounts | accounts@grasim.com | accounts@123 |
| IT Team | it@grasim.com | it@123 |
| Manager (Gaurav) | gaurav.shrivastava@grasim.com | manager@123 |
| Manager (Rajesh) | rajesh.bhandari@grasim.com | manager@123 |

> **Change all passwords before deploying to production.**

---

## Email Configuration (for sending portal links)

In `.env`, set your SMTP credentials:
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=hr@grasim.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_TLS=True
```
In development (no SMTP configured), emails are printed to the console log.

---

## Database Migrations (Alembic)

```bash
cd backend

# Create a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Key API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | All | Login → JWT token |
| GET | `/api/auth/me` | All | Current user info |
| POST | `/api/hr/initiate` | HR | Initiate new intern, sends portal email |
| GET | `/api/hr/interns` | HR | List all interns with filters |
| GET | `/api/hr/intern/{id}` | HR | Full intern detail |
| PATCH | `/api/hr/document/{doc_id}/verify` | HR | Approve/reject uploaded document |
| POST | `/api/hr/intern/{id}/offer-letter/generate` | HR | Auto-generate offer letter PDF |
| POST | `/api/hr/intern/{id}/offer-letter/send` | HR | Send offer to candidate |
| POST | `/api/hr/intern/{id}/certificate/generate` | HR | Auto-generate experience certificate PDF |
| GET | `/api/hr/export/excel` | HR | Export FY tracker as Excel |
| GET | `/api/candidate/portal/{token}` | Public | Load portal info (no login) |
| POST | `/api/candidate/portal/{token}/submit` | Public | Submit personal/academic/bank details |
| POST | `/api/candidate/portal/{token}/upload-document` | Public | Upload document |
| POST | `/api/candidate/portal/{token}/sign-annexure` | Public | Sign Annexure A or B |
| POST | `/api/candidate/portal/{token}/offer-response` | Public | Accept/decline offer |
| PATCH | `/api/accounts/task/{id}` | Accounts | Update vendor/payment info |
| POST | `/api/accounts/task/{id}/stipend` | Accounts | Log monthly stipend payment |
| PATCH | `/api/it/task/{id}` | IT | Update laptop/email provisioning |
| POST | `/api/manager/intern/{id}/review` | Manager | Submit evaluation form |

---

## PDF Documents Generated

| Document | Template | Auto-filled from |
|----------|----------|-----------------|
| Internship Offer Letter | `offer_letter.html` | Intern record + company config |
| Annexure A (General T&C) | Inline in portal | Pre-filled, candidate signs |
| Annexure B (Confidentiality/IP) | Inline in portal | Candidate fills PAN + Aadhaar |
| Experience Certificate | `certificate.html` | HR fills project title + guide names |

All PDFs match the real Grasim document formats exactly.

---

## Production Checklist

- [ ] Change `SECRET_KEY` in `.env` to a long random string
- [ ] Change all default user passwords
- [ ] Set `DEBUG=False`
- [ ] Configure real SMTP credentials
- [ ] Set `FRONTEND_URL` to your actual domain
- [ ] Use a production PostgreSQL instance
- [ ] Set up file storage (S3 or similar) for uploaded documents
- [ ] Configure HTTPS / SSL certificate
- [ ] Set up proper backup for PostgreSQL

---

## Grasim-specific Details Hardcoded

- **Stipend**: ₹7,000/month paid on the **23rd** of every month
- **Locations**: MBDD, TRADC
- **HR Head**: Sheba Banerjee, Head — Human Resources, MBDD
- **Company**: Grasim Industries Ltd., CIN: L17124MP1947PLC000410
- **Address**: Aditya Birla Centre, 'A' wing, 2nd Floor, S.K. Ahire Marg, Worli, Mumbai 400 030
- **Confidentiality period**: 5 years post internship (Annexure B)
- All configurable via `backend/app/core/config.py`
