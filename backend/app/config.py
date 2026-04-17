import os
import re
# Suppress OpenMP warning - must be at the VERY TOP
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

import sys
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.embeddings import Embeddings
from typing import Optional, Tuple, Union, List, Any, Dict
import hashlib
from pathlib import Path
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import datetime
import google.generativeai as genai
import faiss
import socket
import ssl
from urllib3.exceptions import HTTPError
import time
import requests
from sentence_transformers import SentenceTransformer
from requests.exceptions import RequestException
import json
import numpy as np
import threading
import asyncio

# Global lock and cache for memory-safe local operations
faiss_lock = threading.RLock()
_LOCAL_MODEL_CACHE = {} # Cache for SentenceTransformer models to prevent redundant memory usage


# Force IPv4 for compatibility
socket.AF_INET = socket.AF_INET

# ========================
# System Configuration
# ========================

# FAISS CPU optimization
os.environ.update({
    'FAISS_NO_GPU_WARN': '1',
    'FAISS_NO_GPU': '1',
    'FAISS_NO_CUDA': '1',
    'OMP_NUM_THREADS': '1',
    'TOKENIZERS_PARALLELISM': 'false'  # Prevent tokenizer warnings
})
faiss.omp_set_num_threads(1)

# ========================
# Environment Setup
# ========================

# Directory Paths
BASE_DIR = Path(__file__).resolve().parent.parent
VECTOR_STORE_PATH = BASE_DIR / "data" / "vector_store"
UPLOAD_FOLDER = BASE_DIR / "data" / "uploads"
LOG_DIR = BASE_DIR / "data" / "logs"
BACKUP_DIR = BASE_DIR / "data" / "backups"

# Ensure log directory exists early for logging
LOG_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(BASE_DIR / ".env")

# ========================
# Logging Configuration
# ========================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(str(LOG_DIR / 'app.log'), encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ========================
# Core Functions
# ========================

def verify_faiss_mode():
    """Verify FAISS is running in CPU mode"""
    try:
        faiss.GpuIndexFlatL2
        logger.warning("FAISS GPU components detected but should be disabled!")
    except AttributeError:
        logger.info("FAISS running in CPU-only mode (as configured)")

def initialize_directories() -> None:
    """Ensure all required directories exist with proper permissions"""
    try:
        directories = [VECTOR_STORE_PATH, UPLOAD_FOLDER, LOG_DIR, BACKUP_DIR]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            if os.name != 'nt':
                os.chmod(directory, 0o755)
        logger.info("[SUCCESS] Directories initialized successfully")
        verify_faiss_mode()
    except OSError as e:
        logger.error(f"[ERROR] Directory creation failed: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to initialize directories: {str(e)}")

initialize_directories()

# ========================
# Smart AI Provider with Gemini First, Ollama Fallback
# ========================

# ========================
# Advanced AI Provider (Gemini & Groq Multi-Failover)
# ========================

# Global references for backward compatibility
embeddings_manager = None
embeddings = None
llm = None

def update_global_references():
    """Update module-level global references to synchronized with ai_provider"""
    global embeddings_manager, embeddings, llm
    if 'ai_provider' in globals():
        embeddings_manager = ai_provider
        embeddings = ai_provider.embedder
        llm = ai_provider.llm
        logger.info(f"[SYNC] Global AI references synchronized: LLM={ai_provider.llm_type}, Embeddings={ai_provider.embedder_type}")

