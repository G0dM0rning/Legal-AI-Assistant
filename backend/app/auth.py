# app/auth.py - Shared authentication utilities
import os
import logging
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

from .database import get_users_collection, get_admins_collection, get_settings_collection

load_dotenv()
logger = logging.getLogger(__name__)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "legal-ai-secret-key-2024-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Admin configurations
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "legal-ai-admin-secret-2024")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ========================
# Password Utilities
# ========================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    try:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"Password hashing failed: {str(e)}")
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Password verification failed: {str(e)}")
        return False


# ========================
# JWT Token Utilities
# ========================

async def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token (Async)"""
    try:
        to_encode = data.copy()
        now = datetime.utcnow()
        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=15)
        
        to_encode.update({
            "exp": expire,
            "iat": now.timestamp()
        })
        
        secret_key = SECRET_KEY
        try:
            settings_collection = await get_settings_collection()
            settings = await settings_collection.find_one({})
            if settings and "jwt_secret_key" in settings:
                secret_key = settings["jwt_secret_key"]
        except Exception:
            pass
            
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create access token"
        )


# ========================
# Dependency Functions
# ========================

async def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    """Get current user from JWT token or HttpOnly Cookie (Async)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = token or request.cookies.get("access_token")
    if not token:
        raise credentials_exception

    try:
        secret_key = SECRET_KEY
        revoke_before = 0
        try:
            settings_collection = await get_settings_collection()
            settings = await settings_collection.find_one({})
            if settings:
                secret_key = settings.get("jwt_secret_key", SECRET_KEY)
                dt = settings.get("revoke_all_before")
                revoke_before = dt.timestamp() if dt and dt.year > 1970 else 0
        except Exception:
            pass
            
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("type", "user")
        iat = payload.get("iat", 0)
        
        if email is None or iat < revoke_before:
            raise credentials_exception
        
        if user_type in ["admin", "super_admin"]:
            collection = await get_admins_collection()
        else:
            collection = await get_users_collection()
            
        user = await collection.find_one({"email": email})
        
        if user is None or not user.get("is_active", True):
            raise credentials_exception
        
        user["id"] = str(user["_id"])
        return user
        
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise credentials_exception
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}", exc_info=True)
        raise credentials_exception

async def get_current_admin(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    """Get current admin from JWT token or HttpOnly Cookie (Async)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = token or request.cookies.get("access_token")
    if not token:
        raise credentials_exception

    try:
        secret_key = SECRET_KEY
        revoke_before = 0
        try:
            settings_collection = await get_settings_collection()
            settings = await settings_collection.find_one({})
            if settings:
                secret_key = settings.get("jwt_secret_key", SECRET_KEY)
                dt = settings.get("revoke_all_before")
                revoke_before = dt.timestamp() if dt and hasattr(dt, 'year') and dt.year > 1970 else 0
        except Exception:
            pass
            
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("type", "user")
        iat = payload.get("iat", 0)
        
        if email is None or user_type not in ["admin", "super_admin"] or iat < revoke_before:
            raise credentials_exception
        
        admins_collection = await get_admins_collection()
        admin = await admins_collection.find_one({"email": email})
        
        if admin is None or not admin.get("is_active", True):
            raise credentials_exception
        
        admin["id"] = str(admin["_id"])
        return admin
        
    except JWTError as e:
        logger.error(f"Admin JWT error: {str(e)}")
        raise credentials_exception
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_admin: {str(e)}", exc_info=True)
        raise credentials_exception
