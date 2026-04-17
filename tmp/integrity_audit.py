
import os
import sys
import logging
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.config import load_vector_store, ai_provider, validate_vector_store
from backend.app.database import get_training_collection, is_database_connected

# Use ASCII for logging to avoid Windows CP1252 issues
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger("IntegrityCheck")

def run_checks():
    logger.info("[AUDIT] Starting Professional AI/ML Integrity Audit...")
    
    # 1. Vector Store Integrity
    logger.info("Checking Vector Store...")
    valid, msg = validate_vector_store()
    if not valid:
        logger.error(f"[FAILURE] Vector Store Invalid: {msg}")
    else:
        logger.info(f"[SUCCESS] Vector Store Verified: {msg}")
        store = load_vector_store()
        logger.info(f"Summary: Current Vector Count = {len(store.index_to_docstore_id)}")

    # 2. Database Connectivity & Audit Trail
    logger.info("Checking MongoDB Audit Trail...")
    if is_database_connected():
        try:
            training_col = get_training_collection()
            doc_count = training_col.count_documents({})
            logger.info(f"[SUCCESS] MongoDB Audit Log holds {doc_count} document records")
            
            # Check for processing stuck jobs
            stuck_jobs = training_col.count_documents({"status": "processing"})
            if stuck_jobs > 0:
                logger.warning(f"[WARN] Found {stuck_jobs} documents stuck in 'processing' status")
            else:
                logger.info("[SUCCESS] No stuck ingestion jobs found")
        except Exception as e:
            logger.error(f"[FAILURE] Database Audit Check failed: {e}")
    else:
        logger.error("[FAILURE] Database not connected - Audit check skipped")

    # 3. AI Provider Compatibility
    logger.info("Checking AI Provider Stability...")
    info = ai_provider.get_provider_info()
    logger.info(f"Embedder: {info['embeddings']['type']} ({info['embeddings']['status']})")
    logger.info(f"LLM: {info['llm']['type']} ({info['llm']['status']})")
    
    if info['embeddings']['status'] != 'active':
        logger.error("[FAILURE] Embedder is NOT active. Retrieval will fail.")
    else:
        logger.info("[SUCCESS] Embedder operational")

    logger.info("[AUDIT] Complete.")

if __name__ == "__main__":
    run_checks()
