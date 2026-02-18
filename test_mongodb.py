#!/usr/bin/env python
import json
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Load config
config_defaults = {
    "database": {"connection_string": "mongodb://localhost:27017"}
}

config_path = os.path.join(os.path.dirname(__file__), 'config.json')
try:
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
        if isinstance(config.get("database"), dict):
            config_defaults["database"].update(config["database"])
except Exception as e:
    print(f"Error loading config: {e}")

config = config_defaults
uri = os.environ.get("MONGODB_URI", config["database"]["connection_string"])

print("=" * 70)
print("[TEST] MongoDB Connection Diagnostic")
print("=" * 70)
print(f"URI (first 80 chars): {uri[:80]}")
print()

print("[TEST] Attempting connection...")
try:
    client = MongoClient(uri, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✓ SUCCESS: Connected to MongoDB!")
    
    db = client['habits_tracker']
    collections = db.list_collection_names()
    print(f"✓ Database 'habits_tracker' accessible")
    print(f"✓ Collections: {collections}")
    
except Exception as e:
    print(f"✗ FAILED: {type(e).__name__}")
    print(f"✗ Message: {str(e)}")
    print()
    print("Possible solutions:")
    print("1. Check if MongoDB Atlas whitelist includes your IP")
    print("2. Verify database credentials in config.json")
    print("3. Check internet connection")
    print("4. Try using a different MongoDB URI")

print("=" * 70)
