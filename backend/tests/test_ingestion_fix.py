import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_path))

from app.config import ai_provider

async def verify_ingestion_methods():
    print("Verifying missing async methods in SmartAIProvider...")
    
    test_text = "The Supreme Court of Pakistan ruled in favor of the petitioner in the case of Smith vs. State, 2024 SCMR 1."
    
    try:
        print("\nTesting generate_doc_summary_async...")
        summary = await ai_provider.generate_doc_summary_async(test_text)
        print(f"Summary: {summary}")
        
        print("\nTesting extract_metadata_async...")
        metadata = await ai_provider.extract_metadata_async(test_text)
        print(f"Metadata: {metadata}")
        
        print("\nVerifying method existence for DocumentProcessor...")
        if hasattr(ai_provider, 'generate_doc_summary_async'):
            print("SUCCESS: generate_doc_summary_async found!")
        else:
            print("FAIL: generate_doc_summary_async NOT found!")
            
        if hasattr(ai_provider, 'extract_metadata_async'):
            print("SUCCESS: extract_metadata_async found!")
        else:
            print("FAIL: extract_metadata_async NOT found!")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(verify_ingestion_methods())
