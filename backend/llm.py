import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. "
        "Copy .env.example to .env and add your key from https://aistudio.google.com/app/apikey"
    )

genai.configure(api_key=_api_key)

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

_VALID_CATEGORIES = {
    "Billing",
    "Refund",
    "Account Access",
    "Cancellation",
    "General Inquiry",
}

_chat_model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction=_CHATBOT_SYSTEM,
)

_classifier_model = genai.GenerativeModel(model_name="gemini-flash-latest")


def chat_response(message: str) -> str:
    response = _chat_model.generate_content(message)
    return response.text.strip()


def classify(user_message: str, bot_response: str) -> str:
    prompt = _CLASSIFIER_PROMPT.format(
        user_message=user_message,
        bot_response=bot_response,
    )
    response = _classifier_model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(temperature=0),
    )
    raw = response.text.strip()

    # Exact match first
    if raw in _VALID_CATEGORIES:
        return raw

    # Lenient match (handles minor formatting issues)
    for category in _VALID_CATEGORIES:
        if category.lower() in raw.lower():
            return category

    return "General Inquiry"
