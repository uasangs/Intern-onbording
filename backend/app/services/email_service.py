from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


async def send_portal_link_email(
    to_email: str,
    candidate_name: str,
    portal_url: str,
    role_title: str,
    location: str,
    start_date: str,
):
    subject = f"Internship Offer - {settings.COMPANY_NAME} | Action Required"
    body = f"""
Dear {candidate_name or 'Candidate'},

Congratulations! You have been selected for an Internship at {settings.COMPANY_NAME} ({settings.COMPANY_DIVISION}).

Role: {role_title}
Location: {location}
Start Date: {start_date}

Please complete your onboarding by clicking the link below:

{portal_url}

This link will allow you to:
- View and accept your offer letter
- Submit your personal and academic details
- Upload required documents (ID proof, bank details)
- Sign Annexure A & B (Terms & Conditions)

The link is valid for {settings.PORTAL_TOKEN_EXPIRE_DAYS} days.

For any queries, please contact us at {settings.MAIL_FROM}

Regards,
{settings.HR_HEAD_NAME}
{settings.HR_HEAD_TITLE}
{settings.COMPANY_NAME} - {settings.COMPANY_DIVISION}
    """
    await _send_email(to_email, subject, body)


async def send_offer_email(
    to_email: str,
    candidate_name: str,
    portal_url: str,
    offer_pdf_url: str,
):
    subject = f"Offer Letter - {settings.COMPANY_NAME}"
    body = f"""
Dear {candidate_name or 'Candidate'},

Your offer letter has been generated. Please log in to your portal to review and accept it.

Portal Link: {portal_url}

Please accept or decline the offer through the portal.

Regards,
{settings.HR_HEAD_NAME}
{settings.HR_HEAD_TITLE}
{settings.COMPANY_NAME} - {settings.COMPANY_DIVISION}
    """
    await _send_email(to_email, subject, body)


async def send_docs_rejected_email(to_email: str, candidate_name: str, portal_url: str):
    subject = "Action Required - Document Resubmission"
    body = f"""
Dear {candidate_name or 'Candidate'},

Some of your uploaded documents require resubmission. Please log into your portal and re-upload the documents.

Portal Link: {portal_url}

Regards,
{settings.HR_HEAD_NAME}
{settings.COMPANY_NAME} - {settings.COMPANY_DIVISION}
    """
    await _send_email(to_email, subject, body)


async def send_certificate_email(to_email: str, candidate_name: str, cert_url: str):
    subject = f"Experience Certificate - {settings.COMPANY_NAME}"
    body = f"""
Dear {candidate_name or 'Candidate'},

Congratulations on successfully completing your internship at {settings.COMPANY_NAME} ({settings.COMPANY_DIVISION}).

Your experience certificate is ready. Please download it from the link below:

{cert_url}

We wish you all the best in your future endeavors.

Regards,
{settings.HR_HEAD_NAME}
{settings.HR_HEAD_TITLE}
{settings.COMPANY_NAME} - {settings.COMPANY_DIVISION}
    """
    await _send_email(to_email, subject, body)


async def _send_email(to: str, subject: str, body: str):
    """
    Send email via SMTP.
    In production: configure MAIL_USERNAME, MAIL_PASSWORD, MAIL_SERVER in .env
    In development: logs the email to console.
    """
    try:
        if not settings.MAIL_USERNAME:
            logger.info(f"[DEV EMAIL] To: {to}\nSubject: {subject}\n{body}")
            return

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            if settings.MAIL_TLS:
                server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to, msg.as_string())

        logger.info(f"Email sent to {to}: {subject}")

    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
