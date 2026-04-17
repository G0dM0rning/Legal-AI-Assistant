import sys
import os
import asyncio
from unittest.mock import MagicMock

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.auth import get_current_admin
from fastapi import Request, HTTPException

async def repro():
    print("[INFO] Reproducing auth error...")
    request = MagicMock(spec=Request)
    request.cookies = {"access_token": "invalid_token"}
    
    try:
        # This should fail because token is invalid, but we want to see if it logs an "Unexpected error"
        await get_current_admin(request, token=None)
    except HTTPException as e:
        print(f"[EXPECTED] Caught HTTPException: {e.status_code} - {e.detail}")
    except Exception as e:
        print(f"[UNEXPECTED] Caught {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(repro())
