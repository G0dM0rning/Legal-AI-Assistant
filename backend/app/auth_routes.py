# app/auth_routes.py - User authentication endpoints
import os
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from .models import (
    UserRegister, UserLogin, APIResponse,
    VerificationRequest, ResendVerificationRequest,
    ForgotPasswordRequest, ResetPasswordRequest
)
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .email_utils import send_verification_email, send_password_reset_email
from .database import get_users_collection, is_database_connected

logger = logging.getLogger(__name__)
router = APIRouter()


# ========================
# USER REGISTRATION & LOGIN
# ========================

@router.post("/register", response_model=APIResponse)
async def register(user: UserRegister):
    """Register a new user - matches frontend /register"""
    try:
        users_collection = await get_users_collection()
        
        # Enforce Gmail-only registration
        if not user.email.lower().endswith("@gmail.com"):
            logger.warning(f"❌ Registration rejected - non-gmail email: {user.email}")
            return APIResponse(
                success=False,
                message="Only valid @gmail.com accounts are allowed for registration"
            )
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            logger.warning(f"❌ Email already registered: {user.email}")
            return APIResponse(success=False, message="Email already registered")

        # Create new user
        verification_token = secrets.token_urlsafe(32)
        new_user = {
            "name": user.name,
            "email": user.email,
            "password": hash_password(user.password),
            "created_at": datetime.utcnow(),
            "is_active": True,
            "is_verified": False,
            "verification_token": verification_token,
            "role": "user",
            "last_login": None
        }

        # Save to database
        result = await users_collection.insert_one(new_user)
        
        # Send verification email
        await send_verification_email(user.email, verification_token)
        
        logger.info(f"✅ User registered (pending verification): {user.email}")
        return APIResponse(
            success=True,
            message="Registration successful! Please check your email to verify your account.",
            data={"email": user.email}
        )
        
    except Exception as e:
        logger.error(f"💥 REGISTER error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message=f"Registration failed: {str(e)}")

@router.post("/login", response_model=APIResponse)
async def login(user: UserLogin, request: Request):
    """User login - matches frontend /login"""
    try:
        logger.info(f"🔐 LOGIN attempt for: {user.email}")
        
        users_collection = await get_users_collection()
        db_user = await users_collection.find_one({"email": user.email})
        
        if not db_user:
            logger.warning(f"❌ Login failed - user not found: {user.email}")
            return APIResponse(success=False, message="Invalid email or password")

        # Verify password
        if not verify_password(user.password, db_user["password"]):
            logger.warning(f"❌ Login failed - incorrect password for: {user.email}")
            return APIResponse(success=False, message="Invalid email or password")

        # Check if user is active
        if not db_user.get("is_active", True):
            logger.warning(f"❌ Login failed - inactive account: {user.email}")
            return APIResponse(success=False, message="Account is deactivated")

        # Check if user is verified
        if not db_user.get("is_verified", False):
            logger.warning(f"❌ Login blocked - email not verified: {user.email}")
            return APIResponse(
                success=False,
                message="Please verify your email address before logging in.",
                data={"unverified": True, "email": user.email}
            )

        # Update last login
        await users_collection.update_one(
            {"_id": db_user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = await create_access_token(
            data={"sub": db_user["email"], "type": "user"},
            expires_delta=access_token_expires
        )
        
        logger.info(f"✅ User logged in successfully: {user.email}")
        
        # Build JSON response
        response_data = APIResponse(
            success=True,
            message="Login successful",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user_type": "user",
                "user": {
                    "id": str(db_user["_id"]),
                    "name": db_user["name"],
                    "email": db_user["email"],
                    "role": db_user.get("role", "user")
                }
            }
        )
        
        # Set HttpOnly Cookie for enhanced security
        response = JSONResponse(content=response_data.dict())
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=os.getenv('ENVIRONMENT', 'development') == 'production',
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        return response
        
    except Exception as e:
        logger.error(f"💥 LOGIN error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message=f"Login failed: {str(e)}")

@router.get("/auth/validate", response_model=APIResponse)
async def validate_token(current_user: dict = Depends(get_current_user)):
    """Validate JWT token and return user details"""
    try:
        return APIResponse(
            success=True,
            message="Token is valid",
            data={
                "user": {
                    "id": current_user["id"],
                    "name": current_user["name"],
                    "email": current_user["email"],
                    "role": current_user.get("role", "user")
                }
            }
        )
    except Exception as e:
        logger.error(f"💥 Auth validation error: {str(e)}")
        return APIResponse(success=False, message="Authentication failed")


# ========================
# SECURE LOGOUT
# ========================

@router.post("/logout", response_model=APIResponse)
async def logout():
    """Securely log out by clearing the HttpOnly cookie"""
    response = JSONResponse(content={"success": True, "message": "Logged out successfully", "data": None})
    response.delete_cookie(key="access_token", path="/")
    return response


# ========================
# EMAIL VERIFICATION & PASSWORD RESET
# ========================

@router.post("/verify-email", response_model=APIResponse)
async def verify_email(req: VerificationRequest):
    """Verify user email using token"""
    try:
        users_collection = await get_users_collection()
        user = await users_collection.find_one({"verification_token": req.token})
        
        if not user:
            return APIResponse(success=False, message="Invalid or expired verification token")
            
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"is_verified": True},
                "$unset": {"verification_token": ""}
            }
        )
        
        return APIResponse(success=True, message="Email verified successfully! You can now login.")
    except Exception as e:
        return APIResponse(success=False, message=str(e))

