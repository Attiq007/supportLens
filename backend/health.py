import time
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

import llm

_START_TIME = time.monotonic()


def _probe_database(db: Session) -> dict:
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


def _probe_llm() -> dict:
    if not llm.is_available():
        return {
            "status": "degraded",
            "detail": (
                "GEMINI_API_KEY not configured — "
                "chat returns a fallback message, classification defaults to General Inquiry"
            ),
        }
    return {"status": "ok"}


def build_health_response(db: Session) -> tuple[dict, int]:
    db_check = _probe_database(db)
    llm_check = _probe_llm()

    if db_check["status"] == "error":
        overall = "unhealthy"
    elif llm_check["status"] == "degraded":
        overall = "degraded"
    else:
        overall = "healthy"

    http_status = 503 if overall == "unhealthy" else 200
    body = {
        "status": overall,
        "uptime_seconds": round(time.monotonic() - _START_TIME, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "database": db_check,
            "llm": llm_check,
        },
    }
    return body, http_status
