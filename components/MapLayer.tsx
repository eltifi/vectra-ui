/**
 * @file MapLayer.tsx
 * @brief Interactive map visualization for VECTRA UI evacuation system
 * @details
 * Renders a Leaflet map displaying Florida road networks with dynamic contraflow
 * visualization. Implements sophisticated filtering and styling based on:
 * - Road type (interstate, major, standard, toll)
 * - Hurricane scenario (baseline vs. contraflow)
 * - Selected region and affected regions
 * - Hurricane track visualization
 * 
 * Key Features:
 * - Real-time GeoJSON road network visualization from backend
 * - Regional bounds filtering (15 Florida metropolitan areas)
 * - Dynamic color coding: baseline vs. contraflow mode
 * - Hurricane position marker with direction/velocity display
 * - Interactive map controller with automatic zoom to affected regions
 * 
 * Contraflow Logic:
 * - Interstates: Always visible statewide, red in contraflow mode
 * - Major roads: Green baseline, yellow contraflow (affected areas only)
 * - Toll roads: Purple baseline, orange contraflow
 * - Standard roads: Gray baseline, hidden in contraflow
 * 
 * @see MapLayerProps interface for component props
 * @see calculateHurricanePosition() for trajectory logic
 * @see style() callback for dynamic styling algorithm
 */

'use client';

import { MapContainer, TileLayer, GeoJSON, Popup, useMap, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, memo, useCallback } from 'react';
import axios from 'axios';
import L from 'leaflet';

// Fix Leaflet icon issue in Next.js
/**
 * @brief Fix Leaflet icon rendering in Next.js
 * @details
 * Leaflet has known issues with icon URLs in Next.js environments.
 * This workaround deletes and remerges icon options with CDN-hosted images.
 */
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * @brief Custom Leaflet icon for hurricane marker
 * @details
 * Uses HTML divIcon with emoji (🌀) for visual representation.
 * Size: 40x40 pixels, centered on position.
 */
// Hurricane icon using divIcon with emoji
const hurricaneIcon = L.divIcon({
    html: '<div style="font-size: 40px; line-height: 1;">🌀</div>',
    iconSize: [40, 40],
    className: 'hurricane-marker'
});

/**
 * @brief Props for MapLayer component
 * @details
 * Controls map display, road filtering, and hurricane visualization.
 * 
 * @param scenario Display mode: "baseline" (normal roads) or "contraflow" (evacuation routing)
 * @param region Selected Florida region for detailed view
 * @param hurricaneDirection Movement direction (degrees, 0=North, 90=East, 180=South, 270=West)
 * @param hurricaneVelocity Wind speed in mph (0 = no hurricane marker)
 * @param affectedRegions List of regions impacted by hurricane scenario
 */
interface MapLayerProps {
    scenario: string;
    region: string;
    hurricaneDirection: number;
    hurricaneVelocity: number;
    hurricaneLatitude: number;
    hurricaneLongitude: number;
    affectedRegions: string[];
}

/**
 * @brief Geographic center coordinates for Florida metropolitan regions
 * @details
 * Lookup table of latitude/longitude for 15 major Florida regions.
 * Used for map centering and navigation.
 * Format: [latitude, longitude] (WGS84 coordinates)
 */
const REGIONS: Record<string, [number, number]> = {
    'Tampa Bay': [27.9506, -82.4572],
    'Orlando': [28.5383, -81.3792],
    'Miami': [25.7617, -80.1918],
    'Jacksonville': [30.3322, -81.6557],
    'Tallahassee': [30.4383, -84.2807],
    'Pensacola': [30.4213, -87.2169],
    'Lakeland-Winter Haven': [28.0395, -81.9498],
    'Cape Coral-Fort Myers': [26.5628, -81.9495],
    'Sarasota-North Port': [27.3364, -82.5307],
    'Daytona Beach': [29.2108, -81.0228],
    'Palm Bay-Melbourne': [28.0836, -80.6081],
    'Port St. Lucie': [27.2730, -80.3582],
    'Ocala': [29.1872, -82.1401],
    'Gainesville': [29.6516, -82.3248],
    'Naples-Marco Island': [26.1420, -81.7948]
};