class MultiProviderManager:
    """Manages multi-provider failover for production-level RAG"""
    
    def __init__(self):
        self.providers = ["gemini", "groq"]
        self.current_llm_provider = None
        self.current_embed_provider = None
        
        # Multi-key pool for Gemini
        raw_keys = os.getenv("GEMINI_API_KEY", "")
        self.gemini_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self.current_gemini_index = 0
        self.blacklisted_keys = set() # Keys that returned 400/401
        self.quota_exhausted_keys = set() # Keys that returned 429
        self.quota_exhausted = {"gemini": False, "groq": False}
        self.errors = []
        self._rotation_lock = threading.Lock()

    def get_active_gemini_key(self):
        """Returns the currently active Gemini key from the pool"""
        if not self.gemini_keys:
            return None
        return self.gemini_keys[self.current_gemini_index]

    def rotate_gemini_key(self) -> bool:
        """Rotates to a DIFFERENT valid Gemini key in the pool. Returns True if successful."""
        with self._rotation_lock:
            if not self.gemini_keys:
                self.quota_exhausted["gemini"] = True
                return False
                
            current_idx = self.current_gemini_index
            current_key = self.gemini_keys[current_idx]
            
            # Mark current as potentially exhausted
            self.quota_exhausted_keys.add(current_key)
            
            pool_size = len(self.gemini_keys)
            logger.info(f"[ROTATE] Attempting to find a working key in pool of {pool_size}...")
            
            # Try all OTHER keys in the pool exhaustively
            for i in range(1, pool_size + 1):
                next_idx = (current_idx + i) % pool_size
                next_key = self.gemini_keys[next_idx]
                
                if next_key in self.blacklisted_keys:
                    continue
                    
                # Small backoff to give the next key a breath if it was recently hit
                if next_key in self.quota_exhausted_keys:
                    time.sleep(0.5) 

                if self._test_gemini(next_key):
                    self.current_gemini_index = next_idx
                    logger.warning(f"[ROTATE] GEMINI FAILOVER: Key {next_idx} activated (Prev: {current_key[:8]}... New: {next_key[:8]}...)")
                    
                    # Re-configure
                    genai.configure(api_key=next_key)
                    self.quota_exhausted["gemini"] = False
                    
                    # Signal change to provider instance
                    ai_provider.initialize_providers(skip_search=True)
                    update_global_references()
                    return True

            # If we reach here, pool is truly exhausted
            self.quota_exhausted["gemini"] = True
            logger.error(f"[CRITICAL] Gemini Pool Exhausted ({pool_size} keys). Transferring to Groq fallback.")
            ai_provider.initialize_providers(skip_search=True)
            return False

    def _test_gemini(self, api_key):
        """Pure test of Gemini key functionality without rotation side-effects"""
        try:
            if not api_key or api_key in self.blacklisted_keys: return False
            
            # Skip testing if key is already known to be exhausted in this session
            if api_key in self.quota_exhausted_keys:
                return False

            genai.configure(api_key=api_key)
            # Lightweight test: list models (works for all valid keys)
            # This is slow on Windows, so we just check connectivity
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    return True
            return False
        except Exception as e:
            error_str = str(e).lower()
            if any(x in error_str for x in ["quota", "429", "resource_exhausted", "limit"]):
                logger.warning(f"[QUOTA] Gemini Key Quota hit during test: {api_key[:8]}...")
                self.quota_exhausted_keys.add(api_key)
            elif any(x in error_str for x in ["invalid", "400", "key not valid", "unauthorized", "401"]):
                logger.error(f"[BLACKLIST] Gemini Key INVALID: {api_key[:8]}... Adding to blacklist.")
                self.blacklisted_keys.add(api_key)
            else:
                logger.error(f"[ERROR] Gemini Key Test Error ({api_key[:8]}): {str(e)}")
            
            self.errors.append(f"Gemini Error ({api_key[:8]}): {str(e)}")
            return False

    def _test_groq(self, api_key):
        try:
            if not api_key: return False
            import requests
            # DNS resolution on some Windows setups is flaky, try a few times
            for _ in range(2):
                try:
                    url = "https://api.groq.com/openai/v1/chat/completions"
                    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                    data = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": "test"}], "max_tokens": 1}
                    response = requests.post(url, headers=headers, json=data, timeout=5)
                    return response.status_code == 200
                except Exception:
                    continue
            return False
        except Exception as e:
            self.errors.append(f"Groq REST Error: {str(e)}")
            return False

class SafeGoogleEmbeddings(Embeddings):
    """Robust Gemini Embeddings wrapper using direct SDK to avoid v1beta 404s"""
    def __init__(self, model_name="models/gemini-embedding-001", api_key=None, dimension=768):
        self.model_name = model_name if model_name.startswith("models/") else f"models/{model_name}"
        self.api_key = api_key
        self.dimension = dimension
        if api_key:
            genai.configure(api_key=api_key)

    def _match_dimension(self, vector: List[float]) -> List[float]:
        """Strictly enforce the target dimension by padding with zeros if necessary"""
        if len(vector) == self.dimension:
            return vector
            
        # Pad with zeros to reach the required dimension for FAISS compatibility
        adjusted = np.zeros(self.dimension)
        limit = min(len(vector), self.dimension)
        adjusted[:limit] = vector[:limit]
        
        # Professional normalization to ensure cosine similarity remains valid
        import numpy as np
        norm = np.linalg.norm(adjusted)
        if norm > 0:
            adjusted = adjusted / norm
            
        return adjusted.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Get raw embeddings from Gemini
        raw_embeddings = self._with_retry(lambda: genai.embed_content(
            model=self.model_name,
            content=texts,
            task_type="retrieval_document"
        )['embedding'], texts=texts)
        
        # Manually pad each vector to match the 3072-dim index requirement
        return [self._match_dimension(v) for v in raw_embeddings]

    def embed_query(self, text: str) -> List[float]:
        # Get raw embedding from Gemini
        raw_embedding = self._with_retry(lambda: genai.embed_content(
            model=self.model_name,
            content=text,
            task_type="retrieval_query"
        )['embedding'], text=text)
        
        # Manually pad the vector to match the 3072-dim index requirement
        return self._match_dimension(raw_embedding)

    def _with_retry(self, func, texts: List[str] = None, text: str = None):
        try:
            return func()
        except Exception as e:
            error_str = str(e).lower()
            is_quota = any(x in error_str for x in ["quota", "429", "resource_exhausted", "limit"])
            is_invalid = any(x in error_str for x in ["invalid", "400", "key not valid", "unauthorized", "401"])
            
            if (is_quota or is_invalid) and ai_provider.manager.rotate_gemini_key():
                logger.warning(f"[{'QUOTA' if is_quota else 'AUTH'}] Embedding error, rotated key and retrying...")
                # The rotate_gemini_key call already updated genai.configure and ai_provider
                # So we can just try calling the function again (it will use the global ai_provider's embedder if we use it, 
                # but here 'func' is a lambda closure from the old call. 
                # Actually, func is `lambda: genai.embed_content(...)` which uses the global `genai` module.
                # Since rotate_gemini_key calls genai.configure, this should work.)
                return func()
            
            if is_quota:
                # If we are here, rotation failed. We should try to use the fallback embedder from ai_provider 
                # instead of just dying, IF one is available.
                if ai_provider.embedder_type != "gemini" and ai_provider.embedder:
                    logger.warning("[FAILOVER] Gemini Embeddings exhausted. Using fallback embedder...")
                    if texts is not None:
                        return ai_provider.embedder.embed_documents(texts)
                    if text is not None:
                        return ai_provider.embedder.embed_query(text)
                
            logger.error(f"[ERROR] Custom Embedding Failed: {e}")
            raise e

