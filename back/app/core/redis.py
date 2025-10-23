import redis
from typing import Optional, Union, Any
import json

from app.core.config import settings

# Create Redis client
redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    encoding='utf-8'
)


class RedisCache:
    """Redis cache wrapper with JSON serialization."""
    
    def __init__(self, client: redis.Redis = redis_client):
        self.client = client
        self.default_ttl = settings.REDIS_CACHE_TTL
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            value = self.client.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception:
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache with TTL."""
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value, default=str)
            return self.client.setex(key, ttl, serialized)
        except Exception:
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            return bool(self.client.delete(key))
        except Exception:
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return bool(self.client.exists(key))
        except Exception:
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception:
            return 0


# Global cache instance
cache = RedisCache()


def get_redis() -> redis.Redis:
    """Get Redis client."""
    return redis_client