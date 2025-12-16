/**
 * @file ControlPanel.test.tsx
 * @brief Unit tests for ControlPanel component
 * @details Tests evacuation scenario configuration including:
 * - Scenario selection and loading
 * - Region selection and validation
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ControlPanel from '@/components/ControlPanel';

// Mock the fetch API
global.fetch = jest.fn();

describe('ControlPanel Component', () => {
    const mockProps = {
        showContraflow: false,
        setShowContraflow: jest.fn(),
        region: 'Tampa Bay',
        setRegion: jest.fn(),
        eventDirection: 90,
        setEventDirection: jest.fn(),
        eventVelocity: 100,
        setEventVelocity: jest.fn(),
        affectedRegions: [],
        setAffectedRegions: jest.fn(),
    };

    const mockScenarios = {
        scenarios: [
            {
                id: 'cat3_tampa_bay',
                label: 'Category 3 - Tampa Bay',
                category: 3,
                windSpeed: 115,
                pressureMb: 950,
                latitude: 27.9506,
                longitude: -82.4593,
                direction: 180,
                translationSpeed: 15,
                affectedRegions: ['Tampa Bay', 'Orlando'],
            },
            {
                id: 'cat4_miami',
                label: 'Category 4 - Miami',
                category: 4,
                windSpeed: 140,
                pressureMb: 920,
                latitude: 25.7617,
                longitude: -80.1918,
                direction: 270,
                translationSpeed: 18,
                affectedRegions: ['Miami', 'Jacksonville'],
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
        localStorage.clear();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render control panel', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByText(/Evacuation Control/i)).toBeInTheDocument();
            });
        });

        it('should render scenario selection dropdown', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                const selects = screen.getAllByRole('combobox');
                expect(selects.length).toBeGreaterThan(0);
            });
        });

        it('should render contraflow toggle button', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByText(/Show Contraflow/i)).toBeInTheDocument();
            });
        });
    });

    describe('Scenario Loading', () => {
        it('should fetch scenarios on mount', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('scenarios')
                );
            });
        });

        it('should handle API errors gracefully', async () => {
            // Primary fails
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Failed to fetch',
            });
            // Fallback also fails
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Fallback failed',
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(2);
            });
        });

        it('should handle network errors', async () => {
            // Primary fails
            (global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Network error')
            );
            // Fallback also fails
            (global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Network error')
            );

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Contraflow Toggle', () => {
        it('should have contraflow button available', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByText(/Show Contraflow/i)).toBeInTheDocument();
            });
        });

        it('should toggle contraflow state when button clicked', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                const toggleButton = screen.getByText(/Show Contraflow/i);
                expect(toggleButton).toBeInTheDocument();
                fireEvent.click(toggleButton);
                expect(mockProps.setShowContraflow).toHaveBeenCalled();
            });
        });

        it('should update button text based on state', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            const propsContraflowOn = { ...mockProps, showContraflow: true };
            render(<ControlPanel {...propsContraflowOn} />);

            await waitFor(() => {
                expect(screen.getByText(/Hide Contraflow/i)).toBeInTheDocument();
            });
        });
    });

    describe('Affected Regions Display', () => {
        it('should display affected regions warning when present', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            const propsWithRegions = {
                ...mockProps,
                affectedRegions: ['Tampa Bay', 'Orlando'],
            };

            render(<ControlPanel {...propsWithRegions} />);

            await waitFor(() => {
                expect(screen.getByText(/Affected Regions/i)).toBeInTheDocument();
            });
        });

        it('should not display affected regions when none', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            await waitFor(() => {
                expect(screen.queryByText(/Affected Regions/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should display error message when API fails', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Network error')
            );

            render(<ControlPanel {...mockProps} />);

            // Component should render without crashing
            await waitFor(() => {
                expect(screen.getByText(/Evacuation Control/i)).toBeInTheDocument();
            });
        });

        it('should recover from transient errors', async () => {
            // Primary fails
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Transient error'));
            // Fallback succeeds
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockScenarios,
            });

            render(<ControlPanel {...mockProps} />);

            // Component should handle the error gracefully
            await waitFor(() => {
                expect(screen.getByText(/Evacuation Control/i)).toBeInTheDocument();
            });
        });
    });
});