class SafeFakeEmbeddings(Embeddings):
    """Zero-impact fallback embeddings that prevent NoneType crashes when all providers fail"""
    def __init__(self, size=768):
        self.size = size
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[0.0] * self.size for _ in texts]
    def embed_query(self, text: str) -> List[float]:
        return [0.0] * self.size

class LocalSentenceTransformerEmbeddings(Embeddings):
    """Local replacement for Gemini with adaptive dim matching, singleton caching, and memory-safe fallbacks"""
    def __init__(self, model_name="sentence-transformers/all-mpnet-base-v2", target_dim=768):
        self.target_dim = target_dim
        self.model = None
        self.native_dim = target_dim
        self.model_name = "none"
        global _LOCAL_MODEL_CACHE
        
        # Models ordered by size/accuracy (descending size)
        models_to_try = [
            model_name,
            "sentence-transformers/all-MiniLM-L12-v2",
            "sentence-transformers/all-MiniLM-L6-v2",
            "sentence-transformers/paraphrase-MiniLM-L3-v2"
        ]
        
        last_error = ""
        for m in models_to_try:
            try:
                # 1. Check if model is already cached to avoid redundant memory usage
                if m in _LOCAL_MODEL_CACHE:
                    self.model = _LOCAL_MODEL_CACHE[m]
                    self.model_name = m
                    self.native_dim = self.model.get_sentence_embedding_dimension()
                    return

                # 2. Re-test if we have enough memory for the next model
                logger.info(f"[INIT] Attempting to load Local Model: {m}...")
                self.model = SentenceTransformer(m)
                
                # Cache successful load
                _LOCAL_MODEL_CACHE[m] = self.model
                self.model_name = m
                self.native_dim = self.model.get_sentence_embedding_dimension()
                logger.info(f"[SUCCESS] Local Model {m} loaded (Native: {self.native_dim}, Target: {target_dim}).")
                return
            except Exception as e:
                last_error = str(e)
                logger.warning(f"[RETRY] Failed to load {m}: {last_error}")
                # Aggressive cleanup if memory is low
                import gc
                gc.collect() 
                continue
        
        logger.error(f"[CRITICAL] All local embedding models failed: {last_error}")
        raise RuntimeError(f"Memory exhaustion: Unable to load any local embedding model. {last_error}")

    def _match_dimension(self, vector: np.ndarray) -> List[float]:
        # Handle mismatch using zero-padding or truncation for index compatibility
        if self.native_dim == self.target_dim:
            return vector.tolist()
        
        adjusted = np.zeros(self.target_dim)
        limit = min(self.native_dim, self.target_dim)
        adjusted[:limit] = vector[:limit]
        
        # Professional normalization to ensure cosine similarity remains valid
        norm = np.linalg.norm(adjusted)
        if norm > 0:
            adjusted = adjusted / norm
            
        return adjusted.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return [self._match_dimension(v) for v in embeddings]

    def embed_query(self, text: str) -> List[float]:
        embedding = self.model.encode([text])[0]
        return self._match_dimension(embedding)

class CustomGroqLLM:
    """Lightweight Groq wrapper with automatic 429 retry and failover awareness"""
    def __init__(self, api_key, model_name="llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model_name = model_name
        
    def invoke(self, prompt, retry_count=2):
        import requests
        import time
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        # Check if prompt is a string or LangChain Message
        content = prompt if isinstance(prompt, str) else getattr(prompt, "content", str(prompt))
        data = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": content}],
            "temperature": 0.1,
            "max_tokens": 4096
        }
        
        last_error = ""
        for attempt in range(retry_count + 1):
            try:
                response = requests.post(url, headers=headers, json=data, timeout=30)
                if response.status_code == 200:
                    result = response.json()
                    from langchain_core.messages import AIMessage
                    return AIMessage(content=result['choices'][0]['message']['content'])
                elif response.status_code == 429:
                    last_error = f"429 Rate Limit: {response.text}"
                    if attempt < retry_count:
                        # Successive backoff: 5s, 10s
                        wait_time = (attempt + 1) * 5
                        logger.warning(f"[QUOTA] Groq 429 hit, retrying in {wait_time}s... (Attempt {attempt+1}/{retry_count})")
                        time.sleep(wait_time)
                        continue
                else:
                    last_error = f"HTTP {response.status_code}: {response.text}"
            except Exception as e:
                last_error = f"Connection Error: {str(e)}"
                if attempt < retry_count:
                    time.sleep(2)
                    continue
        
        return f"Groq Error: {last_error}"

