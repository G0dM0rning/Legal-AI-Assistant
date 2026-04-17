# app/routes.py - Aggregator that includes all sub-routers
# This file was refactored from a monolithic 1408-line file into modular sub-routers.
from fastapi import APIRouter

from .auth_routes import router as auth_router
from .admin_routes import router as admin_router
from .chat_routes import router as chat_router
from .support_routes import router as support_router
from .settings_routes import router as settings_router

# Re-export dependencies used by main.py
from .auth import get_current_admin, get_current_user

router = APIRouter()

# Include all sub-routers
router.include_router(auth_router)
router.include_router(admin_router)
router.include_router(chat_router)
router.include_router(support_router)
router.include_router(settings_router)
