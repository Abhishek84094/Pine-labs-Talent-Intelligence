"""Pine Labs Email Service — Shortlist Notification & Interview Invitations"""
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def build_shortlist_email_html(
    candidate_name: str,
    job_role: str,
    assessment_date: str,
    technical_date: str,
    hr_date: str,
    reference_id: str = "",
    custom_message: Optional[str] = None,
) -> str:
    """Build a branded, responsive HTML email for shortlisted candidates"""
    custom_block = ""
    if custom_message and custom_message.strip():
        custom_block = f"""
        <div style="background-color: #F8FAF7; border-left: 4px solid #D0F255; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #1E2D2F; line-height: 1.6; font-style: italic;">
                "{custom_message.strip()}"
            </p>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pine Labs — Application Shortlisted</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E2D2F;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F5F1; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,38,44,0.08); border: 1px solid #E2E8DE;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #00262C; padding: 32px 36px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #D0F255; color: #00262C; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
                      PINE LABS TALENT INTELLIGENCE
                    </div>
                    <h1 style="margin: 14px 0 0 0; color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 1.3;">
                      Congratulations, {candidate_name}!
                    </h1>
                    <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                      You have been shortlisted for <strong style="color: #D0F255;">{job_role}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <p style="font-size: 15px; line-height: 1.6; color: #1E2D2F; margin: 0 0 16px 0;">
                Dear <strong>{candidate_name}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #4A5D5E; margin: 0 0 20px 0;">
                Thank you for applying to Pine Labs and submitting your technical project for evaluation. Our engineering and talent evaluation team has thoroughly reviewed your resume, static project architecture, and code evaluation.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #1E2D2F; margin: 0 0 24px 0;">
                We were highly impressed with your technical capabilities and are pleased to invite you to the <strong>next phase of the Pine Labs engineering selection process</strong>.
              </p>

              {custom_block}

              <!-- Interview Schedule Card -->
              <div style="background-color: #F8FAF7; border: 1px solid #D8E2D2; border-radius: 8px; padding: 22px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #00262C; font-weight: 800;">
                  Your Upcoming Evaluation & Interview Schedule
                </h3>

                <!-- Stage 1 -->
                <div style="padding: 12px 0; border-bottom: 1px solid #E2E8DE;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="36" valign="top">
                        <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #00262C; color: #D0F255; font-size: 12px; font-weight: bold; text-align: center; line-height: 26px;">1</div>
                      </td>
                      <td>
                        <div style="font-size: 14px; font-weight: 700; color: #00262C;">Online Assessment (Coding & System Architecture)</div>
                        <div style="font-size: 13px; color: #13BBCA; font-weight: 600; margin-top: 3px;">Date: {assessment_date}</div>
                        <div style="font-size: 12px; color: #697E80; margin-top: 2px;">Duration: 90 Mins · Assessment link will be shared 24 hours prior</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Stage 2 -->
                <div style="padding: 12px 0; border-bottom: 1px solid #E2E8DE;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="36" valign="top">
                        <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #00262C; color: #D0F255; font-size: 12px; font-weight: bold; text-align: center; line-height: 26px;">2</div>
                      </td>
                      <td>
                        <div style="font-size: 14px; font-weight: 700; color: #00262C;">Round 1 — Technical Architecture Interview</div>
                        <div style="font-size: 13px; color: #13BBCA; font-weight: 600; margin-top: 3px;">Date: {technical_date}</div>
                        <div style="font-size: 12px; color: #697E80; margin-top: 2px;">Duration: 60 Mins · Live code review & discussion with a Senior Architect</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Stage 3 -->
                <div style="padding: 12px 0 4px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="36" valign="top">
                        <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #00262C; color: #D0F255; font-size: 12px; font-weight: bold; text-align: center; line-height: 26px;">3</div>
                      </td>
                      <td>
                        <div style="font-size: 14px; font-weight: 700; color: #00262C;">Round 2 — HR & Leadership Conversation</div>
                        <div style="font-size: 13px; color: #13BBCA; font-weight: 600; margin-top: 3px;">Date: {hr_date}</div>
                        <div style="font-size: 12px; color: #697E80; margin-top: 2px;">Duration: 45 Mins · Culture fit, team alignment, and growth vision</div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Important Notes -->
              <div style="background-color: #FFFFFF; border-left: 3px solid #13BBCA; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #4A5D5E; line-height: 1.5;">
                  <strong>Important:</strong> Please ensure you have a quiet environment, functional webcam, and your submitted project code accessible during the interview. Meeting invites with video links will follow shortly.
                </p>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #4A5D5E; margin: 0 0 24px 0;">
                If you have any scheduling conflicts, please reply directly to this email at least 24 hours in advance.
              </p>

              <p style="font-size: 14px; line-height: 1.5; color: #1E2D2F; margin: 0;">
                Warm regards,<br>
                <strong style="color: #00262C;">Pine Labs Talent Acquisition Team</strong><br>
                <span style="font-size: 12px; color: #697E80;">Reference ID: {reference_id or 'PL-CANDIDATE'}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #00262C; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6);">
                © {datetime.now().year} Pine Labs. Powering everyday commerce across Asia.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.4);">
                This is an automated communication sent from Pine Labs Talent Intelligence Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_shortlist_email_text(
    candidate_name: str,
    job_role: str,
    assessment_date: str,
    technical_date: str,
    hr_date: str,
    reference_id: str = "",
    custom_message: Optional[str] = None,
) -> str:
    """Build a plain-text fallback email"""
    custom = f"\nNote from Hiring Team:\n{custom_message.strip()}\n" if custom_message else ""
    return f"""PINE LABS TALENT INTELLIGENCE