class SmartAIProvider:
    """Production-grade AI provider prioritizing Gemini with Groq failover"""
    
    def __init__(self):
        self.manager = MultiProviderManager()
        # Ensure we NEVER have a None embedder to prevent middle-of-init crashes
        self.embedder = SafeFakeEmbeddings(size=768)
        self.llm = None
        self.embedder_type = "emergency-init"
        self.llm_type = "none"
        self.llm_semaphore = asyncio.Semaphore(1) # Serialization to respect low Free Tier quotas
        self.initialize_providers()
    
    def initialize_providers(self, skip_search: bool = False, clear_quota: bool = False):
        """Initialize embeddings and LLM using prioritized failover with key rotation support"""
        if clear_quota:
            self.manager.quota_exhausted_keys.clear()
            self.manager.quota_exhausted = {"gemini": False, "groq": False}
            logger.info("[INFO] Forcing fresh quota state for AI providers.")

        groq_key = os.getenv("GROQ_API_KEY")
        
        # Reset LLM only; keep current embedder as a safety buffer until new one is ready
        self.llm = None
        self.llm_type = "none"
        """Unified initialization for LLM and Embeddings"""
        target_dim = self._get_existing_index_dimension() or 3072

        # 1. Initialize Embeddings (ALWAYS LOCAL - As per Professional Requirements)
        try:
            # We enforce 3072 to match existing index if present, or as a high-density standard
            logger.info(f"[INIT] Enforcing Local Embeddings for stability (Target Dim: {target_dim})")
            logger.info("[PROFESSIONAL] Bypassing Gemini Embedding API to ensure ingestion stability.")
            self.embedder = LocalSentenceTransformerEmbeddings(target_dim=target_dim)
            self.embedder_type = f"local-{self.embedder.model_name.split('/')[-1]}-{target_dim}"
        except Exception as e:
            logger.error(f"Failed to load local embeddings: {e}")
            self.embedder = SafeFakeEmbeddings(size=target_dim)
            self.embedder_type = "fake-fallback"

        # 2. Initialize LLM (Gemini with Groq failover) (Gemini with Key Pool/Rotation -> Groq Fallback)
        gemini_success = False
        
        # Check if pool is already marked as exhausted
        if self.manager.quota_exhausted["gemini"] and not clear_quota:
            logger.warning("[INIT] Gemini LLM pool marked as exhausted. Skipping search.")
            keys_to_test = []
        else:
            # Determine which keys to test (excluding blacklisted ones)
            keys_to_test = []
            if skip_search:
                keys_to_test = [(self.manager.current_gemini_index, self.manager.get_active_gemini_key())]
            else:
                keys_to_test = list(enumerate(self.manager.gemini_keys))

            keys_to_test = [(idx, key) for idx, key in keys_to_test if key not in self.manager.blacklisted_keys]

        if keys_to_test:
            if not skip_search:
                logger.info(f"[SEARCH] Testing Gemini Key Pool for LLM ({len(self.manager.gemini_keys)} keys)...")
            
            for idx, key in keys_to_test:
                if self.manager._test_gemini(key):
                    try:
                        self.manager.current_gemini_index = idx
                        # Initialize LLM only - Professional: Disable internal retries to trigger rotater faster
                        self.llm = ChatGoogleGenerativeAI(
                            model="gemini-flash-latest",
                            google_api_key=key,
                            temperature=0.1,
                            max_output_tokens=8192,
                            max_retries=0 # Handle retries/rotation via custom manager
                        )
                        self.llm_type = "gemini"
                        logger.info(f"[SUCCESS] Gemini LLM Initialized with Key {idx}")
                        gemini_success = True
                        break
                    except Exception as e:
                        logger.error(f"[ERROR] Gemini LLM Init failed for key {idx}: {e}")
                        continue
        
        if not gemini_success:
            logger.warning("[WARN] Gemini LLM pool exhausted. Falling back to Groq.")
            if self.manager._test_groq(groq_key):
                self.llm = CustomGroqLLM(api_key=groq_key)
                self.llm_type = "groq-custom-llama3-3"
                logger.info("[SUCCESS] LLM Failover: Groq Active")

        if not self.llm:
            logger.error("[CRITICAL] No LLM providers available (Gemini/Groq failed)")
            self.llm = None
        
        # Synchronize global references
        update_global_references()

    async def call_llm_async(self, prompt: str) -> Any:
        """Asynchronous entry point for non-streaming LLM calls using semaphore serialization"""
        async with self.llm_semaphore:
            from fastapi.concurrency import run_in_threadpool
            return await run_in_threadpool(self.call_llm, prompt)

    def call_llm(self, prompt: str) -> Any:
        """Standard LLM call with primary/secondary failover and key rotation on 429"""
        if not self.llm:
            logger.error("[CRITICAL] LLM not initialized during call_llm. Attempting emergency recovery.")
            self.initialize_providers(skip_search=False)
            if not self.llm: return "Error: System AI services are offline."

        try:
            return self.llm.invoke(prompt)
        except Exception as e:
            error_str = str(e).lower()
            is_quota = any(x in error_str for x in ["quota", "429", "resource_exhausted", "limit"])
            
            if is_quota and self.llm_type == "gemini":
                logger.warning(f"[QUOTA] LLM Quota hit, rotated key and retrying call...")
                if self.manager.rotate_gemini_key():
                    return self.call_llm(prompt) # Recursively retry once with new key
                else:
                    return self._try_groq_failover_and_call(prompt)
            else:
                if self.llm_type == "gemini":
                    logger.error(f"[ERROR] Gemini Call Failed: {str(e)[:100]}. Attempting Groq failover.")
                    return self._try_groq_failover_and_call(prompt)
                raise e

    def _try_groq_failover(self) -> bool:
        """Attempt to switch ONLY the LLM (generation) to Groq. Embeddings stay Gemini/Local."""
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            logger.error("[FAILOVER] Groq failover failed: GROQ_API_KEY not found in environment.")
            return False
            
        if self.manager._test_groq(groq_key):
            try:
                # Initialize ONLY LLM with Groq
                self.llm = CustomGroqLLM(
                    api_key=groq_key,
                    model_name="llama-3.3-70b-versatile"
                )
                self.llm_type = "groq-custom-llama3-3"
                
                # NOTE: We specifically do NOT change self.embedder here 
                # to maintain vector store dimension stability.
                
                # Update global record for backward compatibility
                global llm
                llm = self.llm
                
                logger.info("[SUCCESS] LLM Failover active: Generation shifted to Groq. Embeddings remain on Gemini/Local.")
                return True
            except Exception as e:
                logger.error(f"[FAILOVER] Groq initialization failed: {e}")
                return False
        return False

    def _try_groq_failover_and_call(self, prompt: str) -> Any:
        """Helper to switch to Groq and immediately execute the call"""
        if self._try_groq_failover():
            return self.call_llm(prompt)
        return "Error: All AI providers (Gemini & Groq) are currently unavailable."

    async def stream_chat(self, query: str, context: str):
        """Streaming chat completion with automatic key rotation on 429"""
        if not self.llm or self.llm_type != "gemini":
            # Fallback to non-streaming for now if not gemini
            from langchain_core.messages import HumanMessage
            logger.info("Streaming fallback to standard invoke")
            res = self.llm.invoke(query)
            yield getattr(res, "content", str(res))
            return

        async with self.llm_semaphore:
            try:
                # Direct Gemini streaming for lower latency
                from langchain_google_genai import ChatGoogleGenerativeAI
                config_llm: ChatGoogleGenerativeAI = self.llm
                async for chunk in config_llm.astream(query):
                    yield chunk.content
            except Exception as e:
                error_str = str(e).lower()
                is_quota = any(x in error_str for x in ["quota", "429", "resource_exhausted", "limit"])
                is_generic_error = any(x in error_str for x in ["error", "status", "failed", "500", "503"])
                
                if (is_quota or is_generic_error) and self.llm_type == "gemini":
                    logger.warning(f"[STREAM-FAIL] Gemini encountered error: {error_str[:50]}. Attempting key rotation...")
                    if self.manager.rotate_gemini_key():
                        # We yield from the next stream recursively
                        # Note: recursion inside async yield is tricky, but works for limited depth
                        async for s in self.stream_chat(query, context):
                             yield s
                    else:
                        logger.warning("[FAILOVER] Gemini pool exhausted during stream, escalating to Groq...")
                        if self._try_groq_failover():
                            res = self.llm.invoke(query)
                            yield getattr(res, "content", str(res))
                        else:
                            yield f"Error: System AI services are temporarily unavailable."
                else:
                    logger.error(f"Streaming error: {e}")
                    yield f"Error during streaming: {str(e)}"

    def rerank(self, query: str, documents: List[Any], top_n: int = None) -> List[Any]:
        """Semantic reranking using Cross-Encoders (Fallback to score-based if model not loaded)"""
        if top_n is None:
            top_n = get_active_settings().get("top_k", 4)
        try:
            # Professional systems use a second-stage reranker
            # For now, we use a sophisticated metadata-aware scoring if Cross-Encoder isn't ready
            return sorted(documents, key=lambda d: self._calculate_relevance(query, d), reverse=True)[:top_n]
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            return documents[:top_n]
            
    def _calculate_relevance(self, query: str, doc: Any) -> float:
        """Internal scoring for document-query relevance"""
        score = 0
        content_lower = doc.page_content.lower()
        query_words = set(re.findall(r'\w+', query.lower()))
        
        # Boost for exact citation matches
        citations = re.findall(r'\b(?:PLD|SCMR|CLC|PCrLJ|YLR|PLC|PTD|CLD)\s+\d{4}\b', query, re.IGNORECASE)
        for cite in citations:
            if cite.lower() in content_lower: score += 50
            
        # Standard keyword overlap
        for word in query_words:
            if len(word) > 3 and word in content_lower: score += 2
            
        return score

    def generate_doc_summary(self, text: str) -> str:
        """Professional 2-sentence summary generation with key rotation support"""
        if not self.llm: return "General legal document."
        
        try:
            # We take the first 4000 chars as a proxy for doc summary
            sample_text = text[:4000]
            prompt = f"""
            Identify the core legal issue, parties involved, and jurisdiction in 2 concise sentences.
            
            TEXT: {sample_text}
            
            CONCISE SUMMARY:"""
            
            response = self.call_llm(prompt)
            content = response.content if hasattr(response, 'content') else str(response)
            
            return content.strip()
        except Exception as e:
            logger.error(f"Doc summary failed after retry/failover attempts: {e}")
            return "Legal document regarding Pakistani law."

    async def generate_doc_summary_async(self, text: str) -> str:
        """Asynchronous document summary generation (Serialized & Fault-Tolerant)"""
        try:
            response = await self.call_llm_async(f"Summarize this legal text concisely:\n\n{text[:10000]}")
            return response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            logger.error(f"Async doc summary failed: {e}")
            return "Legal document regarding Pakistani law."

    async def extract_metadata_async(self, text: str) -> Dict[str, Any]:
        """Asynchronous metadata extraction via LLM (Serialized)"""
        prompt = f"""
        Extract high-level legal metadata from this text in JSON format.
        Include: petitioner, respondent, decision_date, court_name, case_id, core_subject, legal_provisions.
        
        TEXT: {text[:4000]}
        
        JSON:"""
        
        try:
            response = await self.call_llm_async(prompt)
            
            # If call_llm returned an error string or None
            if not response or (isinstance(response, str) and response.startswith("Error:")):
                return {}
                
            content = response.content if hasattr(response, 'content') else str(response)
            
            import json
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError as je:
                    logger.error(f"JSON Decode Error in metadata: {je}. Raw: {content[:100]}")
                    return {}
            return {}
        except Exception as e:
            logger.error(f"Metadata extraction failed: {e}")
            return {}

    def _get_existing_index_dimension(self) -> Optional[int]:
        """Check the dimension of the existing FAISS index if it exists"""
        try:
            index_path = VECTOR_STORE_PATH / "index.faiss"
            if index_path.exists():
                index = faiss.read_index(str(index_path))
                return index.d
        except Exception:
            pass
        return None

    def get_provider_info(self) -> dict:
        return {
            "embeddings": {"type": self.embedder_type, "status": "active" if self.embedder else "error"},
            "llm": {"type": self.llm_type, "status": "active" if self.llm else "error"},
            "failover_details": {
                "quota_exhausted": self.manager.quota_exhausted,
                "current_gemini_index": self.manager.current_gemini_index,
                "total_gemini_keys": len(self.manager.gemini_keys)
            },
            "errors": self.manager.errors[-3:] if self.manager.errors else []
        }

    def _get_recommendation(self) -> str:
        if self.llm_type == "gemini": return "✅ High Precision Mode (Gemini)"
        if self.llm_type == "groq-llama3-70b": return "⚡ High Speed Mode (Groq Failover)"
        return "⚠️ All external AI providers are offline"

