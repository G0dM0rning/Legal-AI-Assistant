import os
import logging
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

# SMTP Configuration from .env
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER"),
    MAIL_PASSWORD=os.getenv("SMTP_PASS"),
    MAIL_FROM=os.getenv("SMTP_USER"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.gmail.com"),
    MAIL_STARTTLS=os.getenv("SMTP_TLS", "True").lower() == "true",
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(email: str, token: str):
    """
    Sends a real verification email to the user using fastapi-mail.
    """
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        verification_link = f"{frontend_url}/verify-email?token={token}"
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #3b82f6; text-align: center;">Welcome to LegalAI!</h2>
                <p>Hello,</p>
                <p>Thank you for registering with <strong>LegalAI</strong>. To complete your setup and ensure your account is secure, please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p style="font-size: 0.9em; color: #666;">If the button doesn't work, copy and paste the following link into your browser:</p>
                <p style="font-size: 0.8em; color: #3b82f6; word-break: break-all;">{verification_link}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 0.8em; color: #999; text-align: center;">If you did not request this, please ignore this email.</p>
                <p style="font-size: 0.8em; color: #999; text-align: center;">&copy; 2026 LegalAI Team</p>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="Verify Your LegalAI Account",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"✅ Real verification email sent to: {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send real verification email to {email}: {str(e)}")
        # Fallback to logging the link in development if sending fails
        logger.info(f"🔗 FALLBACK - Verification Link: {frontend_url}/verify-email?token={token}")
        return False

async def send_password_reset_email(email: str, token: str):
    """
    Sends a password reset email to the user.
    """
    try:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #3b82f6; text-align: center;">Reset Your LegalAI Password</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your <strong>LegalAI</strong> account. Click the button below to choose a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>This link will expire in 1 hour.</p>
                <p style="font-size: 0.9em; color: #666;">If you didn't mean to reset your password, then you can just ignore this email; your password will not change.</p>
                <p style="font-size: 0.8em; color: #3b82f6; word-break: break-all;">{reset_link}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 0.8em; color: #999; text-align: center;">&copy; 2026 LegalAI Team</p>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="Reset Your LegalAI Password",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"✅ Password reset email sent to: {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email to {email}: {str(e)}")
        logger.info(f"🔗 FALLBACK - Reset Link: {frontend_url}/reset-password?token={token}")
        return False
