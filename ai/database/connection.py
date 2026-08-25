"""
MongoDB connection for the AI service.

The AI service connects to the same MongoDB Atlas database
used by the MegaHimalayan backend.
"""

from pymongo import MongoClient
from shared.config import settings


client = MongoClient(settings.MONGODB_URI)

db = client[settings.MONGODB_DATABASE]

products_collection = db["products"]


def check_database_connection() -> bool:
    """
    Check whether MongoDB is reachable.
    """

    try:
        client.admin.command("ping")
        return True

    except Exception as exc:
        print(f"MongoDB connection failed: {exc}")
        return False