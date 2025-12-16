import { render, screen } from '@testing-library/react';
import SystemStatus from '@/components/SystemStatus';
import { HealthStatus } from '@/types/health';

describe('SystemStatus Component', () => {
    const mockHealthHealthy = {
        status: HealthStatus.HEALTHY,
        message: 'System Operational',
        components: {
            database: { status: HealthStatus.HEALTHY, message: 'OK', component: 'database' },
            cache: { status: HealthStatus.HEALTHY, message: 'OK', component: 'cache' }
        },
        lastChecked: new Date()
    };

    const mockHealthUnhealthy = {
        status: HealthStatus.UNHEALTHY,
        message: 'System Maintenance',
        components: {
            database: { status: HealthStatus.UNHEALTHY, message: 'Error', component: 'database' },
            cache: { status: HealthStatus.UNHEALTHY, message: 'Error', component: 'cache' }
        },
        lastChecked: new Date()
    };

    it('renders healthy indicator when healthy and not loading', () => {
        render(
            <SystemStatus health={mockHealthHealthy} isLoading={false} onRetry={jest.fn()} />
        );
        expect(screen.getByText('✓ System Healthy')).toBeInTheDocument();
    });

    it('renders maintenance screen when unhealthy', () => {
        render(
            <SystemStatus health={mockHealthUnhealthy} isLoading={false} onRetry={jest.fn()} />
        );

        // Should show main title (using heading role to be specific)
        expect(screen.getByRole('heading', { name: 'System Maintenance' })).toBeInTheDocument();

        // Should show auto-reconnecting message
        expect(screen.getByText(/Auto-reconnecting/i)).toBeInTheDocument();
    });

    it('does not render manual action buttons in maintenance mode', () => {
        render(
            <SystemStatus health={mockHealthUnhealthy} isLoading={false} onRetry={jest.fn()} />
        );

        // "Retry" and "Refresh Page" buttons were removed
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
        expect(screen.queryByText('Refresh Page')).not.toBeInTheDocument();
    });

    it('does not render detailed system status (security requirement)', () => {
        render(
            <SystemStatus health={mockHealthUnhealthy} isLoading={false} onRetry={jest.fn()} />
        );

        // Should not show specific component details
        expect(screen.queryByText('database')).not.toBeInTheDocument();
        expect(screen.queryByText('cache')).not.toBeInTheDocument();
    });
});