/**
 * @brief Bounding boxes for Florida metropolitan regions
 * @details
 * Rectangular bounds for each region used to filter visible road networks.
 * Prevents cluttering map by showing only roads relevant to selected region.
 * Format: [south, west, north, east] in WGS84 coordinates
 * 
 * @note Bounds are slightly oversized to ensure complete road display
 */
// Regional bounds for metropolitan areas (bounding boxes to limit road display)
// Format: [south, west, north, east]
const REGION_BOUNDS: Record<string, [number, number, number, number]> = {
    'Tampa Bay': [27.5, -82.8, 28.3, -82.0],
    'Orlando': [28.1, -81.8, 28.9, -80.9],
    'Miami': [25.3, -80.5, 26.1, -80.0],
    'Jacksonville': [30.0, -81.9, 30.6, -81.2],
    'Tallahassee': [30.1, -84.6, 30.7, -83.9],
    'Pensacola': [30.1, -87.5, 30.7, -86.9],
    'Lakeland-Winter Haven': [27.7, -82.1, 28.3, -80.8],
    'Cape Coral-Fort Myers': [26.2, -82.0, 26.8, -81.5],
    'Sarasota-North Port': [26.9, -82.7, 27.6, -82.1],
    'Daytona Beach': [28.9, -81.3, 29.5, -80.8],
    'Palm Bay-Melbourne': [27.7, -80.8, 28.4, -80.3],
    'Port St. Lucie': [27.0, -80.6, 27.5, -80.1],
    'Ocala': [28.9, -82.4, 29.4, -81.9],
    'Gainesville': [29.3, -82.6, 29.9, -82.0],
    'Naples-Marco Island': [25.9, -81.5, 26.3, -81.1]
};

/**
 * @brief Check if a GeoJSON road feature is within a bounding box
 * @details
 * Tests whether any coordinate of a LineString or MultiLineString geometry
 * falls within the specified region bounds. Used for regional road filtering.
 * 
 * Algorithm: O(n) where n = number of coordinates in feature geometry
 * For efficiency, returns true on first coordinate match (early exit).
 * 
 * @param feature GeoJSON feature object with geometry property
 * @param bounds Region boundary box [south, west, north, east]
 * @returns boolean true if any feature coordinate is within bounds
 */
// Helper function to check if a feature is within regional bounds
const isWithinRegion = (feature: any, bounds: [number, number, number, number]) => {
    if (!feature.geometry || feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString') {
        return false;
    }

    const [south, west, north, east] = bounds;
    const coordinates = feature.geometry.type === 'LineString'
        ? feature.geometry.coordinates
        : feature.geometry.coordinates.flat();

    // Check if any coordinate is within bounds
    return coordinates.some((coord: [number, number]) => {
        const [lon, lat] = coord;
        return lat >= south && lat <= north && lon >= west && lon <= east;
    });
};

/**
 * @brief Sub-component that controls map viewport and centering
 * @details
 * Manages map view updates when region or affected regions change.
 * Implements two zoom strategies:
 * 1. Affected regions mode: Fits bounds to show all impacted areas
 * 2. Normal mode: Centers on selected region with fixed zoom level
 * 
 * Uses Leaflet's fitBounds() for dynamic zoom calculation.
 * Padding prevents features from touching screen edges.
 * 
 * @param region Selected region for normal zoom mode
 * @param affectedRegions Array of hurricane-impacted regions
 * @returns null (only side effects via useMap hook)
 */
