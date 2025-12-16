/**
 * @file useApiHealth.ts
 * @brief React hook for monitoring backend API health status
 * @details
 * Provides real-time health monitoring of the Vectra backend API.
 * Checks database, cache, and overall system readiness.
 * 
 * @author Vectra Project
 * @date 2025-12-13
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { HealthStatus, SystemHealth } from '@/types/health';

/**
 * @brief Hook configuration options
 */
interface UseApiHealthOptions {
    apiUrl?: string;
    pollInterval?: number; // milliseconds
    enableAutoPolling?: boolean;
}



const DEFAULT_API_URL = '/api';

/**
 * @brief React hook for API health monitoring
 * @details
 * Monitors the health of the Vectra backend API.
 * Returns current health status and provides manual check function.
 * Optionally polls health status at regular intervals.
 * 
 * @param options Configuration options
 * @returns Object with health status, loading state, error info, and check function
 * 
 * @example
 * ```tsx
 * const { health, isLoading, error, checkHealth } = useApiHealth({
 *   pollInterval: 30000, // Check every 30 seconds
 *   enableAutoPolling: true
 * });
 * 
 * if (health.status === HealthStatus.UNHEALTHY) {
 *   return <MaintenanceScreen />;
 * }
 * ```
 */
export function useApiHealth(options: UseApiHealthOptions = {}) {
    const {
        apiUrl = DEFAULT_API_URL,
        pollInterval = 30000,
        enableAutoPolling = true
    } = options;

    const [health, setHealth] = useState<SystemHealth>({
        status: HealthStatus.HEALTHY,
        message: 'System Operational',
        components: {
            database: {
                status: HealthStatus.HEALTHY,
                message: 'OK',
                component: 'database'
            },
            cache: {
                status: HealthStatus.HEALTHY,
                message: 'OK',
                component: 'cache'
            }
        },
        lastChecked: new Date()
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * @brief Check API health status
     * @details
     * Fetches health information from backend /health endpoint.
     * Handles network errors gracefully.
     */
    const checkHealth = useCallback(async () => {
        try {
            // Don't set loading to true on every check to avoid UI flashing
            // setIsLoading(true); 
            setError(null);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${apiUrl}/health`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Non-200 response still has health info
                const data = await response.json();
                setHealth({
                    ...data,
                    lastChecked: new Date()
                });
            } else {
                const data = await response.json();
                setHealth({
                    ...data,
                    lastChecked: new Date()
                });
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);

            // If we can't reach the API, mark it as unhealthy
            setHealth({
                status: HealthStatus.UNHEALTHY,
                message: 'System is in maintenance mode.',
                components: {
                    database: {
                        status: HealthStatus.UNKNOWN,
                        message: 'Backend unreachable',
                        component: 'database',
                        error: errorMsg
                    },
                    cache: {
                        status: HealthStatus.UNKNOWN,
                        message: 'Backend unreachable',
                        component: 'cache',
                        error: errorMsg
                    }
                },
                lastChecked: new Date()
            });
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl]);

    /**
     * @brief Set up auto-polling if enabled
     */
    useEffect(() => {
        // Initial check
        checkHealth();

        if (!enableAutoPolling) {
            return;
        }

        // Set up polling interval
        const intervalId = setInterval(checkHealth, pollInterval);

        return () => clearInterval(intervalId);
    }, [checkHealth, enableAutoPolling, pollInterval]);

    return {
        health,
        isLoading,
        error,
        checkHealth,
        isHealthy: health.status === HealthStatus.HEALTHY,
        isDegraded: health.status === HealthStatus.DEGRADED,
        isUnhealthy: health.status === HealthStatus.UNHEALTHY
    };
}
