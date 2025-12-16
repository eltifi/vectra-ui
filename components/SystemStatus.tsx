/**
 * @file SystemStatus.tsx
 * @brief System status and maintenance mode component
 * @details
 * Displays system health status and maintenance messages when services are unavailable.
 * Shows different UI based on health state (healthy, degraded, unhealthy).
 * 
 * @author Vectra Project
 * @date 2025-12-13
 */

'use client';

import React from 'react';
import { HealthStatus, SystemHealth } from '@/types/health';

/**
 * @brief Props for SystemStatus component
 */
interface SystemStatusProps {
  health: SystemHealth;
  isLoading: boolean;
  onRetry?: () => void;
}

/**
 * @brief System Status component
 * @details
 * Displays appropriate UI based on system health:
 * - HEALTHY: Hidden or minimal indicator
 * - DEGRADED: Warning message, system continues to work
 * - UNHEALTHY: Full-screen maintenance message
 */
export default function SystemStatus({ health, isLoading, onRetry }: SystemStatusProps) {
  // Show minimal status for healthy system
  if (health.status === HealthStatus.HEALTHY && !isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: '#4caf50',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000,
        opacity: 0.7
      }}>
        ✓ System Healthy
      </div>
    );
  }

  // Show degraded warning
  if (health.status === HealthStatus.DEGRADED && !isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: '#ff9800',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '4px',
        fontSize: '13px',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        <strong>⚠ System Degraded</strong>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          {health.message}
        </div>
      </div>
    );
  }

  // Show full maintenance screen for unhealthy system
  if (health.status === HealthStatus.UNHEALTHY) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🔧
          </div>

          <h1 style={{
            fontSize: '32px',
            color: '#333',
            margin: '0 0 10px 0'
          }}>
            System Maintenance
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: '10px 0 30px 0',
            lineHeight: '1.6'
          }}>
            {health.message}
          </p>

          {/* Detailed status removed for security/simplicity */}

          <div style={{
            background: '#e3f2fd',
            borderLeft: '4px solid #2196f3',
            padding: '15px',
            marginBottom: '30px',
            textAlign: 'left',
            fontSize: '13px',
            color: '#0d47a1'
          }}>
            <strong>What's happening?</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Our team is working to restore service as quickly as possible.
              Please try again in a few moments.
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              background: '#f5f5f5',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                backgroundColor: '#667eea',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }}></span>
              Auto-reconnecting...
            </div>
            <style>{`
                @keyframes pulse {
                  0% { opacity: 0.4; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1.1); }
                  100% { opacity: 0.4; transform: scale(0.8); }
                }
              `}</style>
          </div>

          <div style={{
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #eee',
            fontSize: '12px',
            color: '#999'
          }}>
            <p>Last checked: {health.lastChecked.toLocaleTimeString()}</p>
            <p>
              Vectra UI · Vehicle Evacuation Counterflow Traffic Resilience Application
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>
            ⏳
          </div>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Checking system status...
          </p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return null;
}