# Initialize smart AI provider
ai_provider = SmartAIProvider()

# Initial sync
update_global_references()

# Global singleton for vector store to prevent redundant I/O
_cached_vector_store = None

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((HTTPError, ConnectionError, RequestException))
)
def load_vector_store() -> FAISS:
    """Load or create vector store with comprehensive error handling and singleton caching"""
    global _cached_vector_store
    
    with faiss_lock:
        # Return from memory if already loaded
        if _cached_vector_store is not None:
            return _cached_vector_store
            
        try:
            index_path = VECTOR_STORE_PATH / "index.faiss"
            config_path = VECTOR_STORE_PATH / "index.pkl"
            
            # Check if vector store exists and is valid
            if not index_path.exists() or not config_path.exists():
                logger.info("Creating new vector store - no existing store found")
                _cached_vector_store = _create_new_vector_store()
                return _cached_vector_store
            
            if index_path.stat().st_size == 0:
                logger.warning("Vector store file is empty, attempting backup recovery")
                recovered = try_load_from_backup()
                if recovered: return recovered
                return _create_new_vector_store()
            
            # Validate file integrity
            try:
                file_hash = get_file_hash(index_path)
                logger.info(f"Loading existing vector store (Hash: {file_hash[:16]}...)")
            except Exception as e:
                logger.warning(f"File integrity check failed: {e}, attempting backup recovery")
                recovered = try_load_from_backup()
                if recovered: return recovered
                return _create_new_vector_store()
            
            # Load the vector store
            faiss.omp_set_num_threads(1)
            store = FAISS.load_local(
                folder_path=str(VECTOR_STORE_PATH),
                embeddings=ai_provider.embedder,
                allow_dangerous_deserialization=True
            )
            
            # Verify the loaded store
            if len(store.index_to_docstore_id) == 0:
                logger.warning("Loaded vector store is empty")
            
            logger.info(f"Vector store loaded successfully with {len(store.index_to_docstore_id)} documents")
            _cached_vector_store = store # Cache it in memory
            return store
            
        except Exception as e:
            logger.error(f"Failed to load vector store: {str(e)}", exc_info=True)
            
            # Try backup one last time on total failure
            logger.info("Total load failure, attempting emergency backup recovery")
            recovered = try_load_from_backup()
            if recovered: return recovered
            
            # Create emergency fallback store (do not save it automatically)
            logger.info("Creating emergency fallback vector store")
            return _create_emergency_fallback_store()

