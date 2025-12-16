/**
 * @file route.ts
 * @brief Backend Health Check API Route
 * @details
 * Aggregates health status from Redis cache and downstream backend API.
 * Returns a unified SystemHealth object used by the frontend to determine maintenance mode.
 * 
 * Logic:
 * 1. Checks Redis connection (critical for session/caching).
 * 2. Pings backend API (http://localhost:8000) for database status.
 * 3. Returns 503 Service Unavailable if any critical component fails.
 * 
 * @author Vectra Project
 * @date 2025-12-13
 */

import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { HealthStatus, SystemHealth } from '@/types/health';

export const dynamic = 'force-dynamic';
// Force rebuild

export async function GET() {
    const health: SystemHealth = {
        status: HealthStatus.HEALTHY,
        message: 'System Operational',
        components: {
            database: {
                status: HealthStatus.UNKNOWN,
                message: 'Pending check',
                component: 'database'
            },
            cache: {
                status: HealthStatus.UNKNOWN,
                message: 'Pending check',
                component: 'cache'
            }
        },
        lastChecked: new Date()
    };

    // 1. Check Redis (Frontend Cache)
    try {
        if (!redis) {
            throw new Error('Redis client not initialized');
        }
        await redis.ping();
        health.components.cache = {
            status: HealthStatus.HEALTHY,
            message: 'Redis connection successful',
            component: 'cache'
        };
    } catch (error: any) {
        health.status = HealthStatus.UNHEALTHY;
        health.message = 'System Maintenance: Cache Unavailable';
        health.components.cache = {
            status: HealthStatus.UNHEALTHY,
            message: 'Redis connection failed',
            component: 'cache',
            error: error.message
        };
    }

    // 2. Check Backend API
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    try {
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();

        // Update database status from backend response if available
        if (data.components && data.components.database) {
            health.components.database = data.components.database;
        } else {
            // Fallback if backend doesn't provide detailed component info
            health.components.database = {
                status: response.ok ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
                message: response.ok ? 'Backend Reachable' : 'Backend Error',
                component: 'database'
            }
        }

        // If backend reports unhealthy, assume system is unhealthy
        if (data.status === HealthStatus.UNHEALTHY || !response.ok) {
            health.status = HealthStatus.UNHEALTHY;
            health.message = data.message || 'System Maintenance: Backend Unavailable';
        }

    } catch (error: any) {
        health.status = HealthStatus.UNHEALTHY;
        health.message = 'System Maintenance: Backend Unreachable';
        health.components.database = {
            status: HealthStatus.UNHEALTHY,
            message: 'Backend API connection failed',
            component: 'database',
            error: error.message
        };
    }

    return NextResponse.json(health, {
        status: health.status === HealthStatus.HEALTHY ? 200 : 503
    });
}
