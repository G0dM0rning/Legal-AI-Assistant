from app.database import get_semantic_cache_collection
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def inspect_cache():
    try:
        col = get_semantic_cache_collection()
        entries = list(col.find({}))
        print(f"Total cache entries: {len(entries)}")
        for i, entry in enumerate(entries[:5]):
            print(f"Entry {i+1}:")
            print(f"  Query: {entry.get('query')}")
            print(f"  Answer Length: {len(entry.get('answer', ''))}")
            print(f"  Answer Preview: {entry.get('answer', '')[:100]}...")
            print("-" * 20)
    except Exception as e:
        logger.error(f"Failed to inspect cache: {e}")

if __name__ == "__main__":
    inspect_cache()