Application Shortlisted: {job_role}

Dear {candidate_name},

Congratulations! We are delighted to inform you that your resume and technical project evaluation have been reviewed and shortlisted for the position of {job_role} at Pine Labs.
{custom}
Your upcoming interview and evaluation schedule:
1. Online Assessment: {assessment_date} (90 Mins - Coding & System Architecture)
2. Round 1 (Technical Interview): {technical_date} (60 Mins - Code Architecture & System Design)
3. Round 2 (HR & Leadership Round): {hr_date} (45 Mins - Culture Fit & Role Alignment)

Instructions:
- The assessment link and Google Meet invites will be shared prior to each round.
- Please have your submitted project code ready for discussion.
- If you have any questions or schedule adjustments, reply directly to this email.

Warm regards,
Pine Labs Talent Acquisition Team
Reference ID: {reference_id}
"""


async def send_interview_invitation(
    recipient_email: str,
    candidate_name: str,
    job_role: str,
    assessment_date: str,
    technical_date: str,
    hr_date: str,
    reference_id: str = "",
    custom_message: Optional[str] = None,
    subject: Optional[str] = None,
) -> Dict[str, any]:
    """
    Send interview shortlist email to candidate via Gmail SMTP.
    Raises on failure so the caller can surface the error to the UI.
    """
    email_subject = subject or f"Congratulations! You've been shortlisted for {job_role} at Pine Labs"

    html_content = build_shortlist_email_html(
        candidate_name=candidate_name,
        job_role=job_role,
        assessment_date=assessment_date,
        technical_date=technical_date,
        hr_date=hr_date,
        reference_id=reference_id,
        custom_message=custom_message,
    )

    text_content = build_shortlist_email_text(
        candidate_name=candidate_name,
        job_role=job_role,
        assessment_date=assessment_date,
        technical_date=technical_date,
        hr_date=hr_date,
        reference_id=reference_id,
        custom_message=custom_message,
    )

    if not (settings.smtp_host and settings.smtp_user and settings.smtp_password):
        raise RuntimeError(
            "SMTP is not configured. Please add SMTP_HOST, SMTP_USER, and SMTP_PASSWORD to backend/.env"
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = email_subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = recipient_email

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
    if settings.smtp_use_tls:
        server.starttls()
    server.login(settings.smtp_user, settings.smtp_password)
    server.sendmail(settings.smtp_from_email, recipient_email, msg.as_string())
    server.quit()

    logger.info(f"Shortlist email sent to {recipient_email} for {candidate_name}")
    return {
        "success": True,
        "delivery_mode": "smtp",
        "recipient": recipient_email,
        "candidate_name": candidate_name,
        "subject": email_subject,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "message": f"Invitation delivered to {recipient_email}",
    }

