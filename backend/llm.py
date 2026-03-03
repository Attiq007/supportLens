import logging
import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_VALID_CATEGORIES = {
    "Billing",
    "Refund",
    "Account Access",
    "Cancellation",
    "General Inquiry",
}

_CHATBOT_SYSTEM = (
    "You are a helpful customer support agent for BillFlow, a SaaS billing platform. "
    "Answer customer questions clearly and professionally. Keep responses concise and actionable. "
    "If you cannot resolve an issue directly, explain what steps the customer should take next."
)

_CLASSIFIER_PROMPT = """You are a customer support conversation classifier for a SaaS billing platform.

Classify the conversation below into EXACTLY ONE of these five categories:
- Billing: Questions about invoices, charges, payment methods, pricing, or subscription fees
- Refund: Requests to return a product, get money back, dispute a charge, or process a credit
- Account Access: Issues logging in, resetting passwords, locked accounts, or MFA problems
- Cancellation: Requests to cancel a subscription, downgrade a plan, or close an account
- General Inquiry: Anything else — feature questions, product info, how-to questions, onboarding

Priority rules for ambiguous conversations:
1. Billing + Cancellation overlap → Cancellation (cancellation intent is the primary concern)
2. Billing + Refund overlap → Refund (refund is more specific than a general billing question)
3. Account Access involved alongside other topics → Account Access (access blocks everything else)
4. Otherwise, choose the category matching the customer's PRIMARY intent

Customer message: {user_message}
Agent response: {bot_response}

Reply with ONLY the category name. No explanation, no punctuation, just one of:
Billing, Refund, Account Access, Cancellation, General Inquiry"""

_api_key = os.getenv("GEMINI_API_KEY", "").strip()
_llm_available = bool(_api_key)

_chat_model = None
_classifier_model = None

if _llm_available:
    genai.configure(api_key=_api_key)
    _chat_model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        system_instruction=_CHATBOT_SYSTEM,
    )
    _classifier_model = genai.GenerativeModel(model_name="gemini-flash-latest")
else:
    logger.warning("GEMINI_API_KEY not set — LLM features running in degraded mode")


def is_available() -> bool:
    return _llm_available


def chat_response(message: str) -> str:
    if not _llm_available:
        return (
            "The AI assistant is temporarily unavailable. "
            "Please contact support directly at support@billflow.com."
        )
    try:
        response = _chat_model.generate_content(message)
        return response.text.strip()
    except Exception as exc:
        logger.error("LLM chat request failed", extra={"error": str(exc), "preview": message[:100]})
        raise


def classify(user_message: str, bot_response: str) -> str:
    if not _llm_available:
        return "General Inquiry"
    try:
        prompt = _CLASSIFIER_PROMPT.format(
            user_message=user_message,
            bot_response=bot_response,
        )
        response = _classifier_model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(temperature=0),
        )
        raw = response.text.strip()

        if raw in _VALID_CATEGORIES:
            return raw

        for category in _VALID_CATEGORIES:
            if category.lower() in raw.lower():
                return category

        logger.warning(
            "Unexpected LLM classification — falling back to General Inquiry",
            extra={"raw_output": raw},
        )
        return "General Inquiry"
    except Exception as exc:
        logger.error("LLM classification failed — falling back to General Inquiry", extra={"error": str(exc)})
        return "General Inquiry"
