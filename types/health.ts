/**
 * @file health.ts
 * @brief Shared health types for VECTRA UI
 * @details
 * Contains enums and interfaces for system health monitoring.
 * Shared between client-side hooks and server-side API routes.
 */

/**
 * @brief Health status enum
 */
export enum HealthStatus {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    UNHEALTHY = 'unhealthy',
    UNKNOWN = 'unknown'
}

/**
 * @brief Component health information
 */
export interface ComponentHealth {
    status: HealthStatus;
    message: string;
    component: string;
    error?: string;
}

/**
 * @brief Overall system health response
 */
export interface SystemHealth {
    status: HealthStatus;
    message: string;
    components: {
        database: ComponentHealth;
        cache: ComponentHealth;
    };
    lastChecked: Date;
}
