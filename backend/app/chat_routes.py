# app/chat_routes.py - Chat and conversation endpoints
import os
import json
import logging
import hashlib
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.concurrency import run_in_threadpool
from bson import ObjectId

from .models import APIResponse
from .auth import get_current_user
from .summarizer import summarizer

logger = logging.getLogger(__name__)
router = APIRouter()


# ========================
# CONVERSATION / HISTORY ENDPOINTS
# ========================

@router.get("/conversations", response_model=APIResponse)
async def get_user_conversations(request: Request, user: dict = Depends(get_current_user)):
    """Retrieve all conversations for the current user"""
    try:
        from .database import get_conversations_collection
        conv_col = await get_conversations_collection()
        # Use async find and to_list
        conversations_cursor = conv_col.find({"user_id": user["email"]}).sort("updated_at", -1)
        conversations = await conversations_cursor.to_list(length=100)
        for c in conversations: c["_id"] = str(c["_id"])
        return APIResponse(success=True, message="Success", data=conversations)
    except Exception as e:
        return APIResponse(success=False, message=str(e))

@router.post("/conversations", response_model=APIResponse)
async def save_conversation_segment(request: Request, user: dict = Depends(get_current_user)):
    """Save or update a conversation segment"""
    try:
        body = await request.json()
        from .database import get_conversations_collection
        conv_col = await get_conversations_collection()
        
        conversation = {
            "user_id": user["email"],
            "title": body.get("title", "New Conversation"),
            "messages": body.get("messages", []),
            "attached_files": body.get("attached_files", []), # Persist session context
            "updated_at": datetime.utcnow()
        }
        
        if body.get("id"):
            await conv_col.update_one({"_id": ObjectId(body["id"])}, {"$set": conversation})
            conversation["_id"] = body["id"]
        else:
            result = await conv_col.insert_one(conversation)
            conversation["_id"] = str(result.inserted_id)
            
        return APIResponse(success=True, message="Saved", data=conversation)
    except Exception as e:
        return APIResponse(success=False, message=str(e))


# ========================
# CHAT UPLOAD & RAG
# ========================