@router.post("/resend-verification", response_model=APIResponse)
async def resend_verification(req: ResendVerificationRequest):
    """Resend user verification email"""
    try:
        users_collection = await get_users_collection()
        user = await users_collection.find_one({"email": req.email})
        
        if not user:
            return APIResponse(success=False, message="User not found")
            
        if user.get("is_verified", False):
            return APIResponse(success=False, message="Email is already verified")
            
        new_token = secrets.token_urlsafe(32)
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"verification_token": new_token}}
        )
        await send_verification_email(user["email"], new_token)
        
        return APIResponse(success=True, message="Verification email resent. Please check your inbox.")
    except Exception as e:
        return APIResponse(success=False, message=str(e))

@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(req: ForgotPasswordRequest):
    """Initiate password reset via email"""
    try:
        users_collection = await get_users_collection()
        user = await users_collection.find_one({"email": req.email})
        
        if not user:
            return APIResponse(
                success=True, 
                message="If this email is registered, you will receive a reset link shortly."
            )
            
        # Generate reset token and expiry (1 hour)
        reset_token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(hours=1)
        
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_token": reset_token,
                    "reset_token_expiry": expiry
                }
            }
        )
        
        await send_password_reset_email(user["email"], reset_token)
        
        return APIResponse(
            success=True, 
            message="If this email is registered, you will receive a reset link shortly."
        )
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return APIResponse(success=False, message="An error occurred while processing your request.")

@router.post("/reset-password", response_model=APIResponse)
async def reset_password(req: ResetPasswordRequest):
    """Complete password reset using token"""
    try:
        users_collection = await get_users_collection()
        
        # Find user with matching token and unexpired
        user = await users_collection.find_one({
            "reset_token": req.token,
            "reset_token_expiry": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            return APIResponse(
                success=False, 
                message="Invalid or expired reset token. Please request a new one."
            )
            
        # Update password and clear token
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hash_password(req.password)},
                "$unset": {"reset_token": "", "reset_token_expiry": ""}
            }
        )
        
        logger.info(f"✅ Password reset success for user: {user['email']}")
        return APIResponse(success=True, message="Password reset successfully! You can now login.")
        
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        return APIResponse(success=False, message=f"Failed to reset password: {str(e)}")
