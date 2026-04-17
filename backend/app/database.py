# app/database.py
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import logging
from typing import Optional, Union
import asyncio
import time
import certifi

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.MONGO_URI = os.getenv("MONGO_URI")
        if not self.MONGO_URI:
            raise RuntimeError("MONGO_URI environment variable is required. Set it in .env file.")
        self.DB_NAME = os.getenv("DB_NAME", "legal_ai")
        self.client = None
        self.db = None
        self.is_connected = False
        # Connection is established lazily via get_db() to avoid blocking startup

    async def connect(self, max_retries: int = 5, delay: int = 5):
        """Establish database connection with retry logic (Async)"""
        if self.is_connected:
            return

        # Check for placeholder password
        if "<db_password>" in self.MONGO_URI:
            logger.error("[CRITICAL] MONGO_URI contains '<db_password>' placeholder.")
            self.is_connected = False
            return

        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting MongoDB connection (attempt {attempt + 1}/{max_retries})...")
                
                connection_string = self.MONGO_URI
                if "?" not in connection_string:
                    connection_string += "?retryWrites=true&w=majority&appName=LegalAI"
                
                self.client = AsyncIOMotorClient(
                    connection_string,
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=20000,
                    socketTimeoutMS=20000,
                    maxPoolSize=50,
                    minPoolSize=10,
                    retryWrites=True,
                    retryReads=True,
                    tls=True,
                    tlsAllowInvalidCertificates=True,  # Helpful for some network environments
                    tlsCAFile=certifi.where()
                )
                
                # Test connection (Async ping)
                await self.client.admin.command('ping')
                self.db = self.client[self.DB_NAME]
                self.is_connected = True
                
                logger.info("[SUCCESS] MongoDB async connection established successfully")
                await self._create_indexes()
                return
                
            except Exception as e:
                logger.warning(f"[FAILURE] MongoDB connection attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"[CRITICAL] All MongoDB async connection attempts failed. Please verify your MONGO_URI and network connectivity.")
                    self.is_connected = False

    async def _create_indexes(self):
        """Create necessary database indexes (Async)"""
        try:
            if not self.is_connected:
                return
                
            # Use async index creation
            await self.db.users.create_index("email", unique=True)
            await self.db.admins.create_index("email", unique=True)
            await self.db.training_documents.create_index("uploadDate")
            await self.db.training_documents.create_index("status")
            await self.db.documents.create_index("document_id")
            await self.db.conversations.create_index([("user_id", 1), ("updated_at", -1)])
            await self.db.semantic_cache.create_index("query_hash", unique=True)
            await self.db.semantic_cache.create_index("created_at")
            
            logger.info("[SUCCESS] Database indexes created asynchronously")
        except Exception as e:
            logger.error(f"[ERROR] Error creating indexes: {e}")

    async def get_collection(self, collection_name: str):
        """Get database collection (Async)"""
        if not self.is_connected:
            await self.connect()
        
        if self.db is None:
            raise RuntimeError("Database not initialized")
            
        return self.db[collection_name]

    async def check_connection(self) -> bool:
        """Check if database connection is alive (Async)"""
        try:
            if self.client and self.is_connected:
                await self.client.admin.command('ping')
                return True
        except Exception:
            self.is_connected = False
        return False

# Global database instance
db_manager = DatabaseManager()

# Collection references - NOW ASYNC
async def get_users_collection():
    return await db_manager.get_collection("users")

async def get_admins_collection():
    return await db_manager.get_collection("admins")

async def get_training_collection():
    return await db_manager.get_collection("training_documents")

async def get_support_collection():
    return await db_manager.get_collection("support_tickets")

async def get_settings_collection():
    return await db_manager.get_collection("system_settings")

async def get_documents_collection():
    return await db_manager.get_collection("documents")

async def get_conversations_collection():
    return await db_manager.get_collection("conversations")

async def get_semantic_cache_collection():
    return await db_manager.get_collection("semantic_cache")

def is_database_connected() -> bool:
    return db_manager.is_connected