import redis.asyncio as redis
import os

r = redis.from_url(os.getenv("UPSTASH_REDIS_URL"), decode_responses=True)
