import csv
import io
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

import health as health_mod
import llm
from database import Base, engine, get_db
from logging_config import setup_logging
from models import Trace
from schemas import (
    AnalyticsResponse,
    CategoryStats,
    ChatRequest,
    ChatResponse,
    TraceCreate,
    TraceResponse,
)

setup_logging()
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SupportLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://localhost"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CATEGORIES = ["Billing", "Refund", "Account Access", "Cancellation", "General Inquiry"]


@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    request_id = str(uuid.uuid4())
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = int((time.monotonic() - start) * 1000)
    logger.info(
        "http_request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query": str(request.query_params) or None,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


@app.get("/health")
def health_endpoint(db: Session = Depends(get_db)):
    body, status_code = health_mod.build_health_response(db)
    return JSONResponse(content=body, status_code=status_code)


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    start = time.monotonic()
    response_text = llm.chat_response(request.message)
    elapsed_ms = int((time.monotonic() - start) * 1000)
    return ChatResponse(bot_response=response_text, response_time_ms=elapsed_ms)


@app.post("/traces", response_model=TraceResponse, status_code=201)
def create_trace(payload: TraceCreate, db: Session = Depends(get_db)):
    if not payload.user_message.strip() or not payload.bot_response.strip():
        raise HTTPException(status_code=400, detail="user_message and bot_response are required")

    category = llm.classify(payload.user_message, payload.bot_response)

    trace = Trace(
        id=str(uuid.uuid4()),
        user_message=payload.user_message,
        bot_response=payload.bot_response,
        category=category,
        timestamp=datetime.now(timezone.utc),
        response_time_ms=payload.response_time_ms,
    )
    db.add(trace)
    db.commit()
    db.refresh(trace)
    return trace


@app.get("/traces", response_model=list[TraceResponse])
def list_traces(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Trace)

    if category and category in CATEGORIES:
        query = query.filter(Trace.category == category)

    if search and search.strip():
        query = query.filter(
            Trace.user_message.ilike(f"%{search.strip()}%")
        )

    return query.order_by(Trace.timestamp.desc()).all()


@app.get("/analytics", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db)):
    total = db.query(Trace).count()

    if total == 0:
        return AnalyticsResponse(
            total=0,
            avg_response_time_ms=0.0,
            categories={c: CategoryStats(count=0, percentage=0.0) for c in CATEGORIES},
        )

    avg_rt = db.query(func.avg(Trace.response_time_ms)).scalar() or 0.0

    counts = (
        db.query(Trace.category, func.count(Trace.id))
        .group_by(Trace.category)
        .all()
    )
    count_map = {cat: cnt for cat, cnt in counts}

    categories = {
        cat: CategoryStats(
            count=count_map.get(cat, 0),
            percentage=round(count_map.get(cat, 0) / total * 100, 1),
        )
        for cat in CATEGORIES
    }

    return AnalyticsResponse(
        total=total,
        avg_response_time_ms=round(avg_rt, 1),
        categories=categories,
    )


@app.get("/traces/export")
def export_traces(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Export all traces (optionally filtered by category) as a CSV file."""
    query = db.query(Trace)
    if category and category in CATEGORIES:
        query = query.filter(Trace.category == category)
    traces = query.order_by(Trace.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "timestamp", "category", "response_time_ms", "user_message", "bot_response"])
    for t in traces:
        writer.writerow([t.id, t.timestamp.isoformat(), t.category, t.response_time_ms, t.user_message, t.bot_response])

    filename = f"supportlens-traces{'-' + category.lower().replace(' ', '-') if category else ''}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
