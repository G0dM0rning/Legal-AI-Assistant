# main.py - LegalAI Backend Entry Point
import os
import logging
import uvicorn
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import json

# Fix OpenMP DLL conflict - MUST BE AT THE VERY TOP
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
import asyncio

# FastAPI imports
from fastapi import FastAPI, UploadFile, File, Form, Depends, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import models from our modules
from app.models import APIResponse
from app.database import is_database_connected, get_training_collection
from app.routes import router as api_router, get_current_admin
from app.document_handler import ingest_pdf

# ========================
# Configuration
# ========================

load_dotenv()

# Directory Paths
VECTOR_STORE_PATH = Path("data/vector_store")
UPLOAD_FOLDER = Path("data/uploads")
LOG_DIR = Path("data/logs")

# API Constants
API_KEY_NAME = "X-API-Key"
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
if not ADMIN_API_KEY:
    logging.warning("⚠️ ADMIN_API_KEY not set in environment. Admin upload endpoint will be disabled.")

# ========================
# Application Lifespan
# ========================

@asynccontextmanager
async def lifespan(app):
    """Professional Application Lifespan - Handles startup and graceful shutdown"""
    # ========================
    # Startup Sequence
    # ========================
    try:
        logging.info("🚀 [SYSTEM] Initializing LegalAI Professional Services...")
        
        # 1. Database Connection (High Priority)
        from app.database import db_manager, is_database_connected
        await db_manager.connect()
        
        if is_database_connected():
            logging.info("✅ [DATABASE] Connection Status: CONNECTED")
        else:
            logging.error("❌ [DATABASE] Connection Status: DISCONNECTED")
            logging.warning("⚠️  [SYSTEM] Running in restricted mode - database-dependent features will be offline.")
        
        # 2. AI Infrastructure Check
        try:
            from app.config import ai_provider
            provider_info = ai_provider.get_provider_info()
            logging.info(f"✅ [AI] Intelligence: {provider_info['llm']['type']} | Embeddings: {provider_info['embeddings']['type']}")
        except Exception as e:
            logging.warning(f"⚠️  [AI] Provider Initialization: {e}")
        
        # 3. Vector Knowledge Base Verification
        try:
            from app.config import load_vector_store
            store = load_vector_store()
            doc_count = len(store.index_to_docstore_id) if store else 0
            logging.info(f"✅ [MEMORY] Vector Store: {doc_count} documents indexed")
        except Exception as e:
            logging.warning(f"⚠️  [MEMORY] Vector Store Load: {e}")
        
        logging.info("✨ [SYSTEM] LegalAI is now online and ready for processing.")
        
    except Exception as e:
        logging.error(f"💥 [SYSTEM] Fatal Startup Error: {e}")
    
    #yield # Standard yield replaced with a more robust version
    try:
        yield
    except asyncio.exceptions.CancelledError:
        # Standard Uvicorn cancellation during shutdown
        pass
    except KeyboardInterrupt:
        # User manual interruption
        pass
    finally:
        # ========================
        # Shutdown Sequence
        # ========================
        logging.info("🧹 [SYSTEM] LegalAI Professional Services shutting down...")
        # Add any cleanup logic here if needed (e.g., closing DB clients)

# ========================
# FastAPI Application (single instance)
# ========================

app = FastAPI(
    title="LegalAI API",
    description="Backend API for LegalAI application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - Professional Configuration
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173").split(",")
origins = [origin.strip() for origin in raw_origins if origin.strip()]

# Regex to allow any local development origin (localhost, 127.x, 172.x, 192.x) on common ports
# Required for WSL2 and LAN testing where the "Origin" IP changes
dev_origin_regex = r"http://(localhost|127\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+):[0-9]+"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=dev_origin_regex if os.getenv("ENVIRONMENT") != "production" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router WITHOUT prefix to match frontend routes
app.include_router(api_router)

# ========================
# API Key Authentication (ONLY for legacy endpoints)
# ========================

api_key_scheme = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def validate_api_key(api_key: str = Depends(api_key_scheme)):
    """Validate admin API key - ONLY for specific endpoints that need it"""
    if not api_key or not ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key is missing or not configured. Please include X-API-Key header."
        )
    
    if api_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key. Please check your API key."
        )
    
    return api_key

# ========================
# Error Handlers
# ========================

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"success": False, "message": "Too many requests. Limit: 5/minute", "data": None}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "data": None}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error", "data": None}
    )

# ========================
# Core API Endpoints
# ========================

@app.get("/system/status")
async def get_system_status():
    """Detailed system status endpoint"""
    try:
        from app.config import get_system_status as get_config_status
        status = get_config_status()
        return {
            "success": True,
            "message": "System status retrieved successfully",
            "data": status
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Failed to retrieve system status: {str(e)}",
                "data": None
            }
        )

@app.get("/")
async def root():
    """Root endpoint"""
    try:
        from app.config import load_vector_store, ai_provider
        store = load_vector_store()
        doc_count = len(store.index_to_docstore_id) if store else 0
        provider_info = ai_provider.get_provider_info()
        embedding_backend = provider_info["embeddings"]["type"]
    except Exception as e:
        doc_count = 0
        embedding_backend = "unknown"
    
    return {
        "success": True,
        "message": "LegalAI API Server is running",
        "data": {
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "embedding_backend": embedding_backend,
            "vector_store_documents": doc_count,
            "database_status": "connected" if is_database_connected() else "disconnected",
            "available_endpoints": {
                "system_status": "GET /system/status",
                "user_registration": "POST /register",
                "user_login": "POST /login",
                "chat": "POST /chat",
                "admin_upload": "POST /admin/upload"
            }
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "success": True,
        "message": "Service is healthy",
        "data": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database_status": "connected" if is_database_connected() else "disconnected",
        }
    }

# ========================
# Document Processing Endpoints
# ========================

@app.post("/admin/upload")
async def admin_upload(
    file: UploadFile,
    doc_type: str = Form(...),
    source_name: Optional[str] = Form(None),
    api_key: str = Depends(validate_api_key)
):
    """Upload endpoint using API key auth"""
    try:
        # Ensure uploads directory exists
        os.makedirs("data/uploads", exist_ok=True)
        
        file_path = os.path.join("data/uploads", file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Use document_handler.py for processing
        result = ingest_pdf(file_path, doc_type=doc_type, source_name=source_name)
        
        if result["status"] != "success":
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "message": result.get("message", "Document processing failed"),
                    "data": None
                }
            )
            
        return JSONResponse(
            content={
                "success": True,
                "message": "Document uploaded successfully",
                "data": {
                    "filename": file.filename,
                    "chunk_count": result.get("count", 0),
                    "document_type": doc_type,
                    "source": source_name or "Unknown",
                    "processing_time": result.get("processing_time", "N/A"),
                }
            }
        )
    
    except Exception as e:
        logging.error(f"Upload failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Document processing failed: {str(e)}",
                "data": None
            }
        )

# All other endpoints are handled by app.routes.api_router

# ========================
# Server Startup
# ========================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
