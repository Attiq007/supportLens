from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

Category = Literal[
    "Billing", "Refund", "Account Access", "Cancellation", "General Inquiry"
]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    bot_response: str
    response_time_ms: int


class TraceCreate(BaseModel):
    user_message: str
    bot_response: str
    response_time_ms: int


class TraceResponse(BaseModel):
    id: str
    user_message: str
    bot_response: str
    category: str
    timestamp: datetime
    response_time_ms: int

    class Config:
        from_attributes = True


class CategoryStats(BaseModel):
    count: int
    percentage: float


class AnalyticsResponse(BaseModel):
    total: int
    avg_response_time_ms: float
    categories: dict[str, CategoryStats]
