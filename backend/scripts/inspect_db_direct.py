import sys
import os
import asyncio
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "legal_ai")

def inspect_db():
    print(f"[INFO] Connecting to MongoDB: {DB_NAME}")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # 1. Inspect system_settings
    settings = db.system_settings.find_one({})
    if settings:
        print("\n[SUCCESS] System Settings found:")
        print(f"  JWT Secret exists: {'jwt_secret_key' in settings}")
        print(f"  Revoke before: {settings.get('revoke_all_before')}")
        print(f"  Top K: {settings.get('top_k')}")
    else:
        print("\n[WARNING] No System Settings found in database.")

    # 2. Inspect semantic_cache
    cache_entries = list(db.semantic_cache.find({}).limit(5))
    print(f"\n[INFO] Found {db.semantic_cache.count_documents({})} cache entries.")
    for i, entry in enumerate(cache_entries):
        ans = entry.get('answer', '')
        print(f"Entry {i+1}:")
        print(f"  Query: {entry.get('query')[:50]}...")
        print(f"  Answer Length: {len(ans)}")
        print(f"  Answer Start: {ans[:100]}...")
        print("-" * 20)

    # 3. Inspect admins
    admin_count = db.admins.count_documents({})
    print(f"\n[INFO] Total Admin users: {admin_count}")
    if admin_count > 0:
        admin = db.admins.find_one({})
        print(f"  Sample Admin Email: {admin.get('email')}")
        print(f"  Is Active: {admin.get('is_active')}")

if __name__ == "__main__":
    inspect_db()
