/**
 * @file redis.ts
 * @brief Singleton Redis client for server-side usage
 * @details
 * initializes a global Redis instance to prevent connection leaks
 * in serverless/hot-reload environments like Next.js.
 * 
 * @author Vectra Project
 * @date 2025-12-13
 */

import Redis from 'ioredis';

// Singleton Redis instance for server-side usage
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';

let redis: Redis | undefined;

if (typeof window === 'undefined') {
    // Only initialize on server side
    if (!global.redisGlobal) {
        // Force IPv4 to avoid Node 17+ localhost resolution issues (AggregateError)
        global.redisGlobal = new Redis(redisUrl, { family: 4 });
    }
    redis = global.redisGlobal;
}

export default redis;

// Global type augmentation to prevent multiple instances in dev
declare global {
    var redisGlobal: Redis | undefined;
}
