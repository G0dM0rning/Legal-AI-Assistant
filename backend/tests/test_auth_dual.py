import sys
import os
import asyncio
from unittest.mock import MagicMock
from jose import jwt

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.auth import get_current_user, SECRET_KEY, ALGORITHM
from app.database import get_settings_collection
from fastapi import Request, HTTPException

async def test_dual_auth():
    print("[INFO] Testing Dual Auth (User/Admin) in get_current_user...")
    
    # 0. Get Secret from DB
    secret_key = SECRET_KEY
    try:
        settings = get_settings_collection().find_one({})
        if settings and "jwt_secret_key" in settings:
            secret_key = settings["jwt_secret_key"]
            print(f"[INFO] Using DB Secret: {secret_key[:8]}...")
    except Exception:
        print("[WARN] Could not fetch DB secret, using default.")

    # 1. Mock Admin Token
    admin_payload = {
        "sub": "babarrizwan639@gmail.com",
        "type": "admin",
        "iat": 1900000000
    }
    admin_token = jwt.encode(admin_payload, secret_key, algorithm=ALGORITHM)
    
    request = MagicMock(spec=Request)
    request.cookies = {"access_token": admin_token}
    
    print("[TEST] Calling get_current_user with ADMIN token...")
    try:
        user = await get_current_user(request, token=None)
        print(f"[SUCCESS] Auth passed for Admin: {user.get('email')} (Type: {admin_payload['type']})")
    except HTTPException as e:
        print(f"[FAIL] Auth failed for Admin: {e.status_code} - {e.detail}")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {token} {e}")

    # 2. Mock regular User Token (if we have one in DB)
    # Since I don't know a user email offhand, I'll just check if it correctly switches collections
    user_payload = {
        "sub": "unknown_user@example.com",
        "type": "user",
        "iat": 1900000000
    }
    user_token = jwt.encode(user_payload, secret_key, algorithm=ALGORITHM)
    request.cookies = {"access_token": user_token}
    
    print("\n[TEST] Calling get_current_user with USER token (expecting 401 if user doesn't exist)...")
    try:
        await get_current_user(request, token=None)
    except HTTPException as e:
        if e.status_code == 401:
            print("[SUCCESS] Correctly failed with 401 for non-existent user (expected).")
        else:
            print(f"[FAIL] Unexpected HTTP status: {e.status_code}")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(test_dual_auth())
