"""
Seed script: inserts 25 pre-classified traces into the database.
Safe to re-run — skips seeding if traces already exist.
"""

import uuid
from datetime import datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import Trace

Base.metadata.create_all(bind=engine)

SEED_TRACES = [
    # Billing — 6 traces
    {
        "user_message": "I was charged twice for my subscription this month. Can you look into this?",
        "bot_response": "I'm sorry to hear about the duplicate charge. I can see your account and will flag this for our billing team to review. You should receive a resolution within 1–2 business days.",
        "category": "Billing",
        "response_time_ms": 1240,
        "days_ago": 0,
    },
    {
        "user_message": "What payment methods do you accept? I want to switch from credit card to bank transfer.",
        "bot_response": "We currently accept Visa, Mastercard, American Express, and ACH bank transfers for annual plans. To add a bank transfer method, go to Settings → Billing → Payment Methods and select 'Add Bank Account'.",
        "category": "Billing",
        "response_time_ms": 980,
        "days_ago": 1,
    },
    {
        "user_message": "My invoice shows a charge for 10 seats but I only have 7 users. Why am I being billed for more?",
        "bot_response": "Your plan includes a minimum of 10 seats. If you'd like to reduce your seat count, you can adjust this at renewal time. I can connect you with our billing team to review your options.",
        "category": "Billing",
        "response_time_ms": 1450,
        "days_ago": 1,
    },
    {
        "user_message": "How much does the Pro plan cost per month?",
        "bot_response": "The Pro plan is $49/month per seat when billed monthly, or $39/month per seat on an annual commitment. Volume discounts are available for 20+ seats. Would you like me to send you our full pricing guide?",
        "category": "Billing",
        "response_time_ms": 870,
        "days_ago": 2,
    },
    {
        "user_message": "I need a copy of my last 3 invoices for our accounting department.",
        "bot_response": "You can download all your invoices from the Billing section of your account dashboard under Billing History. If you need them emailed to a specific address, I can arrange that for you.",
        "category": "Billing",
        "response_time_ms": 760,
        "days_ago": 3,
    },
    {
        "user_message": "Do you offer any discounts for non-profit organizations?",
        "bot_response": "Yes, we offer a 30% discount for verified non-profit organizations. Please submit your 501(c)(3) documentation through our non-profit application form, and our team will review and apply the discount within 3 business days.",
        "category": "Billing",
        "response_time_ms": 1100,
        "days_ago": 4,
    },
    # Refund — 5 traces
    {
        "user_message": "I was accidentally charged for an annual plan instead of monthly. I want a refund for the difference.",
        "bot_response": "I understand the frustration. Since the annual charge happened today, I can process a refund for the difference between the annual and monthly rate. This will be credited back to your original payment method within 5–7 business days.",
        "category": "Refund",
        "response_time_ms": 1680,
        "days_ago": 0,
    },
    {
        "user_message": "I cancelled my account 3 days ago but was still charged for the full month. I want my money back.",
        "bot_response": "I'm sorry about this. You are eligible for a prorated refund for the unused days. I'll initiate the refund now — expect it within 3–5 business days. You'll receive a confirmation email shortly.",
        "category": "Refund",
        "response_time_ms": 1320,
        "days_ago": 1,
    },
    {
        "user_message": "I signed up for the wrong plan and realized it doesn't have the features I need. Can I get a full refund?",
        "bot_response": "Within our 14-day money-back guarantee window, we can issue a full refund. Since you signed up 6 days ago, you qualify. I'll process the refund to your card now. It may take 5–10 business days to appear.",
        "category": "Refund",
        "response_time_ms": 2100,
        "days_ago": 2,
    },
    {
        "user_message": "There's an unauthorized charge on my account from your company. I need this disputed immediately.",
        "bot_response": "I take unauthorized charges very seriously. I've flagged your account for our security team and initiated an investigation. Please also contact your bank to report the transaction. We will reach out within 24 hours.",
        "category": "Refund",
        "response_time_ms": 1550,
        "days_ago": 3,
    },
    {
        "user_message": "The feature I paid for stopped working last week. I want compensation or a refund for that period.",
        "bot_response": "I sincerely apologize for the service disruption. I'm issuing a prorated credit for the 7 days the feature was unavailable — this will appear as a credit on your next invoice. Would a credit work, or would you prefer a refund to your card?",
        "category": "Refund",
        "response_time_ms": 1890,
        "days_ago": 4,
    },
    # Account Access — 5 traces
    {
        "user_message": "I forgot my password and the reset email isn't arriving in my inbox.",
        "bot_response": "Password reset emails can sometimes land in spam or junk folders — please check there first. If it's not there, I can manually trigger a new reset link to your email or send it to an alternate address you provide.",
        "category": "Account Access",
        "response_time_ms": 920,
        "days_ago": 0,
    },
    {
        "user_message": "My account has been locked after too many login attempts. How do I get back in?",
        "bot_response": "Account lockouts reset automatically after 30 minutes as a security measure. If you need access sooner, I can unlock your account manually after verifying your identity. Can you confirm the email and last 4 digits of the payment card on file?",
        "category": "Account Access",
        "response_time_ms": 1120,
        "days_ago": 1,
    },
    {
        "user_message": "I'm trying to set up two-factor authentication but the QR code isn't loading.",
        "bot_response": "This is sometimes caused by browser extensions or security software blocking the QR code display. Try opening the MFA setup page in an incognito/private window. Alternatively, most authenticator apps also accept a manual setup code — I can show you where to find it.",
        "category": "Account Access",
        "response_time_ms": 1340,
        "days_ago": 2,
    },
    {
        "user_message": "I left my previous company and my old work email no longer works. How do I update my login email?",
        "bot_response": "To change your login email, go to Settings → Profile → Email Address and enter your new email. You'll receive a verification link at the new address. If you're completely locked out, please contact us with your account details and we'll update it securely.",
        "category": "Account Access",
        "response_time_ms": 1040,
        "days_ago": 3,
    },
    {
        "user_message": "A former employee still has admin access to our account. How do I revoke their permissions?",
        "bot_response": "You can manage team member access under Settings → Team → Members. Find the former employee, click on their name, and select 'Revoke Access' or change their role to 'None'. If you need help with this or the account owner has left, please reach out so we can assist securely.",
        "category": "Account Access",
        "response_time_ms": 1200,
        "days_ago": 5,
    },
    # Cancellation — 5 traces
    {
        "user_message": "I want to cancel my subscription immediately. We're no longer using the product.",
        "bot_response": "I'm sorry to hear you're leaving. I can process the cancellation right away. Your access will continue until the end of your current billing period. Would you like to share any feedback about why you're cancelling? We'd love to improve.",
        "category": "Cancellation",
        "response_time_ms": 1560,
        "days_ago": 0,
    },
    {
        "user_message": "I need to downgrade from the Business plan to the Starter plan. My team has shrunk and we can't justify the cost.",
        "bot_response": "No problem. I can downgrade your plan to Starter, effective at your next billing cycle. Note that you'll lose access to some Business-tier features like advanced analytics and priority support. Shall I go ahead with the downgrade?",
        "category": "Cancellation",
        "response_time_ms": 1380,
        "days_ago": 1,
    },
    {
        "user_message": "How do I close my account completely? I want all my data deleted.",
        "bot_response": "To close your account and request data deletion under GDPR/CCPA, go to Settings → Account → Close Account. Once confirmed, your data will be permanently deleted within 30 days. Please note this action is irreversible. Would you like me to walk you through the process?",
        "category": "Cancellation",
        "response_time_ms": 1720,
        "days_ago": 2,
    },
    {
        "user_message": "We're switching to a competitor. Can you cancel our annual plan and give us a prorated refund for the remaining months?",
        "bot_response": "I've noted your cancellation request. For annual plans, we typically do not offer prorated refunds after the first 14 days. However, I can escalate this to our retention team who may be able to review exceptions. Shall I do that?",
        "category": "Cancellation",
        "response_time_ms": 2200,
        "days_ago": 3,
    },
    {
        "user_message": "Can I pause my subscription for 2 months instead of cancelling? We're in a slow season.",
        "bot_response": "We do offer a subscription pause option for up to 3 months. Your billing will be paused and your data and settings will be preserved. You can activate the pause under Settings → Billing → Pause Subscription. Would you like me to walk you through it?",
        "category": "Cancellation",
        "response_time_ms": 1490,
        "days_ago": 4,
    },
    # General Inquiry — 4 traces
    {
        "user_message": "Does BillFlow integrate with QuickBooks?",
        "bot_response": "Yes! BillFlow has a native QuickBooks Online integration. You can set it up under Settings → Integrations → QuickBooks. It syncs invoices, payments, and customer records automatically. We also support Xero, FreshBooks, and Zapier for other accounting tools.",
        "category": "General Inquiry",
        "response_time_ms": 880,
        "days_ago": 1,
    },
    {
        "user_message": "How many team members can I add on the Pro plan?",
        "bot_response": "The Pro plan supports up to 25 team members. If you need more, our Business plan is unlimited, or we can arrange a custom Enterprise plan. Would you like information on what's included in Business?",
        "category": "General Inquiry",
        "response_time_ms": 740,
        "days_ago": 2,
    },
    {
        "user_message": "Is there an API I can use to pull invoice data into our internal dashboard?",
        "bot_response": "Absolutely. BillFlow has a full REST API with comprehensive documentation at docs.billflow.io/api. You can retrieve invoices, subscriptions, customers, and payments. API keys are generated in Settings → Developer → API Keys. Let me know if you need help getting started.",
        "category": "General Inquiry",
        "response_time_ms": 1050,
        "days_ago": 4,
    },
    {
        "user_message": "Do you have a mobile app?",
        "bot_response": "We currently have iOS and Android apps available for viewing invoices, approving payments, and managing your subscription on the go. You can find them by searching 'BillFlow' in the App Store or Google Play. Full editing features are available on our desktop web app.",
        "category": "General Inquiry",
        "response_time_ms": 670,
        "days_ago": 6,
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Trace).count()
        if existing > 0:
            print(f"Database already has {existing} traces. Skipping seed.")
            return

        now = datetime.now(timezone.utc)
        for i, data in enumerate(SEED_TRACES):
            trace = Trace(
                id=str(uuid.uuid4()),
                user_message=data["user_message"],
                bot_response=data["bot_response"],
                category=data["category"],
                timestamp=now - timedelta(days=data["days_ago"], hours=i % 8, minutes=i * 7),
                response_time_ms=data["response_time_ms"],
            )
            db.add(trace)

        db.commit()
        print(f"Seeded {len(SEED_TRACES)} traces successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
