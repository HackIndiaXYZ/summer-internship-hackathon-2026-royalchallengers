const { Redis } = require('@upstash/redis');
require('dotenv').config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function getCache(key) {
  try {
    const data = await redis.get(key);
    if (data) {
      console.log(`[Cache HIT] Key: ${key}`);
      return data;
    }
    console.log(`[Cache MISS] Key: ${key}`);
    return null;
  } catch (err) {
    console.warn('[Cache] Redis Error:', err.message);
    return null;
  }
}

async function setCache(key, value, expireInSeconds = 3600) {
  try {
    await redis.set(key, value, { ex: expireInSeconds });
    console.log(`[Cache SET] Key: ${key}, Expire: ${expireInSeconds}s`);
  } catch (err) {
    console.warn('[Cache] Redis Error:', err.message);
  }
}

module.exports = { getCache, setCache };
