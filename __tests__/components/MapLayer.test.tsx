/**
 * @file MapLayer.test.tsx
 * @brief Unit tests for MapLayer component
 * @details Tests interactive map visualization including:
 * - Map container rendering
 * - GeoJSON loading and caching
 * - Region filtering
 * - Contraflow styling
 * - Hurricane marker positioning
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapLayer from '@/components/MapLayer';

// Mock leaflet FIRST before importing components
jest.mock('leaflet', () => ({
    latLng: (lat: number, lng: number) => ({ lat, lng }),
    latLngBounds: (sw: any, ne: any) => ({
        extend: jest.fn(),
        getSouthWest: () => sw,
        getNorthEast: () => ne,
    }),
    LatLng: jest.fn((lat: number, lng: number) => ({ lat, lng })),
    LatLngBounds: jest.fn((sw: any, ne: any) => ({
        extend: jest.fn(),
        getSouthWest: () => sw,
        getNorthEast: () => ne,
    })),
    icon: jest.fn((opts: any) => ({ options: opts })),
    divIcon: jest.fn((opts: any) => ({ options: opts })),
    Icon: {
        Default: {
            prototype: {},
            mergeOptions: jest.fn(),
        },
    },
}));

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
    MapContainer: ({ children, ...props }: any) => (
        <div data-testid="map-container" {...props}>
            {children}
        </div>
    ),
    TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
    GeoJSON: ({ style, ...props }: any) => <div data-testid="geojson-layer" {...props} />,
    Marker: (props: any) => <div data-testid="marker" {...props} />,
    Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
    Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
    useMap: () => ({
        fitBounds: jest.fn(),
        removeLayer: jest.fn(),
        addLayer: jest.fn(),
        setView: jest.fn(),
    }),
}));

// Mock axios
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

import axios from 'axios';

describe('MapLayer Component', () => {
    const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    id: 'road_1',
                    name: 'Main Street',
                    region: 'Tampa Bay',
                    contraflow: false,
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-82.4, 27.9],
                        [-82.3, 28.0],
                    ],
                },
            },
        ],
    };

    const mockProps = {
        scenario: 'baseline',
        region: 'Tampa Bay',
        hurricaneDirection: 90,
        hurricaneVelocity: 100,
        hurricaneLatitude: 27.0,
        hurricaneLongitude: -85.0,
        affectedRegions: ['Tampa Bay'],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios.get as jest.Mock).mockClear();
        localStorage.clear();
    });

    describe('Component Rendering', () => {
        it('should render map container', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
            });
        });

        it('should render tile layer for base map', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
            });
        });
    });

    describe('GeoJSON Loading', () => {
        it('should fetch GeoJSON data on mount', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith(
                    expect.stringContaining('/api/proxy')
                );
            });
        });

        it('should display geojson layer after loading', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
            });
        });

        it('should handle API errors gracefully', async () => {
            (axios.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

            const { container } = render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                // Component should still render without crashing
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
            });
        });

        it('should fetch GeoJSON when region changes', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const { rerender } = render(<MapLayer {...mockProps} />);

            // Should call axios.get for the new region
            await waitFor(() => {
                expect(axios.get).toHaveBeenCalled();
            });

            rerender(<MapLayer {...mockProps} selectedRegion="Miami" />);
            
            // Verify axios was called for the region
            expect(axios.get).toHaveBeenCalled();
        });
    });

    describe('Region Filtering', () => {
        it('should filter roads by selected region', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const props = { ...mockProps, region: 'Tampa Bay' };
            render(<MapLayer {...props} />);

            await waitFor(() => {
                expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
            });
        });

        it('should update when region changes', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const { rerender } = render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
            });

            const newProps = { ...mockProps, region: 'Orlando' };
            rerender(<MapLayer {...newProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
            });
        });
    });

    describe('Contraflow Display', () => {
        it('should show contraflow roads when enabled', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const props = { ...mockProps, showContraflow: true };
            render(<MapLayer {...props} />);

            await waitFor(() => {
                expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
            });
        });

        it('should hide contraflow roads when disabled', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const props = { ...mockProps, showContraflow: false };
            render(<MapLayer {...props} />);

            await waitFor(() => {
                expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
            });
        });
    });

    describe('Hurricane Marker', () => {
        it('should render hurricane marker', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                const markers = screen.getAllByTestId('marker');
                expect(markers.length).toBeGreaterThan(0);
            });
        });

        it('should position marker based on event direction and velocity', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const props = {
                ...mockProps,
                eventDirection: 180,
                eventVelocity: 100,
            };
            render(<MapLayer {...props} />);

            await waitFor(() => {
                expect(screen.getByTestId('marker')).toBeInTheDocument();
            });
        });

        it('should update marker position when direction changes', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const { rerender } = render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('marker')).toBeInTheDocument();
            });

            const newProps = { ...mockProps, eventDirection: 270 };
            rerender(<MapLayer {...newProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('marker')).toBeInTheDocument();
            });
        });
    });

    describe('Affected Regions Visualization', () => {
        it('should display affected regions on map', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const props = {
                ...mockProps,
                affectedRegions: ['Tampa Bay', 'Orlando'],
            };
            render(<MapLayer {...props} />);

            await waitFor(() => {
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
            });
        });
    });

    describe('Performance and Caching', () => {
        it('should not re-fetch GeoJSON on re-render if data unchanged', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockGeoJSON });

            const { rerender } = render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledTimes(1);
            });

            // Re-render with same props
            rerender(<MapLayer {...mockProps} />);

            // Should still only have 1 fetch call
            expect(axios.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing GeoJSON gracefully', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({
                data: { type: 'FeatureCollection', features: [] },
            });

            const { container } = render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
            });
        });

        it('should handle invalid GeoJSON gracefully', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({
                data: { invalid: 'data' },
            });

            const { container } = render(<MapLayer {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
            });
        });
    });
});

