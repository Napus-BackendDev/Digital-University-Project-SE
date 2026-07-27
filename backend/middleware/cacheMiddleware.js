const redisClient = require("../helpers/redis");

/**
 * Cache middleware factory.
 * @param {number} ttl - Cache duration in seconds (default: 300)
 */
function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        // Skip caching for non-GET requests unless explicitly configured
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = `cache:${req.originalUrl || req.url}`;

        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (error) {
            console.warn(`[CacheMiddleware] Get failed for ${cacheKey}:`, error.message);
        }

        // Cache miss: Intercept res.json to capture response payload
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (res.statusCode === 200 && data) {
                redisClient.setEx(cacheKey, ttl, JSON.stringify(data)).catch((err) => {
                    console.warn(`[CacheMiddleware] Set failed for ${cacheKey}:`, err.message);
                });
            }
            res.setHeader('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
}

module.exports = { cacheMiddleware };
