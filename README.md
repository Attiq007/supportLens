# SupportLens

A lightweight observability platform for a customer support chatbot. Send a message to the chatbot, and every conversation is automatically classified and logged to a real-time dashboard.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 · FastAPI · SQLAlchemy · SQLite |
| LLM | Google Gemini 2.0 Flash (free tier) |
| Frontend | React 18 · Vite · Tailwind CSS · Recharts |
| Database | SQLite (zero-config, file-based) |

---

## Prerequisites

- A free **Google Gemini API key** → [Get one at aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Quick Start — Docker (single command)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd supportlens

# 2. Create your .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Start everything
docker-compose up --build
```

- **Dashboard + Chatbot:** http://localhost:5173
- **API docs:** http://localhost:8000/docs

---

## Quick Start — Without Docker

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file with your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Seed the database with 25 sample traces
python seed.py

# Start the API server
uvicorn main:app --reload
```

Backend runs at: http://localhost:8000

### Frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## How It Works

```
User types message
       ↓
POST /chat  →  Gemini generates bot response (timed)
       ↓
POST /traces  →  Gemini classifies the conversation into one of 5 categories
       ↓
Trace saved to SQLite  →  Appears on dashboard
```

### Classification Categories

| Category | Description |
|----------|-------------|
| **Billing** | Invoices, charges, payment methods, pricing |
| **Refund** | Return requests, money back, disputed charges |
| **Account Access** | Login issues, password resets, locked accounts, MFA |
| **Cancellation** | Subscription cancellations, downgrades, plan closure |
| **General Inquiry** | Feature questions, product info, how-to questions |

### Classification Prompt Design

The classifier uses a carefully crafted prompt with **explicit priority rules** for edge cases:

1. Billing + Cancellation overlap → **Cancellation** (cancellation is the primary intent)
2. Billing + Refund overlap → **Refund** (refund is more specific)
3. Account Access involved → **Account Access** (access blocks everything else)
4. Otherwise → best match for the customer's primary intent

Temperature is set to 0 for deterministic output.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send a message, get a bot response |
| `POST` | `/traces` | Save a trace (classifies via LLM) |
| `GET` | `/traces` | List all traces (filter: `?category=`, `?search=`) |
| `GET` | `/analytics` | Aggregate stats (totals, category breakdown, avg response time) |

Full interactive docs: http://localhost:8000/docs

---

## Project Structure

```
supportlens/
├── backend/
│   ├── main.py        # FastAPI routes
│   ├── database.py    # SQLAlchemy setup
│   ├── models.py      # Trace ORM model
│   ├── schemas.py     # Pydantic schemas
│   ├── llm.py         # Gemini integration (chat + classify)
│   └── seed.py        # 25 pre-classified seed traces
└── frontend/
    └── src/
        ├── App.jsx              # Root layout + tab nav
        ├── api.js               # API client
        └── components/
            ├── Analytics.jsx    # Stats cards + donut chart
            ├── TraceTable.jsx   # Filterable trace log
            ├── TraceModal.jsx   # Full trace detail overlay
            └── ChatPanel.jsx    # Chat interface
```
