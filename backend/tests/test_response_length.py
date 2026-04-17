import os
import sys
import logging
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_path))

from app.config import ai_provider

# Configure logging
logging.basicConfig(level=logging.INFO)

async def test_response_length():
    prompt = """
    Write an extremely detailed and comprehensive legal analysis of the Anti-Rape (Investigation and Trial) Act, 2021 in Pakistan.
    Your response must be very long and exhaustive, covering:
    1. Full legislative history and constitutional basis.
    2. Detailed breakdown of all institutional mechanisms (ARCC, SSOIU).
    3. Comprehensive analysis of procedural reforms (Two-finger test abolition, etc.).
    4. Victim protection mechanisms and identity safeguarding.
    5. Detailed discussion on the controversial chemical castration provision.
    6. Future implications and judicial oversight.
    
    Please ensure the response is as long as possible to test our new token limits.
    """
    
    print("Triggering long LLM call to verify token limits...")
    
    try:
        # call_llm is synchronous, as it internally uses run_in_threadpool
        response = ai_provider.call_llm(prompt)
        content = response.content if hasattr(response, 'content') else str(response)
        
        length_chars = len(content)
        # Approximate tokens (4 chars per token)
        approx_tokens = length_chars / 4
        
        print(f"Response received!")
        print(f"Length: {length_chars} characters")
        print(f"Approx Tokens: {approx_tokens:.0f}")
        
        if approx_tokens > 2048:
             print("SUCCESS: Response exceeds the old 2048 token limit!")
        else:
             print("WARNING: Response is still within the old limit. This might be due to the LLM's own brevity or the limit not being applied.")
             
        # Check for natural conclusion
        if content.strip().endswith((".", "!", "?", "]", "}", ")")):
            print("Response seems to have a natural conclusion.")
        else:
            print("Response might still be truncated (doesn't end with punctuation).")

    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_response_length())