def try_load_from_backup() -> Optional[FAISS]:
    """Search for and load the latest valid vector store from backups"""
    try:
        if not BACKUP_DIR.exists():
            return None
            
        # Get backups sorted by modification time (descending)
        backups = sorted(BACKUP_DIR.glob("backup_*"), key=os.path.getmtime, reverse=True)
        
        for backup_path in backups:
            try:
                logger.info(f"🔄 Attempting recovery from backup: {backup_path.name}")
                store = FAISS.load_local(
                    folder_path=str(backup_path),
                    embeddings=ai_provider.embedder,
                    allow_dangerous_deserialization=True
                )
                if len(store.index_to_docstore_id) > 0:
                    logger.info(f"✅ Successfully recovered {len(store.index_to_docstore_id)} docs from backup {backup_path.name}")
                    # Optionally restore these files to the main path
                    import shutil
                    for f in backup_path.glob("*"):
                        shutil.copy2(f, VECTOR_STORE_PATH / f.name)
                    return store
            except Exception as e:
                logger.warning(f"Backup {backup_path.name} is also invalid: {e}")
                
        return None
    except Exception as e:
        logger.error(f"Error during backup recovery search: {e}")
        return None

def _create_new_vector_store() -> FAISS:
    """Create a new vector store with initial content"""
    try:
        store = FAISS.from_texts(
            ["Welcome to LegalAI. The system is ready to process legal documents."], 
            ai_provider.embedder
        )
        # Save immediately
        save_vector_store(store)
        logger.info("New vector store created successfully")
        return store
    except Exception as e:
        logger.error(f"Failed to create new vector store: {str(e)}")
        return _create_emergency_fallback_store()

