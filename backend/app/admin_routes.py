# app/admin_routes.py - Admin management endpoints
import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from bson import ObjectId

from .models import UserLogin, AdminRegister, APIResponse
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES, ADMIN_SECRET_KEY
)
from .database import (
    get_users_collection, get_admins_collection,
    get_training_collection, is_database_connected
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ========================
# ADMIN AUTH
# ========================

@router.post("/admin/signup", response_model=APIResponse)
async def admin_signup(admin: AdminRegister):
    """Admin registration - matches frontend /admin/signup"""
    try:
        logger.info(f"👑 ADMIN SIGNUP attempt for: {admin.email}")
        
        # Verify admin secret key
        if admin.secret_key != ADMIN_SECRET_KEY:
            logger.warning(f"❌ Invalid admin secret key attempt: {admin.secret_key}")
            return APIResponse(success=False, message="Invalid admin secret key")
        
        admins_collection = await get_admins_collection()
        
        # Check if admin already exists
        existing_admin = await admins_collection.find_one({"email": admin.email})
        if existing_admin:
            logger.warning(f"❌ Email already registered as admin: {admin.email}")
            return APIResponse(success=False, message="Email already registered as admin")
        
        # Create admin user
        new_admin = {
            "name": admin.name,
            "email": admin.email,
            "password": hash_password(admin.password),
            "is_active": True,
            "role": "admin",
            "created_at": datetime.utcnow(),
            "last_login": None
        }
        
        result = await admins_collection.insert_one(new_admin)
        admin_id = str(result.inserted_id)
        
        logger.info(f"✅ Admin registered successfully: {admin.email}")
        return APIResponse(
            success=True,
            message="Admin account created successfully",
            data={
                "admin": {
                    "id": admin_id,
                    "name": admin.name,
                    "email": admin.email,
                    "role": "admin"
                }
            }
        )
        
    except Exception as e:
        logger.error(f"💥 ADMIN SIGNUP error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message=f"Admin registration failed: {str(e)}")

@router.post("/admin/signin", response_model=APIResponse)
async def admin_signin(admin: UserLogin):
    """Admin login - matches frontend /admin/signin"""
    try:
        logger.info(f"👑 ADMIN SIGNIN attempt for: {admin.email}")
        
        admins_collection = await get_admins_collection()
        db_admin = await admins_collection.find_one({"email": admin.email})
        
        if not db_admin:
            logger.warning(f"❌ Admin login failed - admin not found: {admin.email}")
            return APIResponse(success=False, message="Invalid email or password")

        # Verify password
        if not verify_password(admin.password, db_admin["password"]):
            logger.warning(f"❌ Admin login failed - incorrect password for: {admin.email}")
            return APIResponse(success=False, message="Invalid email or password")

        # Check if admin is active
        if not db_admin.get("is_active", True):
            logger.warning(f"❌ Admin login failed - inactive account: {admin.email}")
            return APIResponse(success=False, message="Admin account is deactivated")

        # Update last login
        await admins_collection.update_one(
            {"_id": db_admin["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = await create_access_token(
            data={"sub": db_admin["email"], "type": "admin"},
            expires_delta=access_token_expires
        )
        
        logger.info(f"✅ Admin logged in successfully: {admin.email}")
        
        # Build JSON response
        response_data = APIResponse(
            success=True,
            message="Admin login successful",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user_type": "admin",
                "admin": {
                    "id": str(db_admin["_id"]),
                    "name": db_admin["name"],
                    "email": db_admin["email"],
                    "role": db_admin.get("role", "admin")
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
        logger.error(f"💥 ADMIN SIGNIN error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Login failed due to a system error. Please try again later.")


# ========================
# TRAINING & DOCUMENTS
# ========================

@router.post("/admin/train", response_model=APIResponse)
async def train_chatbot_api(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    adminId: str = Form(...),
    adminName: str = Form(...),
    admin: dict = Depends(get_current_admin)
):
    """Training endpoint using BackgroundTasks to prevent server hang"""
    ALLOWED_EXTENSIONS = {".pdf", ".txt", ".doc", ".docx", ".csv", ".json", ".parquet"}
    try:
        logger.info(f"📚 Training request from admin: {adminName}")
        
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            return APIResponse(
                success=False,
                message=f"Unsupported file type '{file_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Save file temporarily
        upload_dir = "data/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        file_size = len(content)
        
        # 1. Create initial "processing" record
        training_document = {
            "documentName": file.filename,
            "uploadDate": datetime.utcnow(),
            "status": "processing",
            "fileSize": file_size,
            "adminEmail": admin.get("email", "admin@legalai.com"),
            "adminName": adminName,
            "documentType": "Legal Document",
            "source": "Admin Upload",
            "processingTime": "N/A",
            "chunkCount": 0,
            "adminId": adminId
        }
        
        document_id = None
        if is_database_connected():
            training_collection = await get_training_collection()
            result_db = await training_collection.insert_one(training_document)
            document_id = str(result_db.inserted_id)

        # 2. Kick off background processing
        background_tasks.add_task(
            process_document_background,
            file_path,
            document_id,
            adminName
        )
        
        return APIResponse(
            success=True,
            message="Document upload successful. Processing started in background.",
            data={
                "filename": file.filename,
                "status": "processing",
                "documentId": document_id
            }
        )
        
    except Exception as e:
        logger.error(f"[ERROR] Training trigger error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Failed to initiate training. Please check the file format.")

@router.post("/admin/train/bulk", response_model=APIResponse)
async def bulk_train_all_api(
    background_tasks: BackgroundTasks,
    admin: dict = Depends(get_current_admin)
):
    """
    Trigger bulk training for ALL documents in the uploads folder.
    Optimized for thousands of files.
    """
    try:
        upload_dir = "data/uploads"
        if not os.path.exists(upload_dir):
            return APIResponse(success=False, message="Uploads directory not found.")
            
        # 1. Get all filenames and checksums existing in the database (regardless of status)
        existing_filenames_lower = set()
        existing_checksums = set()
        if is_database_connected():
            training_collection = await get_training_collection()
            # Fetch documentName and checksum to minimize memory usage
            existing_docs_cursor = training_collection.find({}, {"documentName": 1, "checksum": 1})
            async for doc in existing_docs_cursor:
                if "documentName" in doc:
                    existing_filenames_lower.add(doc["documentName"].lower())
                if "checksum" in doc and doc["checksum"] != "N/A":
                    existing_checksums.add(doc["checksum"])
            
        # 2. Identify candidate files in the uploads folder
        candidate_files = [
            f for f in os.listdir(upload_dir) 
            if os.path.isfile(os.path.join(upload_dir, f)) and 
               os.path.splitext(f)[1].lower() in {".pdf", ".txt", ".doc", ".docx", ".csv", ".json", ".parquet"}
        ]
        
        # 3. Filter out files that already have a database entry (case-insensitive)
        # Import document_processor to calculate checksums for validation
        from app.document_handler import document_processor
        
        new_files = []
        skipped_count_name = 0
        skipped_count_checksum = 0
        
        for f in candidate_files:
            file_path = os.path.join(upload_dir, f)
            
            # Case-insensitive name check
            if f.lower() in existing_filenames_lower:
                skipped_count_name += 1
                continue
                
            # Checksum check (secondary safeguard)
            try:
                # Fast validation just to get checksum
                v_info = document_processor.validate_file(file_path)
                checksum = v_info.get("checksum")
                if checksum in existing_checksums:
                    skipped_count_checksum += 1
                    continue
            except Exception as e:
                logger.warning(f"Validation failed for {f} during bulk filtering: {e}")
                # If validation fails here, we might still want to try processing it in the background task
                # but for safety, we'll only add it if name doesn't exist.
            
            new_files.append(file_path)
        
        if not new_files:
            return APIResponse(
                success=True, 
                message=f"Sync Complete: All files in the library are already processed. (Skipped: {skipped_count_name} by name, {skipped_count_checksum} by content)",
                data={"newFileCount": 0, "processedFileCount": len(candidate_files), "documentId": None}
            )
            
        logger.info(f"[BULK] Training request for {len(new_files)} NEW files (Skipped {skipped_count_name} by name, {skipped_count_checksum} by checksum) from: {admin.get('email')}")
        
        # Create a single "Bulk Task" record in DB
        training_document = {
            "documentName": f"New File Training ({len(new_files)} files)",
            "uploadDate": datetime.utcnow(),
            "status": "processing",
            "fileSize": sum(os.path.getsize(f) for f in new_files),
            "adminEmail": admin.get("email"),
            "adminName": "System Admin",
            "documentType": "Bulk Dataset",
            "source": "Local Sync",
            "processingTime": "N/A",
            "chunkCount": 0,
            "adminId": str(admin.get("_id", "global"))
        }
        
        document_id = None
        if is_database_connected():
            training_collection = await get_training_collection()
            result_db = await training_collection.insert_one(training_document)
            document_id = str(result_db.inserted_id)
 
        # Kick off optimized bulk background processing
        background_tasks.add_task(
            process_bulk_documents_background,
            new_files,
            document_id,
            "System Admin"
        )
        
        return APIResponse(
            success=True,
            message=f"Processing started for {len(new_files)} newly identified files.",
            data={"documentId": document_id, "fileCount": len(new_files)}
        )
        
    except Exception as e:
        logger.error(f"[ERROR] Bulk Training trigger error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message=f"Failed to initiate bulk training: {str(e)}")

async def process_bulk_documents_background(file_paths: List[str], document_id: str, admin_name: str):
    """Background task for heavy BULK RAG processing"""
    try:
        from app.document_handler import bulk_ingest_documents
        logger.info(f"[BACKGROUND] Processing BULK document set {document_id}")
        
        start_time = datetime.utcnow()
        from app.document_handler import document_processor
        result = await document_processor.bulk_ingest_documents_async(
            file_paths, 
            doc_type="Legal Document", 
            source_name=admin_name, 
            document_id=document_id
        )
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        if is_database_connected() and document_id:
            training_collection = await get_training_collection()
            status = "completed" if result.get("status") == "success" else result.get("status", "failed")
            
            update_data = {
                "status": status,
                "chunkCount": result.get("total_chunks", 0),
                "processingTime": f"{processing_time:.2f}s",
                "logs": result.get("logs", [])[:100], # Keep a sample of bulk logs
                "completedAt": datetime.utcnow().isoformat()
            }
            
            await training_collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": update_data}
            )
            logger.info(f"[SUCCESS] Bulk Document {document_id} marked as {status}")
            
            # Invalidate semantic cache
            if status == "completed":
                try:
                    from app.database import get_semantic_cache_collection
                    cache_col = await get_semantic_cache_collection()
                    await cache_col.delete_many({})
                except Exception: pass
            
    except Exception as e:
        logger.error(f"[ERROR] BULK BACKGROUND ERROR: {str(e)}", exc_info=True)
        if is_database_connected() and document_id:
            try:
                training_collection = await get_training_collection()
                await training_collection.update_one(
                    {"_id": ObjectId(document_id)},
                    {"$set": {"status": "failed", "error": f"Internal bulk error: {str(e)}"}}
                )
            except Exception: pass

async def process_document_background(file_path: str, document_id: str, admin_name: str):
    """Background task for heavy RAG processing"""
    try:
        from app.document_handler import ingest_pdf
        logger.info(f"⚙️ BACKGROUND: Processing document {document_id}")
        
        start_time = datetime.utcnow()
        from app.document_handler import document_processor
        result = await document_processor.ingest_document_async(file_path, doc_type="Legal Document", source_name=admin_name, document_id=document_id)
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        if is_database_connected() and document_id:
            training_collection = await get_training_collection()
            # Professional Status Mapping: 'success' -> 'completed', 'partial' -> 'partial', others -> 'failed'
            status = "completed" if result.get("status") == "success" else result.get("status", "failed")
            
            update_data = {
                "status": status,
                "chunkCount": result.get("count", result.get("documents_processed", 0)),
                "processingTime": f"{processing_time:.2f}s",
                "error": result.get("message") or result.get("error") if status != "completed" else None,
                "completedAt": datetime.utcnow().isoformat()
            }
            
            # If partial, add details for professional transparency
            if status == "partial":
                update_data["partialDetails"] = f"{result.get('successful_batches', 0)}/{result.get('total_batches', 0)} batches successful"

            await training_collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": update_data}
            )
            logger.info(f"✅ BACKGROUND: Document {document_id} marked as {status}")
            
            # If successful, invalidate semantic cache to ensure new info is picked up
            if status == "completed":
                try:
                    from app.database import get_semantic_cache_collection
                    cache_col = await get_semantic_cache_collection()
                    deleted = await cache_col.delete_many({})
                    logger.info(f"⚡ BACKGROUND: Cleared {deleted.deleted_count} semantic cache entries due to knowledge update")
                except Exception as cache_err:
                    logger.warning(f"⚠️ BACKGROUND: Failed to clear semantic cache: {cache_err}")
            
    except Exception as e:
        logger.error(f"💥 BACKGROUND ERROR: {str(e)}", exc_info=True)
        if is_database_connected() and document_id:
            try:
                training_collection = await get_training_collection()
                await training_collection.update_one(
                    {"_id": ObjectId(document_id)},
                    {"$set": {"status": "failed", "error": "Internal processing error"}}
                )
            except Exception as db_err:
                logger.error(f"⚠️ BACKGROUND: Failed to update error status in DB: {db_err}")

@router.delete("/admin/training/document/{document_id}", response_model=APIResponse)
async def delete_training_document(
    document_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Professional deletion lifecycle: Vectors -> DB -> File -> Cache"""
    try:
        logger.info(f"🗑️ DELETE request for document: {document_id}")
        
        if not is_database_connected():
            return APIResponse(success=False, message="Database disconnected. Cannot delete.")
            
        if not document_id or len(document_id) != 24:
            return APIResponse(success=False, message="Invalid document ID format.")
        
        obj_id = ObjectId(document_id)
        training_collection = await get_training_collection()
        
        document = await training_collection.find_one({"_id": obj_id})
        if not document:
            return APIResponse(success=False, message="Document not found.")
        
        filename = document.get('documentName', document.get('filename', 'Unknown'))
        
        # 1. Purge Vectors from Store
        try:
            from app.document_handler import vector_store_manager
            vector_res = vector_store_manager.delete_vectors_by_source(filename)
            logger.info(f"🗑️ Vector cleanup for {filename}: {vector_res.get('message')}")
        except Exception as e:
            logger.error(f"⚠️ Vector cleanup failed for {filename}: {e}")

        # 2. Remove Database Record
        await training_collection.delete_one({"_id": obj_id})
        
        # 3. Clean up Physical File
        try:
            if filename and filename != 'Unknown':
                upload_dir = "data/uploads"
                file_path = os.path.join(upload_dir, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"🗑️ Physical file deleted: {file_path}")
        except Exception as e:
            logger.warning(f"⚠️ Could not delete physical file {filename}: {e}")

        # 4. Invalidate Semantic Cache (Prevent hallucinations from deleted data)
        try:
            from app.database import get_semantic_cache_collection
            cache_col = await get_semantic_cache_collection()
            deleted = await cache_col.delete_many({})
            logger.info(f"⚡ Cache cleared after deletion: {deleted.deleted_count} entries")
        except Exception as cache_err:
            logger.warning(f"⚠️ Failed to clear semantic cache: {cache_err}")
        
        return APIResponse(success=True, message=f"Document '{filename}' purged successfully.")
        
    except Exception as e:
        logger.error(f"💥 DELETE Training error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Failed to delete document due to a system error.")

@router.get("/admin/training-history", response_model=APIResponse)
async def get_training_history(
    admin: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    """Get training document history with search and filtering"""
    try:
        if not is_database_connected():
            return APIResponse(success=True, message="Disconnected", data={"history": []})
        
        training_collection = await get_training_collection()
        
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"documentName": {"$regex": search, "$options": "i"}},
                {"adminName": {"$regex": search, "$options": "i"}},
                {"documentType": {"$regex": search, "$options": "i"}}
            ]
        if status:
            query["status"] = status
            
        # Get total count matching query
        total_count = await training_collection.count_documents(query)
        
        training_docs_cursor = training_collection.find(query) \
            .sort("uploadDate", -1) \
            .skip((page - 1) * limit) \
            .limit(limit)
        
        training_docs = []
        async for doc in training_docs_cursor:
            training_docs.append(doc)
        
        for doc in training_docs:
            doc["_id"] = str(doc["_id"])
            if isinstance(doc.get("uploadDate"), datetime):
                doc["uploadDate"] = doc["uploadDate"].isoformat()
        
        has_more = (page * limit) < total_count

        return APIResponse(
            success=True, 
            message="Success", 
            data={
                "history": training_docs,
                "total": total_count,
                "page": page,
                "limit": limit,
                "hasMore": has_more
            }
        )
    except Exception as e:
        logger.error(f"Failed to fetch training history: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Unable to retrieve training history at this time.")

@router.post("/admin/training/resume/{document_id}", response_model=APIResponse)
async def resume_training_api(
    document_id: str,
    background_tasks: BackgroundTasks,
    admin: dict = Depends(get_current_admin)
):
    """Resume training for a failed or partial document"""
    try:
        logger.info(f"🔄 RESUME request for document: {document_id}")
        
        if not is_database_connected():
            return APIResponse(success=False, message="Database disconnected. Cannot resume.")
            
        training_collection = await get_training_collection()
        doc = await training_collection.find_one({"_id": ObjectId(document_id)})
        
        if not doc:
            return APIResponse(success=False, message="Document record not found.")
            
        filename = doc.get("documentName")
        # Use absolute path or relative from root
        upload_dir = "data/uploads"
        file_path = os.path.join(upload_dir, filename)
        
        if not os.path.exists(file_path):
            logger.error(f"❌ Resume failed: File not found at {file_path}")
            return APIResponse(success=False, message=f"Physical file '{filename}' not found on server. Please re-upload.")

        # 1. Clean up existing vectors for this filename to prevent duplicates
        try:
            from app.document_handler import vector_store_manager
            vector_res = vector_store_manager.delete_vectors_by_source(filename)
            logger.info(f"🔄 Vector cleanup before resume for {filename}: {vector_res.get('message')}")
        except Exception as e:
            logger.error(f"⚠️ Vector cleanup warning during resume (non-fatal): {e}")

        # 2. Update status to processing
        await training_collection.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {
                "status": "processing",
                "uploadDate": datetime.utcnow(), # Refresh timestamp for retry
                "error": None,
                "progress": 0,
                "logs": [],
                "last_log": "Resume initiated..."
            }}
        )

        # 3. Kick off background processing
        background_tasks.add_task(
            process_document_background,
            file_path,
            document_id,
            doc.get("adminName", "Admin")
        )

        return APIResponse(
            success=True, 
            message="Resume request accepted. Processing resumed in background.",
            data={"documentId": document_id, "status": "processing"}
        )
        
    except Exception as e:
        logger.error(f"💥 Resume Training error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Failed to resume training due to a system error.")


@router.get("/admin/training/status/{document_id}", response_model=APIResponse)
async def get_training_status(
    document_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Get real-time status, progress and logs for a training document"""
    try:
        if not is_database_connected():
            return APIResponse(success=False, message="Database disconnected")
            
        training_collection = await get_training_collection()
        doc = await training_collection.find_one({"_id": ObjectId(document_id)})
        
        if not doc:
            return APIResponse(success=False, message="Document not found")
            
        status_data = {
            "id": str(doc["_id"]),
            "documentName": doc.get("documentName"),
            "status": doc.get("status"),
            "progress": doc.get("progress", 0),
            "logs": doc.get("logs", []),
            "last_log": doc.get("last_log"),
            "chunkCount": doc.get("chunkCount", 0),
            "error": doc.get("error")
        }
        
        # If completed, ensure progress is 100
        if status_data["status"] == "completed":
            status_data["progress"] = 100
            
        return APIResponse(success=True, data=status_data)
    except Exception as e:
        logger.error(f"Error fetching training status: {e}")
        return APIResponse(success=False, message="Internal error")

# ========================
# DASHBOARD & SYSTEM
# ========================

@router.get("/admin/stats", response_model=APIResponse)
async def get_admin_dashboard_stats(admin: dict = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    try:
        if not is_database_connected():
            return APIResponse(success=False, message="Offline", data={"totalDocuments": 0, "totalUsers": 0})
        
        users_collection = await get_users_collection()
        training_collection = await get_training_collection()
        
        total_users = await users_collection.count_documents({})
        total_docs = await training_collection.count_documents({})
        
        last_doc = await training_collection.find_one(sort=[("uploadDate", -1)])
        last_training = None
        if last_doc and "uploadDate" in last_doc:
            ud = last_doc["uploadDate"]
            last_training = ud.isoformat() if isinstance(ud, datetime) else str(ud)
        
        return APIResponse(
            success=True,
            message="Success",
            data={
                "totalDocuments": total_docs,
                "totalUsers": total_users,
                "trainingSessions": total_docs,
                "systemHealth": 100 if is_database_connected() else 0,
                "activeModels": 1,
                "lastTraining": last_training
            }
        )
    except Exception as e:
        logger.error(f"Failed to fetch dashboard stats: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Unable to load dashboard statistics.")

@router.get("/admin/system-status", response_model=APIResponse)
async def get_system_status(admin: dict = Depends(get_current_admin)):
    """Integrated system health monitoring"""
    try:
        db_connected = is_database_connected()
        from app.config import ai_provider, load_vector_store
        provider_info = ai_provider.get_provider_info()
        
        try:
            store = load_vector_store()
            vector_doc_count = len(store.index_to_docstore_id)
        except Exception:
            vector_doc_count = 0

        status_info = {
            "backend": "online",
            "database": "online" if db_connected else "offline",
            "vector": "online" if vector_doc_count > 0 else "empty",
            "ai": "online" if not provider_info.get("fallback_mode", False) else "degraded"
        }

        return APIResponse(success=True, message="System pulse retrieved", data=status_info)
    except Exception as e:
        logger.error(f"System status check failed: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="System status check failed. Core services may be unreachable.")

# NOTE: Public /system/status route is defined in main.py to avoid duplication

@router.get("/admin/users", response_model=APIResponse)
async def get_users_list(
    admin: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 10
):
    """Get users list with pagination"""
    try:
        if not is_database_connected():
            return APIResponse(success=False, message="Offline")
        
        users_collection = await get_users_collection()
        skip = (page - 1) * limit
        users_cursor = users_collection.find({}, {"password": 0}).sort("created_at", -1).skip(skip).limit(limit)
        
        users = []
        async for user in users_cursor:
            users.append(user)
        
        for user in users:
            user["_id"] = str(user["_id"])
            if isinstance(user.get("created_at"), datetime):
                user["created_at"] = user["created_at"].isoformat()
        
        total_users = await users_collection.count_documents({})
        total_pages = (total_users + limit - 1) // limit
        
        return APIResponse(
            success=True,
            message="Success",
            data={
                "users": users,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_users": total_users
                }
            }
        )
    except Exception as e:
        logger.error(f"User list fetch failed: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Failed to retrieve user directory.")

@router.patch("/admin/users/{user_id}/status", response_model=APIResponse)
async def toggle_user_status(
    user_id: str,
    body: dict,
    admin: dict = Depends(get_current_admin)
):
    """Toggle a user's active status"""
    try:
        if not is_database_connected():
            return APIResponse(success=False, message="Database offline")

        is_active = body.get("is_active", True)
        users_collection = await get_users_collection()
        
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": is_active}}
        )

        if result.matched_count == 0:
            return APIResponse(success=False, message="User not found")

        action = "activated" if is_active else "deactivated"
        logger.info(f"👤 User {user_id} {action} by admin {admin.get('name', 'Unknown')}")
        return APIResponse(success=True, message=f"User {action} successfully")
    except Exception as e:
        logger.error(f"Toggle user status error: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Failed to update user status")


# ========================
# SUMMARIZATION & EXPORT
# ========================

@router.post("/admin/summarize", response_model=APIResponse)
async def summarize_document(
    document_id: str = Form(...),
    summary_type: str = Form("executive"),
    admin: dict = Depends(get_current_admin)
):
    """Summarize a specific legal document from training collection"""
    try:
        from app.summarizer import summarizer
        from app.config import load_vector_store
        
        # Load the document chunks from vector store using document_id
        store = load_vector_store()
        
        # Filter docs by document_id in metadata
        doc_chunks = []
        for doc_id in store.index_to_docstore_id.values():
            doc = store.docstore.search(doc_id)
            if doc.metadata.get("checksum") == document_id or document_id in doc.metadata.get("title", ""):
                doc_chunks.append(doc)
        
        if not doc_chunks:
            return APIResponse(success=False, message="No document sections found for summarization")
        
        logger.info(f"📑 Summarizing {len(doc_chunks)} chunks for: {document_id}")
        summary = summarizer.summarize_long_document(doc_chunks, summary_type=summary_type)
        
        return APIResponse(success=True, message="Summary generated", data={"summary": summary})
    except Exception as e:
        logger.error(f"Summarization endpoint failed: {str(e)}", exc_info=True)
        return APIResponse(success=False, message="Document summarization failed. The document may be empty or encrypted.")

@router.post("/admin/export-summary")
async def export_summary(
    content: str = Form(...),
    title: str = Form("Legal_Summary"),
    format: str = Form("pdf"),
    admin: dict = Depends(get_current_admin)
):
    """Export summary text to PDF or Word"""
    try:
        from app.summarizer import summarizer
        output_dir = "data/exports"
        os.makedirs(output_dir, exist_ok=True)
        file_ext = "pdf" if format.lower() == "pdf" else "docx"
        safe_title = "".join([c if c.isalnum() else "_" for c in title])
        file_path = os.path.join(output_dir, f"{safe_title}.{file_ext}")
        
        if format.lower() == "pdf":
            summarizer.export_to_pdf(content, title, file_path)
        else:
            summarizer.export_to_docx(content, title, file_path)
            
        return FileResponse(
            path=file_path,
            filename=f"{safe_title}.{file_ext}",
            media_type="application/octet-stream"
        )
    except Exception as e:
        logger.error(f"Export failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate export file. Please try again.")
