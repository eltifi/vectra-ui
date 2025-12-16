/**
 * @file route.ts
 * @brief Proxy API route for fetching road segments with Redis caching
 * @details
 * Acts as a caching layer for the backend /segments endpoint.
 * Checks Redis cache first; if miss, fetches from backend and caches result.
 * reducing load on the backend and speeding up frontend data delivery.
 * 
 * @author Vectra Project
 * @date 2025-12-13
 */

import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;
const CACHE_KEY = 'frontend:segments:geojson';

export async function GET() {

    // 1. Check Redis Cache (Fail safely)
    if (redis) {
        try {
            const cachedData = await redis.get(CACHE_KEY);
            if (cachedData) {
                console.log('Redis Cache HIT for segments');
                return NextResponse.json(JSON.parse(cachedData));
            }
        } catch (redisError) {
            console.warn('Redis cache get failed, falling back to live API:', redisError);
            // Continue to fetch from backend
        }
    }

    try {
        // 2. Fetch from Backend
        // Use internal API_URL if available (Docker), else public URL
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/segments`, {
            cache: 'no-store' // Don't use Next.js fetch cache, we manage it manually
        });

        if (!response.ok) {
            // Propagate backend errors (like 503 Maintenance) to frontend
            return NextResponse.json(
                { error: `Backend error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // 3. Store in Redis Cache (Fail safely)
        if (redis) {
            try {
                await redis.set(CACHE_KEY, JSON.stringify(data), 'EX', CACHE_TTL);
                console.log('Redis Cache SET for segments');
            } catch (redisError) {
                console.warn('Redis cache set failed:', redisError);
                // Ignore redis write errors, serve data to user
            }
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching segments:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve segments data' },
            { status: 503 } // Service Unavailable if we can't even reach backend
        );
    }
}

