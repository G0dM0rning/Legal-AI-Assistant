from app.database import get_semantic_cache_collection
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def purge_cache():
    try:
        col = get_semantic_cache_collection()
        count = col.count_documents({})
        col.delete_many({})
        logger.info(f"[SUCCESS] Purged {count} entries from semantic cache.")
    except Exception as e:
        logger.error(f"[ERROR] Failed to purge cache: {e}")

if __name__ == "__main__":
    purge_cache()
