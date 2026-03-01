import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Trace(Base):
    __tablename__ = "traces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_message = Column(String, nullable=False)
    bot_response = Column(String, nullable=False)
    category = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    response_time_ms = Column(Integer, nullable=False)