function MapController({ region, affectedRegions }: { region: string; affectedRegions: string[] }) {
    const map = useMap();

    /**
     * @brief Calculate optimal bounding box for affected regions
     * @details
     * Merges bounds of all affected regions into single bounding box.
     * Used for fitBounds() call to show entire hurricane impact area.
     * 
     * Algorithm: O(n) where n = number of affected regions
     * Iterates regions to find min/max lat/lon.
     * 
     * @returns [[minLat, minLon], [maxLat, maxLon]] bounds array, or null if no regions
     */
    // Calculate bounds for affected regions
    const calculateAffectedBounds = () => {
        if (affectedRegions.length === 0) return null;

        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        affectedRegions.forEach(region => {
            const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['Tampa Bay'];
            const [south, west, north, east] = bounds;
            minLat = Math.min(minLat, south);
            maxLat = Math.max(maxLat, north);
            minLon = Math.min(minLon, west);
            maxLon = Math.max(maxLon, east);
        });
        return [[minLat, minLon], [maxLat, maxLon]] as [[number, number], [number, number]];
    };

    /**
     * @brief Update map view on region or scenario change
     * @details
     * Implements view switching logic:
     * - If affected regions exist: zoom to fit all affected areas
     * - Otherwise: center on selected region with zoom level 10
     * 
     * Dependencies: region, affectedRegions, map instance
     */
    useEffect(() => {
        // Only zoom to affected regions if there's an active hurricane scenario with affected regions
        // Otherwise, always zoom to the selected region
        if (affectedRegions.length > 0) {
            // Zoom to show affected regions
            const bounds = calculateAffectedBounds();
            if (bounds) {
                map.fitBounds(bounds, { padding: [150, 150] });
            }
        } else {
            // No affected regions - zoom to selected region regardless of scenario
            const center = REGIONS[region] || REGIONS['Tampa Bay'];
            map.setView(center, 10);
        }
    }, [region, affectedRegions, map]);
    return null;
}

/**
 * @brief MapLayer component - main map visualization
 * @details
 * Renders interactive Leaflet map with dynamic road network and hurricane tracking.
 * Fetches GeoJSON road data from backend and applies real-time styling.
 * 
 * @param scenario Visualization mode ("baseline" or "contraflow")
 * @param region Selected region for detail view
 * @param hurricaneDirection Hurricane bearing (0-360 degrees)
 * @param hurricaneVelocity Hurricane wind speed (mph)
 * @param affectedRegions Regions impacted by hurricane
 * 
 * @returns JSX.Element - MapContainer with tiles, roads, and hurricane marker
 */
