/**
 * @file route.ts
 * @brief Backend Health Check API Route
 * @details
 * Aggregates health status from downstream Hono backend API.
 * Uses Edge Runtime for compatibility with Cloudflare Pages.
 * 
 * @author Vectra Project
 * @date 2026-04-11
 */

import { NextResponse } from 'next/server';
import { HealthStatus, SystemHealth } from '@/types/health';

export const runtime = 'edge';

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
                status: HealthStatus.HEALTHY,
                message: 'Cloudflare Edge Cache (KV) - Managed by Backend',
                component: 'cache'
            }
        },
        lastChecked: new Date()
    };

    // 1. Check Backend API
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    try {
        const response = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
        const data = await response.json();

        if (response.ok && data.status === "healthy") {
            health.components.database = {
                status: HealthStatus.HEALTHY,
                message: 'D1 Database Connected',
                component: 'database'
            };
        } else {
            health.status = HealthStatus.UNHEALTHY;
            health.message = 'System Maintenance: Backend Issues';
            health.components.database = {
                status: HealthStatus.UNHEALTHY,
                message: data.error || 'Backend reported unhealthy status',
                component: 'database'
            };
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
