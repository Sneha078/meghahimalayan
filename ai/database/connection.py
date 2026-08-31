"""
MongoDB connection for the AI service.

The AI service connects to the same MongoDB Atlas database
used by the MegaHimalayan backend.
"""

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from shared.config import settings


_client: MongoClient | None = None

def get_client() -> MongoClient:
    """Return a singleton MongoClient, creating it on first use."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI)
    return _client

def get_db() -> Database:
    return get_client()[settings.MONGODB_DATABASE]

def get_products_collection() -> Collection:
    return get_db()["products"]


def check_database_connection() -> bool:
    """
    Check whether MongoDB is reachable.
    """

    try:
        get_client().admin.command("ping")
        return True

    except Exception as exc:
        print(f"MongoDB connection failed: {exc}")
        return False

# backwards-compatible module-level accessors for existing callers.
# These are properties-via-function-call, not eager connections.
class _LazyCollectionProxy:
    """Delays the actual MogoClient/collection creation until first attribute access."""

    def __getattr__(self, name):
        return getattr(get_products_collection(), name)

        def __call__(self, *args, **kwargs):
            return get_products_collection()(*args, **kwargs)

products_collection = _LazyCollectionProxy()