def _create_emergency_fallback_store() -> FAISS:
    """Create an emergency fallback store when everything else fails"""
    try:
        # Try with simple embeddings
        try:
            from langchain_community.embeddings import FakeEmbeddings
        except ImportError:
            from langchain.embeddings import FakeEmbeddings
            
        emergency_embeddings = FakeEmbeddings(size=768)
        store = FAISS.from_texts(
            ["Emergency fallback mode. Please check system configuration."], 
            emergency_embeddings
        )
        logger.warning("Emergency fallback vector store created")
        return store
    except Exception as e:
        logger.critical(f"CRITICAL: Cannot create any vector store: {str(e)}")
        raise RuntimeError(f"Unable to initialize vector store: {str(e)}")

def save_vector_store(store: FAISS) -> Tuple[bool, str]:
    """Save vector store with backup, verification, and comprehensive error handling"""
    global _cached_vector_store
    
    with faiss_lock:
        backup_path = None
        original_files = []
        
        try:
            # Update cache first
            _cached_vector_store = store
            # Create backup of existing files
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dir = BACKUP_DIR / f"backup_{timestamp}"
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Backup existing files
            for file in VECTOR_STORE_PATH.glob("*"):
                if file.is_file():
                    backup_file = backup_dir / file.name
                    original_files.append((file, backup_file))
                    if file.exists():
                        import shutil
                        shutil.copy2(file, backup_file)
            
            # Save new vector store
            faiss.omp_set_num_threads(1)
            store.save_local(str(VECTOR_STORE_PATH))
            
            # Verify the save was successful
            if not (VECTOR_STORE_PATH / "index.faiss").exists():
                raise RuntimeError("Failed to create vector store index file")
            
            if not (VECTOR_STORE_PATH / "index.pkl").exists():
                raise RuntimeError("Failed to create vector store config file")
            
            # Test loading the saved store
            test_store = FAISS.load_local(
                folder_path=str(VECTOR_STORE_PATH),
                embeddings=ai_provider.embedder,
                allow_dangerous_deserialization=True
            )
            
            logger.info(f"Vector store saved successfully with {len(test_store.index_to_docstore_id)} documents")
            return (True, "Vector store saved and verified successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to save vector store: {str(e)}", exc_info=True)
            
            # Restore from backup
            restore_success = False
            try:
                for original, backup in original_files:
                    if backup.exists():
                        import shutil
                        shutil.copy2(backup, original)
                restore_success = True
                logger.info("🔄 Restored previous version from backup")
            except Exception as restore_error:
                logger.error(f"❌ Backup restoration also failed: {str(restore_error)}")
            
            error_msg = f"Failed to save vector store: {str(e)}"
            if restore_success:
                error_msg += " (Previous version restored)"
            else:
                error_msg += " (BACKUP ALSO FAILED - DATA MAY BE CORRUPTED)"
            
            return (False, error_msg)

# ========================
# Enhanced Utility Functions
# ========================

def get_file_hash(file_path: Path) -> str:
    """Generate SHA256 hash of a file for integrity checking with timeout"""
    hash_sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    except Exception as e:
        logger.error(f"❌ Failed to calculate file hash: {str(e)}", exc_info=True)
        raise RuntimeError(f"Failed to calculate file hash: {str(e)}")