const MapLayer = memo(function MapLayer({ scenario, region, hurricaneDirection, hurricaneVelocity, hurricaneLatitude, hurricaneLongitude, affectedRegions }: MapLayerProps) {
    const [geoData, setGeoData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * @brief Calculate hurricane marker position based on trajectory
     * @details
     * Projects hurricane position from center of affected regions.
     * Uses wind speed to determine distance from center.
     * Converts bearing (0° = North) to latitude/longitude offsets.
     * 
     * Algorithm:
     * 1. Calculate center point of affected regions (or default to Florida center)
     * 2. Distance from center: 1 + (velocity / 200) * 3 degrees (normalized 0-200 mph)
     * 3. Convert direction to radians: radians = (degrees * π) / 180
     * 4. Calculate offsets:
     *    - latOffset = cos(radians) * distance (north-south)
     *    - lonOffset = sin(radians) * distance (east-west)
     * 5. Apply offsets: hurricane_pos = [center_lat - latOffset, center_lon + lonOffset]
     * 
     * Note: Latitude decreases northward, hence subtraction for northward direction.
     * 
     * @returns [latitude, longitude] tuple for hurricane marker position
     * @complexity O(n) where n = number of affected regions for center calculation
     */
    // Use passed props for hurricane position
    const hurricanePosition: [number, number] = [hurricaneLatitude, hurricaneLongitude];

    /**
     * @brief Fetch GeoJSON road network data from backend
     * @details
     * Loads road network geometry on component mount.
     * Implements automatic retry on failure (3-second intervals).
     * Network data is static and cached; scenario changes only affect styling.
     * 
     * Endpoint: GET /segments
     * Returns: GeoJSON FeatureCollection with road network
     * 
     * Error Handling:
     * - Sets backendDown flag to show overlay message
     * - Retries every 3 seconds until successful
     * - Logs errors to console for debugging
     */
    useEffect(() => {
        // Fetch the baseline network segments
        async function fetchData() {
            try {
                setIsLoading(true);

                // Check local cache first
                const cachedData = localStorage.getItem('vectra_geojson_cache');
                const cachedTimestamp = localStorage.getItem('vectra_geojson_timestamp');
                const NOW = Date.now();
                const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

                if (cachedData && cachedTimestamp) {
                    const age = NOW - parseInt(cachedTimestamp);
                    if (age < TWENTY_FOUR_HOURS) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            setGeoData(parsed);
                            setIsLoading(false);
                            return; // Exit if cache hit
                        } catch (e) {
                            console.warn('Invalid cached GeoJSON');
                        }
                    }
                }

                const response = await axios.get(`/api/proxy`);
                setGeoData(response.data);

                // Update cache
                try {
                    localStorage.setItem('vectra_geojson_cache', JSON.stringify(response.data));
                    localStorage.setItem('vectra_geojson_timestamp', NOW.toString());
                } catch (e) {
                    console.warn('Failed to cache GeoJSON to localStorage');
                }

            } catch (error) {
                console.error("Failed to fetch map data", error);
                // Retry every 3 seconds
                setTimeout(fetchData, 3000);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    /**
     * @brief Dynamic styling callback for road features
     * @details
     * Complex styling algorithm that applies colors and weights based on:
     * - Road type (interstate, toll, major, standard)
     * - Scenario mode (baseline vs. contraflow)
     * - Regional bounds (affected regions)
     * 
     * **Baseline Mode (scenario="baseline"):**
     * - Interstates: International Blue (#0047AB), weight=8, opacity=1.0
     * - Major Roads: Green (#2E7D32), weight=4, opacity=0.75
     * - Toll Roads: Purple (#7B1FA2), weight=3, opacity=0.8
     * - Standard Roads: Gray (#9E9E9E), weight=1.5, opacity=0.7
     * 
     * **Contraflow Mode (scenario="contraflow"):**
     * - Interstates (affected): Bright Red (#D32F2F), weight=9, opacity=1.0
     * - Major Roads (affected): Bright Yellow (#FBC02D), weight=6, opacity=1.0
     * - Toll Roads (affected): Orange (#FF6F00), weight=5, opacity=1.0
     * - Standard Roads (affected): Not shown (opacity=0)
     * - Unaffected roads: Shown with baseline colors
     * 
     * **Visibility Rules:**
     * - Interstates/Tolls: Always shown statewide
     * - Major/Standard roads: Shown only in selected region (baseline) or affected regions (contraflow)
     * 
     * @param feature GeoJSON road feature with properties (road_type, etc.)
     * @returns Leaflet PathOptions object {color, weight, opacity, interactive}
     * @complexity O(n) where n = number of affected regions
     */
    const style = useCallback((feature: any) => {
        const roadType = feature.properties.road_type || 'standard';

        // Interstates and tolls are ALWAYS shown statewide in both baseline and contraflow
        // Only limit visibility for major and standard roads
        let isVisible = true;
        let isInAffectedArea = false;

        // Determine the affected regions (use selected region if no scenario selected in contraflow)
        const activeAffectedRegions = (scenario === 'contraflow' && affectedRegions.length === 0)
            ? [region]
            : affectedRegions;

        // For interstates and tolls: always visible
        if (roadType === 'interstate' || roadType === 'toll') {
            isVisible = true;
            // Check if in affected area for styling purposes
            if (scenario === 'contraflow' && activeAffectedRegions.length > 0) {
                isInAffectedArea = activeAffectedRegions.some(affectedRegion => {
                    const bounds = REGION_BOUNDS[affectedRegion] || REGION_BOUNDS['Tampa Bay'];
                    return isWithinRegion(feature, bounds);
                });
            }
        } else {
            // For major and standard roads: visibility depends on scenario
            if (scenario === 'contraflow' && activeAffectedRegions.length > 0) {
                // In contraflow: only show major/standard in affected regions (or selected region if no scenario)
                const inAffectedArea = activeAffectedRegions.some(affectedRegion => {
                    const bounds = REGION_BOUNDS[affectedRegion] || REGION_BOUNDS['Tampa Bay'];
                    return isWithinRegion(feature, bounds);
                });
                isVisible = inAffectedArea;
                isInAffectedArea = inAffectedArea;
            } else {
                // In baseline: limit to selected region
                const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['Tampa Bay'];
                isVisible = isWithinRegion(feature, bounds);
            }
        }

        if (!isVisible) {
            return { opacity: 0, interactive: false };
        }

        // Apply colors based on road type (standard cartographic colors)
        let color = '#9E9E9E'; // Medium Gray for standard roads
        let weight = 1.5;
        let opacity = 0.7;

        if (roadType === 'interstate') {
            color = '#0047AB'; // International Blue for interstates
            weight = 8; // Thickest for maximum visibility
            opacity = 1.0; // Full opacity for interstates
        } else if (roadType === 'major') {
            color = '#2E7D32'; // Green for major roads
            weight = 4; // Much thinner than interstates
            opacity = 0.75; // Slightly transparent to allow blue underneath to be visible if overlapping
        } else if (roadType === 'toll') {
            color = '#7B1FA2'; // Purple for toll roads (baseline mode)
            weight = 3;
            opacity = 0.8;
        }

        // Contraflow Visualization Logic:
        // Only apply contraflow colors to roads IN the affected area
        if (scenario === 'contraflow' && isInAffectedArea) {
            opacity = 1.0; // Full opacity in contraflow mode
            if (roadType === 'interstate') {
                color = '#D32F2F'; // Bright red for contraflow interstates
                weight = 9; // Thickest in contraflow
            } else if (roadType === 'major') {
                color = '#FBC02D'; // Bright yellow for contraflow major roads
                weight = 6; // Still thinner than interstates in contraflow
            } else if (roadType === 'toll') {
                color = '#FF6F00'; // Orange for contraflow toll
                weight = 5;
            }
        }

        return {
            color: color,
            weight: weight,
            opacity: opacity,
            interactive: true
        };
    }, [scenario, region, affectedRegions]);

    /**
     * @brief Extract interstate number from road name
     * @details
     * Regex pattern: /I-(\\d+)/i matches "I-XX" format (case-insensitive)
     * Used for popup labels on interstate markers.
     * 
     * @param roadName String like "I-75" or "Interstate 75"
     * @returns Extracted number ("75") or null if no match
     * @example
     * getInterstateName("I-75")  // Returns "75"
     * getInterstateName("US-27") // Returns null
     */
    // Extract interstate number from road name (e.g., "I-75" -> "75")
    const getInterstateName = (roadName: string) => {
        const match = roadName.match(/I-(\d+)/i);
        return match ? match[1] : null;
    };

    /**
     * @brief Error state: Show overlay message if backend is unavailable
     * @details
     * Displays full-screen overlay with retry status message.
     * Component will automatically attempt reconnection every 3 seconds.
     * Returns early without rendering map to prevent empty map display.
     */
    return (
        <MapContainer center={[27.9506, -82.4572]} zoom={10} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController region={region} affectedRegions={affectedRegions} />
            {geoData && <GeoJSON key={`roads-${scenario}-${region}`} data={geoData} style={style} />}
            {hurricaneVelocity > 0 && (
                <Marker position={hurricanePosition} icon={hurricaneIcon}>
                    <Tooltip permanent direction="top" offset={[0, -20]}>
                        <div style={{ textAlign: 'center', fontSize: '12px' }}>
                            <strong>Hurricane</strong><br />
                            {hurricaneVelocity.toFixed(0)} mph<br />
                            {hurricaneDirection.toFixed(0)}°
                        </div>
                    </Tooltip>
                </Marker>
            )}
        </MapContainer>
    );
});

export default MapLayer;