@router.post("/chat/upload", response_model=APIResponse)
async def chat_upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Allow users to upload private documents for live chat session analysis"""
    try:
        logger.info(f"📤 Chat upload received from: {user['email']} - File: {file.filename}")
        
        # 1. Save file to personal folder
        session_upload_dir = os.path.join("data", "uploads", "users", user["id"])
        os.makedirs(session_upload_dir, exist_ok=True)
        file_path = os.path.join(session_upload_dir, file.filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # 2. Ingest into the Single Vector Store (Tagged with user source)
        from app.document_handler import ingest_document_async
        result = await ingest_document_async(
            file_path, 
            doc_type="User Personal Document", 
            source_name=f"user_{user['id']}_{file.filename}",
            user_id=user['id']
        )
        
        if not result.get("success"):
            return APIResponse(success=False, message=result.get("error") or "Processing failed")
            
        return APIResponse(
            success=True, 
            message="Document uploaded and indexed successfully for this session.",
            data={
                "filename": file.filename,
                "chunks": result.get("meaningful_chunks_kept", 0),
                "source_tag": f"user_{user['id']}_{file.filename}"
            }
        )
    except Exception as e:
        logger.error(f"Chat upload failed: {e}")
        return APIResponse(success=False, message=str(e))

@router.post("/chat/summarize", response_model=APIResponse)
async def chat_summarize(request: Request, user: dict = Depends(get_current_user)):
    """Summarize a legal document from the current session"""
    try:
        body = await request.json()
        filename = body.get("filename")
        if not filename:
            return APIResponse(success=False, message="No filename provided")
            
        # 1. Locate the file
        session_upload_dir = os.path.join("data", "uploads", "users", user["id"])
        file_path = os.path.join(session_upload_dir, filename)
        
        if not os.path.exists(file_path):
            # Try global uploads if not in personal
            file_path = os.path.join("data", "uploads", filename)
            if not os.path.exists(file_path):
                return APIResponse(success=False, message="Document not found")

        # 2. Process and summarize
        from .document_handler import document_processor
        raw_docs = document_processor.load_document(file_path)
        
        if not raw_docs:
            return APIResponse(success=False, message="Could not extract text for summarization")
            
        summary = summarizer.summarize_long_document(raw_docs, summary_type="executive")
        
        return APIResponse(success=True, message="Summary generated", data={"summary": summary, "filename": filename})
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return APIResponse(success=False, message=str(e))

@router.get("/chat/summarize/download")
async def download_summary(filename: str, format: str = "pdf", user: dict = Depends(get_current_user)):
    """Download the summary of a document"""
    try:
        # Re-summarize or fetch from cache (for now re-summarize for simplicity in proof-of-concept)
        session_upload_dir = os.path.join("data", "uploads", "users", user["id"])
        file_path = os.path.join(session_upload_dir, filename)
        
        if not os.path.exists(file_path):
            file_path = os.path.join("data", "uploads", filename)
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="File not found")

        from .document_handler import document_processor
        raw_docs = document_processor.load_document(file_path)
        summary = summarizer.summarize_long_document(raw_docs, summary_type="executive")
        
        temp_file = f"temp_summary_{user['id']}_{filename}.{format}"
        temp_path = os.path.join("tmp", temp_file)
        os.makedirs("tmp", exist_ok=True)
        
        if format == "pdf":
            summarizer.export_to_pdf(summary, f"Summary: {filename}", temp_path)
        else:
            summarizer.export_to_docx(summary, f"Summary: {filename}", temp_path)
            
        return FileResponse(temp_path, filename=f"Summary_{filename}.{format}", background=None)
    except Exception as e:
        logger.error(f"Download failed: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


# ========================
# CHAT ENDPOINT
# ========================

@router.post("/chat")
async def chat(request: Request, user: Optional[dict] = Depends(get_current_user)):
    """Chat endpoint using config.py vector store with session awareness"""
    try:
        try:
            body = await request.json()
            query = body.get('query') or body.get('message')
        except (ValueError, UnicodeDecodeError):
            form_data = await request.form()
            query = form_data.get('query') or form_data.get('message')
        
        if not query or len(query.strip()) < 3:
            return APIResponse(success=False, message="Query too short")

        query = query.strip()
        history = body.get('history', []) if isinstance(body.get('history'), list) else []
        attachments = body.get('attachments', []) # List of {source_tag, filename}
        
        from app.config import load_vector_store, ai_provider
        from .database import get_semantic_cache_collection
        
        # 1. Semantic Cache Lookup (Restricted to same user and mode scope)
        cache_col = await get_semantic_cache_collection()
        user_email = user['email'] if user else "anonymous"
        
        stream_requested = body.get("stream", False)
        
        # Determine mode: FILE CHAT vs GENERAL CHAT
        source_tags = [s.get('source_tag') for s in attachments if s.get('source_tag')]
        is_file_chat = bool(source_tags)
        
        # Include mode+source in cache key to prevent cross-mode poisoning
        cache_scope = f"file:{','.join(sorted(source_tags))}" if is_file_chat else "general"
        query_hash = hashlib.sha256(f"user_{user_email}:{cache_scope}:{query}".encode()).hexdigest()
        
        # Only use cache if no history
        if not history:
            cached_entry = await cache_col.find_one({"query_hash": query_hash})
            if cached_entry:
                logger.info(f"🚀 Semantic Cache Hit ({cache_scope}) for: {query[:50]}...")
                if stream_requested:
                    async def cache_streamer():
                        yield f"data: {json.dumps({'type': 'metadata', 'sources': cached_entry.get('sources', []), 'provider_info': ai_provider.get_provider_info()})}\n\n"
                        yield f"data: {json.dumps({'type': 'content', 'delta': cached_entry['answer']})}\n\n"
                        yield "data: [DONE]\n\n"
                    return StreamingResponse(cache_streamer(), media_type="text/event-stream")
                return APIResponse(
                    success=True, message="Success", 
                    data={
                        "query": query, "answer": cached_entry["answer"],
                        "sources": cached_entry.get("sources", []),
                        "cached": True, "provider_info": ai_provider.get_provider_info()
                    }
                )

        # 2. Retrieval — Two completely separate modes
        store = await run_in_threadpool(load_vector_store)
        doc_count = len(store.index_to_docstore_id)
        
        if doc_count <= 0:
            return APIResponse(success=True, message="No docs", data={"answer": "The legal database is currently empty.", "provider_info": ai_provider.get_provider_info()})

        raw_docs = []
        
        if is_file_chat:
            # ═══════════════════════════════════════════════════
            # MODE A: FILE CHAT — Direct Docstore Scan (No FAISS)
            # ═══════════════════════════════════════════════════
            logger.info(f"🔍 FILE CHAT MODE: Accelerated scan for {len(source_tags)} sources.")
            
            # [OPTIMIZATION] Replace O(N) linear scan with ID-based lookup if possible, 
            # or at least a more efficient dictionary iteration.
            file_docs = []
            doc_dict = store.docstore._dict
            for doc_id in store.index_to_docstore_id.values():
                doc = doc_dict.get(doc_id)
                if doc and doc.metadata.get('source') in source_tags:
                    file_docs.append(doc)
            
            logger.info(f"📄 Found {len(file_docs)} chunks.")
            
            if file_docs:
                # Rank by keyword overlap for basic relevance
                query_words = set(query.lower().split())
                scored = [(doc, len(query_words & set(doc.page_content.lower().split()))) for doc in file_docs]
                scored.sort(key=lambda x: x[1], reverse=True)
                raw_docs = [doc for doc, _ in scored[:15]]
        else:
            # ═══════════════════════════════════════════════════
            # MODE B: GENERAL CHAT — Standard FAISS Similarity Search
            # ═══════════════════════════════════════════════════
            logger.info(f"🔍 GENERAL CHAT MODE: FAISS similarity search (k=15)")
            retriever = store.as_retriever(search_kwargs={"k": 15})
            raw_docs = await run_in_threadpool(retriever.invoke, query)
        
        # Semantic Reranking (both modes)
        relevant_docs = await run_in_threadpool(ai_provider.rerank, query, raw_docs, top_n=5)
        
        # 3. Build Context
        context_blocks = []
        sources_metadata = []
        
        for i, doc in enumerate(relevant_docs):
            meta = doc.metadata
            source_label = meta.get('court_name', 'General Document')
            if user and meta.get("source", "").startswith(f"user_{user['id']}"):
                source_label = f"Your Uploaded Document ({meta.get('title', 'Doc')})"
            
            context_blocks.append(f"--- DOCUMENT START ---\nSource: {source_label}\nContent: {doc.page_content}\n--- DOCUMENT END ---")
            sources_metadata.append({
                "id": i + 1,
                "title": meta.get("title", f"Document {i+1}"),
                "source": source_label,
                "date": meta.get("decision_date", "N/A"),
                "is_personal": user and meta.get("source", "").startswith(f"user_{user['id']}")
            })

        context = "\n\n".join(context_blocks)
        
        # Format history
        formatted_history = ""
        if history:
            history_subset = history[-5:]
            history_blocks = []
            for h in history_subset:
                role = "User" if h.get("role") == "user" else "Assistant"
                history_blocks.append(f"{role}: {h.get('content', '')}")
            formatted_history = "\n".join(history_blocks)

        # 4. Mode-specific Prompts
        if is_file_chat:
            # FILE CHAT: Strict grounding — ONLY answer from the uploaded file
            if not context.strip():
                no_context_answer = "I could not find relevant information in your uploaded document(s) to answer this query. Please try rephrasing your question or ask about a topic covered in the document."
                if stream_requested:
                    async def no_context_streamer():
                        yield f"data: {json.dumps({'type': 'metadata', 'sources': [], 'provider_info': ai_provider.get_provider_info()})}\n\n"
                        yield f"data: {json.dumps({'type': 'content', 'delta': no_context_answer})}\n\n"
                        yield "data: [DONE]\n\n"
                    return StreamingResponse(no_context_streamer(), media_type="text/event-stream")
                return APIResponse(success=True, message="No relevant context", data={"answer": no_context_answer, "sources": [], "provider_info": ai_provider.get_provider_info()})

            prompt = f"""
        SYSTEM: You are a professional Pakistani Legal Consultant analyzing a specific uploaded document.
        
        CRITICAL RULES:
        - You MUST answer ONLY from the CONTEXT provided below (the user's uploaded document).
        - If the context does not contain enough information, say so honestly.
        - NEVER use your general training knowledge to fill gaps.
        - All legal interpretation must be in the Pakistani legal context.
        - DO NOT include any references like [Ref 1], [Ref 2] or similar citation markers.
        
        PREVIOUS CONVERSATION:
        {formatted_history if formatted_history else 'No previous history.'}

        FORMATTING RULES:
        1. Use **Main Sections** with `###` headings.
        2. Use **Bullet Points** and **Numbered Lists**.
        3. Use **Bold Text** for key legal terms.
        4. PROFESSIONALISM: Provide a sophisticated analysis grounded in the document.

        UPLOADED DOCUMENT CONTEXT:
        {context}
        
        USER QUERY: {query}
        
        PROFESSIONAL LEGAL ANALYSIS:"""
        else:
            # GENERAL CHAT: Balanced Context + Expert Mode
            prompt = f"""
        SYSTEM: You are a senior Pakistani Legal Consultant with deep expertise in the Constitution of Pakistan, statutory law, and jurisprudence.
        
        YOUR TASK:
        Answer the following USER QUERY. First, prioritize using any information found in the CONTEXT FROM LEGAL DATABASE below. 
        If the context does not contain the answer, you MUST use your expert general knowledge of Pakistani law to give a complete, professional answer.
        
        CRITICAL RULES:
        1. When answering general legal questions (e.g. about the 26th Amendment, the Constitution, penal laws like rape or theft), use your FULL knowledge to provide an exhaustive, accurate response.
        2. NEVER hallucinate fake laws, cases, or citations. If something does not exist in Pakistani law, or you genuinely do not know, ONLY THEN state: "I don't have enough knowledge to answer this request."
        3. ALWAYS answer strictly within the boundaries of real Pakistani law.
        4. DO NOT use citation markers like [Ref 1] or invent non-existent references.
        
        PREVIOUS CONVERSATION:
        {formatted_history if formatted_history else 'No previous history.'}

        FORMATTING RULES:
        1. Use **Main Sections** with `###` headings.
        2. Use **Bullet Points** and **Numbered Lists** for clarity.
        3. Use **Paragraphs** for detailed explanations.
        4. Use **Bold Text** for key legal terms.

        CONTEXT FROM LEGAL DATABASE:
        {context}
        
        USER QUERY: {query}
        
        COMPREHENSIVE PROFESSIONAL LEGAL ANALYSIS:"""

        # 4. Handle Streaming vs Standard Response
        if stream_requested:
            async def event_generator():
                # Yield metadata first
                metadata_block = {
                    "type": "metadata",
                    "sources": sources_metadata,
                    "provider_info": ai_provider.get_provider_info()
                }
                yield f"data: {json.dumps(metadata_block)}\n\n"
                
                # Stream the answer (Now handles both Gemini and Groq failover)
                full_answer = ""
                async for chunk in ai_provider.stream_chat(prompt, context):
                    full_answer += chunk
                    yield f"data: {json.dumps({'type': 'content', 'delta': chunk})}\n\n"
                
                # Signal end and save to cache
                yield "data: [DONE]\n\n"
                
                # Background save to cache (Async)
                try:
                    await cache_col.insert_one({
                        "query_hash": query_hash,
                        "query": query,
                        "answer": full_answer,
                        "sources": sources_metadata,
                        "created_at": datetime.utcnow()
                    })
                except Exception as cache_err:
                    logger.warning(f"Cache write failed (streaming): {cache_err}")

            return StreamingResponse(event_generator(), media_type="text/event-stream")

        # Standard non-streaming path
        try:
            # Offload heavy LLM call to threadpool
            response = await run_in_threadpool(ai_provider.call_llm, prompt)
            answer = response.content if hasattr(response, 'content') else str(response)
            
            # Save to Semantic Cache (Async)
            try:
                await cache_col.insert_one({
                    "query_hash": query_hash,
                    "query": query,
                    "answer": answer,
                    "sources": sources_metadata,
                    "created_at": datetime.utcnow()
                })
            except Exception as cache_err:
                logger.warning(f"Cache write failed: {cache_err}")
                
        except Exception as llm_error:
            logger.error(f"LLM Invoke failed: {llm_error}")
            answer = "The legal AI is currently experiencing high load. Based on short document scans: " + context_blocks[0][:200]
            
        return APIResponse(
            success=True,
            message="Success",
            data={
                "query": query,
                "answer": answer,
                "sources": sources_metadata,
                "provider_info": ai_provider.get_provider_info()
            }
        )
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return APIResponse(success=False, message=str(e))
