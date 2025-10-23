import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import logging

from app.worker import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.send_email")
def send_password_reset_email(email: str, reset_token: str, user_name: str = None) -> Dict[str, Any]:
    """
    Send password reset email to user.
    
    Args:
        email: User's email address
        reset_token: Password reset token
        user_name: User's name (optional)
    
    Returns:
        Dict with send status
    """
    
    try:
        # Create email content
        subject = "Reset your Naura password"
        
        # HTML email template
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset your Naura password</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                <h1 style="color: #333; margin-bottom: 20px;">Reset your password</h1>
                
                {"<p>Hi " + user_name + ",</p>" if user_name else "<p>Hi,</p>"}
                
                <p style="color: #666; line-height: 1.6;">
                    You requested a password reset for your Naura account. 
                    Click the button below to reset your password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://app.naura.com/reset-password?token={reset_token}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>
                
                <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; 
                          word-break: break-all; color: #495057; font-size: 14px;">
                    https://app.naura.com/reset-password?token={reset_token}
                </p>
                
                <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                    This link will expire in 1 hour for security reasons.
                </p>
                
                <p style="color: #666; line-height: 1.6;">
                    If you didn't request this password reset, you can safely ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This email was sent by Naura Personal CRM<br>
                    © 2025 Naura. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text fallback
        text_body = f"""
        Reset your Naura password
        
        {"Hi " + user_name + "," if user_name else "Hi,"}
        
        You requested a password reset for your Naura account.
        
        Click this link to reset your password:
        https://app.naura.com/reset-password?token={reset_token}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, you can safely ignore this email.
        
        --
        Naura Personal CRM
        """
        
        # Send email
        success = _send_email(
            to_email=email,
            subject=subject,
            text_body=text_body,
            html_body=html_body
        )
        
        if success:
            logger.info(f"Password reset email sent successfully to {email}")
            return {
                "status": "sent",
                "email": email,
                "message": "Password reset email sent successfully"
            }
        else:
            logger.error(f"Failed to send password reset email to {email}")
            return {
                "status": "failed",
                "email": email,
                "message": "Failed to send email"
            }
            
    except Exception as exc:
        logger.error(f"Error sending password reset email to {email}: {exc}")
        return {
            "status": "error",
            "email": email,
            "error": str(exc)
        }


def _send_email(to_email: str, subject: str, text_body: str, html_body: str = None) -> bool:
    """
    Send email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        text_body: Plain text body
        html_body: HTML body (optional)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    
    # Check if email configuration is available
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning("Email configuration not complete - skipping email send")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email
        
        # Add text part
        text_part = MIMEText(text_body, "plain")
        msg.attach(text_part)
        
        # Add HTML part if provided
        if html_body:
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)
        
        # Connect to SMTP server and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        logger.error(f"SMTP error sending email to {to_email}: {e}")
        return False


@celery_app.task(name="app.tasks.send_welcome_email")
def send_welcome_email(email: str, user_name: str) -> Dict[str, Any]:
    """
    Send welcome email to new user.
    """
    
    try:
        subject = "Welcome to Naura Personal CRM!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to Naura</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                <h1 style="color: #333; margin-bottom: 20px;">Welcome to Naura!</h1>
                
                <p>Hi {user_name},</p>
                
                <p style="color: #666; line-height: 1.6;">
                    Welcome to Naura Personal CRM! We're excited to help you manage and nurture 
                    your professional relationships.
                </p>
                
                <h2 style="color: #333; margin-top: 30px;">Getting Started</h2>
                
                <ul style="color: #666; line-height: 1.8;">
                    <li>Connect your social media accounts (LinkedIn, Google, Facebook)</li>
                    <li>Import your existing contacts</li>
                    <li>Add custom tags and notes to organize your network</li>
                    <li>Start building meaningful professional relationships</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://app.naura.com/dashboard" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    If you have any questions, feel free to reach out to our support team.
                </p>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    This email was sent by Naura Personal CRM<br>
                    © 2025 Naura. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to Naura Personal CRM!
        
        Hi {user_name},
        
        Welcome to Naura! We're excited to help you manage and nurture your professional relationships.
        
        Getting Started:
        - Connect your social media accounts (LinkedIn, Google, Facebook)
        - Import your existing contacts
        - Add custom tags and notes to organize your network
        - Start building meaningful professional relationships
        
        Visit your dashboard: https://app.naura.com/dashboard
        
        If you have any questions, feel free to reach out to our support team.
        
        --
        Naura Personal CRM
        """
        
        success = _send_email(email, subject, text_body, html_body)
        
        return {
            "status": "sent" if success else "failed",
            "email": email
        }
        
    except Exception as exc:
        logger.error(f"Error sending welcome email to {email}: {exc}")
        return {
            "status": "error",
            "email": email,
            "error": str(exc)
        }