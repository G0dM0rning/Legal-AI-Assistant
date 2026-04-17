# app/settings_routes.py - System settings and security endpoints
import logging
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends

from .models import APIResponse, SystemSettings
from .auth import get_current_admin
from .database import get_settings_collection

logger = logging.getLogger(__name__)
router = APIRouter()


# ========================
# SYSTEM SETTINGS
# ========================

@router.get("/admin/settings", response_model=APIResponse)
async def get_system_settings(admin: dict = Depends(get_current_admin)):
    """Admin endpoint to fetch global system settings"""
    try:
        settings_collection = await get_settings_collection()
        settings = await settings_collection.find_one({})
        
        if not settings:
            # Initialize with defaults if empty
            default_settings = SystemSettings().dict()
            await settings_collection.insert_one(default_settings)
            settings = default_settings
            
        if "_id" in settings:
            settings["id"] = str(settings["_id"])
            del settings["_id"]
            
        return APIResponse(success=True, message="Settings fetched", data=settings)
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        return APIResponse(success=False, message="Failed to fetch settings")

@router.patch("/admin/settings", response_model=APIResponse)
async def update_system_settings(settings_update: dict, admin: dict = Depends(get_current_admin)):
    """Admin endpoint to update global system settings"""
    try:
        settings_collection = await get_settings_collection()
        settings_update["updated_at"] = datetime.utcnow()
        
        result = await settings_collection.update_one(
            {}, 
            {"$set": settings_update},
            upsert=True
        )
        
        logger.info(f"⚙️ System settings updated by admin: {admin['email']}")
        return APIResponse(success=True, message="Settings updated successfully")
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        return APIResponse(success=False, message="Failed to update settings")


# ========================
# SECURITY MANAGEMENT
# ========================

@router.post("/admin/security/rotate-key", response_model=APIResponse)
async def rotate_secret_key(admin: dict = Depends(get_current_admin)):
    """Admin endpoint to rotate the JWT master secret key"""
    try:
        settings_collection = await get_settings_collection()
        new_key = secrets.token_urlsafe(32)
        
        await settings_collection.update_one(
            {},
            {"$set": {"jwt_secret_key": new_key, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        
        logger.warning(f"🔑 Master secret key ROTATED by admin: {admin['email']}")
        return APIResponse(success=True, message="Master secret key rotated. All new tokens will use the new key.")
    except Exception as e:
        logger.error(f"Error rotating key: {str(e)}")
        return APIResponse(success=False, message="Failed to rotate secret key")

@router.post("/admin/security/revoke-sessions", response_model=APIResponse)
async def revoke_all_sessions(admin: dict = Depends(get_current_admin)):
    """Admin endpoint to invalidate all current tokens"""
    try:
        settings_collection = await get_settings_collection()
        now = datetime.utcnow()
        
        await settings_collection.update_one(
            {},
            {"$set": {"revoke_all_before": now, "updated_at": now}},
            upsert=True
        )
        
        logger.warning(f"🚫 ALL SESSIONS REVOKED by admin: {admin['email']}")
        return APIResponse(success=True, message="All current sessions have been revoked.")
    except Exception as e:
        logger.error(f"Error revoking sessions: {str(e)}")
        return APIResponse(success=False, message="Failed to revoke sessions")
