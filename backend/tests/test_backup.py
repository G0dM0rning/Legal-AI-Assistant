import sys
import os
from pathlib import Path
import faiss

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from langchain_community.vectorstores import FAISS
from app.config import ai_provider

def verify_backup(backup_path: str):
    print(f"[INFO] Testing backup: {backup_path}")
    try:
        store = FAISS.load_local(
            folder_path=backup_path,
            embeddings=ai_provider.embedder,
            allow_dangerous_deserialization=True
        )
        doc_count = len(store.index_to_docstore_id)
        print(f"[SUCCESS] Loaded store with {doc_count} documents.")
        return True, doc_count
    except Exception as e:
        print(f"[FAIL] Failed to load backup: {e}")
        return False, 0

if __name__ == "__main__":
    backups = [
        "data/backups/backup_20260301_040523",
        "data/backups/backup_20260301_040521",
        "data/backups/backup_20260301_035533"
    ]
    
    for b in backups:
        success, count = verify_backup(b)
        if success:
            print(f"Candidate found: {b} with {count} docs")
