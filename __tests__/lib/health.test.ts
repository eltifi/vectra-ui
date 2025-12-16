import { renderHook, waitFor } from '@testing-library/react';
import { useApiHealth } from '@/lib/health';
import { HealthStatus } from '@/types/health';

// Mock global fetch
global.fetch = jest.fn();

describe('useApiHealth Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return initial state correctly', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            new Promise(() => { }) // Pending promise to simulate loading
        );

        const { result } = renderHook(() => useApiHealth({ enableAutoPolling: false }));

        // isLoading is disabled in implementation to prevent flashing
        expect(result.current.isLoading).toBe(false);
        expect(result.current.health.status).toBe(HealthStatus.HEALTHY); // Default state
    });

    it('should update state to HEALTHY on successful fetch', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: HealthStatus.HEALTHY,
                message: 'OK',
                components: {},
                lastChecked: new Date().toISOString()
            })
        });

        const { result } = renderHook(() => useApiHealth({ enableAutoPolling: false }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        expect(result.current.health.status).toBe(HealthStatus.HEALTHY);
        expect(result.current.isHealthy).toBe(true);
    });

    it('should update state to UNHEALTHY on API error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useApiHealth({ enableAutoPolling: false }));

        await waitFor(() => {
            expect(result.current.health.status).toBe(HealthStatus.UNHEALTHY);
        });

        expect(result.current.health.status).toBe(HealthStatus.UNHEALTHY);
        expect(result.current.isUnhealthy).toBe(true);
        expect(result.current.error).toBe('Network Error');
    });
});
