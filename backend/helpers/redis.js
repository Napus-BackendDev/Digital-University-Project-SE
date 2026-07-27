const redis = require("redis");

class RedisClient {
    constructor() {
        const host = process.env.REDIS_HOST || (process.env.NODE_ENV === 'production' ? 'redis' : '127.0.0.1');
        const port = process.env.REDIS_PORT || 6379;

        this.isConnected = false;
        this.client = redis.createClient({
            socket: {
                host,
                port: Number(port),
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.warn("[Redis] Maximum reconnect attempts reached. Redis caching disabled.");
                        return false;
                    }
                    return Math.min(retries * 500, 3000);
                }
            }
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log(`[Redis] Connected successfully to ${host}:${port}`);
        });

        this.client.on('error', (err) => {
            this.isConnected = false;
            console.warn(`[Redis] Warning: ${err.message}`);
        });

        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
        } catch (error) {
            this.isConnected = false;
            console.warn("[Redis] Could not connect to Redis server:", error.message);
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch (error) {
            console.warn(`[Redis] Error fetching key ${key}:`, error.message);
            return null;
        }
    }

    async setEx(key, ttl, value) {
        if (!this.isConnected) return;
        try {
            await this.client.setEx(key, ttl, value);
        } catch (error) {
            console.warn(`[Redis] Error setting key ${key}:`, error.message);
        }
    }

    async delete(key) {
        if (!this.isConnected) return;
        try {
            await this.client.del(key);
        } catch (error) {
            console.warn(`[Redis] Error deleting key ${key}:`, error.message);
        }
    }

    async delPattern(pattern) {
        if (!this.isConnected) return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys && keys.length > 0) {
                await this.client.del(keys);
                console.log(`[Redis] Invalidated ${keys.length} keys matching pattern: ${pattern}`);
            }
        } catch (error) {
            console.warn(`[Redis] Error deleting pattern ${pattern}:`, error.message);
        }
    }
}

module.exports = new RedisClient();
