import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_db_connection():
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "legal_ai")
    
    if not mongo_uri:
        print("MONGO_URI not found in .env")
        return

    print(f"Testing connection to MongoDB...")
    try:
        client = AsyncIOMotorClient(
            mongo_uri,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        
        await client.admin.command('ping')
        print("SUCCESS: MongoDB connection verified with new timeout settings.")
        
    except Exception as e:
        print(f"FAILURE: Could not connect to MongoDB: {e}")

if __name__ == "__main__":
    asyncio.run(test_db_connection())
