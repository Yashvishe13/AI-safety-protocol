# backend/services/database.py
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    """Simple MongoDB connection for SentinelAI"""
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        """Get MongoDB database instance"""
        if cls._db is None:
            try:
                mongo_uri = os.getenv('MONGO_URI')
                db_name = os.getenv('DB_NAME', 'sentinelai')

                if not mongo_uri:
                    raise ValueError("MONGO_URI not found in .env file")

                print('🔄 Connecting to MongoDB Atlas...')
                cls._client = MongoClient(mongo_uri)

                # Test connection
                cls._client.admin.command('ping')

                cls._db = cls._client[db_name]
                print(f'✅ Connected to MongoDB: {db_name}')

            except ConnectionFailure as e:
                print(f'❌ MongoDB connection failed: {e}')
                raise
            except Exception as e:
                print(f'❌ Error: {e}')
                raise

        return cls._db

    @classmethod
    def get_traces_collection(cls):
        """Get traces collection"""
        return cls.get_db()['traces']

# Initialize
db = Database.get_db()
traces_collection = Database.get_traces_collection()