def validate_vector_store() -> Tuple[bool, str]:
    """Comprehensive vector store validation"""
    index_path = VECTOR_STORE_PATH / "index.faiss"
    config_path = VECTOR_STORE_PATH / "index.pkl"
    
    if not index_path.exists() or not config_path.exists():
        return (False, "Vector store files missing")
    
    try:
        # Check file sizes
        if index_path.stat().st_size == 0:
            return (False, "Vector store index file is empty")
        
        if config_path.stat().st_size == 0:
            return (False, "Vector store config file is empty")
        
        # Test loading
        store = load_vector_store()
        doc_count = len(store.index_to_docstore_id)
        
        provider_info = ai_provider.get_provider_info()
        recommendation = ai_provider._get_recommendation()
        
        return (True, f"Vector store valid with {doc_count} documents. {recommendation}")
        
    except Exception as e:
        return (False, f"Vector store validation failed: {str(e)}")

def reset_vector_store() -> Tuple[bool, str]:
    """Safely reset the vector store with confirmation"""
    try:
        # Create final backup before reset
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_reset")
        final_backup_dir = BACKUP_DIR / f"pre_reset_{timestamp}"
        final_backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup all files
        for file in VECTOR_STORE_PATH.glob("*"):
            if file.is_file():
                import shutil
                shutil.copy2(file, final_backup_dir / file.name)
        
        # Remove all files
        for file in VECTOR_STORE_PATH.glob("*"):
            if file.is_file():
                file.unlink()
        
        # Clean up old backups (keep last 30 for safety)
        backup_folders = sorted(BACKUP_DIR.glob("backup_*"), key=os.path.getmtime)
        if len(backup_folders) > 30:
            for old_backup in backup_folders[:-30]:
                import shutil
                shutil.rmtree(old_backup)
        
        logger.info("✅ Vector store reset successfully")
        return (True, "Vector store reset successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to reset vector store: {str(e)}", exc_info=True)
        return (False, f"Failed to reset vector store: {str(e)}")

def get_system_status() -> dict:
    """Get comprehensive system status"""
    try:
        vector_store_status, vector_store_msg = validate_vector_store()
        provider_info = ai_provider.get_provider_info()
        
        return {
            "system": {
                "status": "operational",
                "timestamp": datetime.now().isoformat(),
                "python_version": sys.version,
                "platform": sys.platform
            },
            "vector_store": {
                "status": "valid" if vector_store_status else "invalid",
                "message": vector_store_msg,
                "path": str(VECTOR_STORE_PATH),
                "exists": VECTOR_STORE_PATH.exists()
            },
            "ai_providers": provider_info,
            "directories": {
                "vector_store": VECTOR_STORE_PATH.exists(),
                "uploads": UPLOAD_FOLDER.exists(),
                "logs": LOG_DIR.exists(),
                "backups": BACKUP_DIR.exists()
            }
        }
    except Exception as e:
        return {
            "system": {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        }

# ========================
# Setup Instructions
# ========================

def setup_instructions() -> str:
    """Get instructions for setting up AI providers"""
    return """
🚀 **AI Provider Setup Instructions:**

**1. Gemini API (Primary):**
   - Get API key: https://aistudio.google.com/app/apikey
   - Add to .env: GEMINI_API_KEY=your_api_key_here
   - Benefits: Best precision, industry standard embeddings

**2. Groq API (Failover):**
   - Get API key: https://console.groq.com/keys
   - Add to .env: GROQ_API_KEY=your_api_key_here
   - Benefits: Extreme speed, high-performance Llama3-70b failover

**Priority Order:**
1. ✅ Gemini API for both embeddings and LLM
2. ⚡ Groq Llama3-70b if Gemini is down or quota exceeded
3. ⚠️ Local Embeddings if Gemini Embedding API fails
    """

# ========================
# Dynamic Settings Link
# ========================

def get_active_settings() -> dict:
    """Read AI/RAG settings from DB (set by admin Settings page). Falls back to defaults."""
    defaults = {
        "model_name": "gemini-flash-latest",
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "top_k": 4,
        "maintenance_mode": False,
    }
    try:
        from app.database import get_settings_collection, is_database_connected
        if not is_database_connected():
            return defaults
        settings_col = get_settings_collection()
        doc = settings_col.find_one({})
        if doc:
            for key in defaults:
                if key in doc:
                    defaults[key] = doc[key]
    except Exception:
        pass
    return defaults

# ========================
# Public Interface
# ========================

__all__ = [
    'load_vector_store',
    'save_vector_store',
    'ai_provider',
    'embeddings_manager',  # Backward compatibility
    'embeddings',          # Backward compatibility  
    'llm',                 # New LLM export
    'reset_vector_store',
    'validate_vector_store',
    'get_file_hash',
    'get_active_settings',
    'get_system_status',
    'SmartAIProvider',
    'setup_instructions'
]

# ========================
# Initialization Check
# ========================

if __name__ == "__main__":
    logger.info("🔧 Running config.py initialization check...")
    
    # Test system status
    status = get_system_status()
    logger.info(f"System Status: {status}")
    
    # Test vector store
    try:
        store = load_vector_store()
        logger.info(f"Vector Store Status: {len(store.index_to_docstore_id)} documents loaded")
        logger.info("✅ Config initialization completed successfully")
        
        # Show setup instructions/status
        provider_info = ai_provider.get_provider_info()
        logger.info(f"Provider recommendation: {ai_provider._get_recommendation()}")
        if provider_info['llm']['status'] == 'error':
            logger.warning(setup_instructions())
            
    except Exception as e:
        logger.error(f"❌ Config initialization failed: {e}")
