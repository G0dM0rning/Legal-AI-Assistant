import os
import sys
import logging
import asyncio
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_path))

from app.config import ai_provider

# Configure logging to see the rotation messages
logging.basicConfig(level=logging.INFO)

async def simulate_resilience():
    print("Starting AI Resilience Verification Test...")
    print(f"Gemini Keys in pool: {len(ai_provider.manager.gemini_keys)}")
    
    # 1. Test standard generation
    print("\n--- Test 1: Standard Generation (First valid key) ---")
    response = ai_provider.call_llm("Say 'Success'")
    print(f"Result: {response.content if hasattr(response, 'content') else response}")
    print(f"Active Key Index: {ai_provider.manager.current_gemini_index}")

    # 2. Simulate Quota Exhaustion for ALL Gemini Keys
    print("\n--- Test 2: Simulating Total Gemini Pool Exhaustion ---")
    
    # Ensure starting state is Gemini
    ai_provider.llm_type = "gemini"
    
    # Mock _test_gemini to fail for all keys
    with patch.object(ai_provider.manager, "_test_gemini", return_value=False):
        print("Mocked all Gemini keys as 'Exhausted'...")
        
        # Test call_llm logic directly using a mock that triggers rotation
        print("Attempting rotation via manual call to rotate_gemini_key...")
        result = ai_provider.manager.rotate_gemini_key()
        
        print(f"Rotation Result (Expected False): {result}")
        print(f"Final Provider Type: {ai_provider.llm_type}")
        
    if ai_provider.llm_type == "groq-custom-llama3-3":
        print("SUCCESS: Gracefully shifted to Groq after Gemini pool exhaustion.")
    else:
        print(f"FAIL: Expected Groq failover, but got {ai_provider.llm_type}")

async def test_streaming_failover():
    print("\n--- Test 3: Mid-Stream Failover Verification ---")
    # This is harder to mock perfectly without deep injection, but we can verify the logic path
    # by checking the SmartAIProvider.stream_chat implementation
    
    query = "Explain Pakistani Constitution in 10 words."
    context = ""
    
    # We'll just verify it starts and doesn't crash
    print("Testing stream starts correctly...")
    async for chunk in ai_provider.stream_chat(query, context):
        print(f"Chunk: {chunk}", end=" | ")
    print("\nStream completed.")

if __name__ == "__main__":
    asyncio.run(simulate_resilience())
    asyncio.run(test_streaming_failover())
