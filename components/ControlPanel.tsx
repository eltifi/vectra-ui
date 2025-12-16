/**
 * @file ControlPanel.tsx
 * @brief User control interface for VECTRA UI evacuation simulator
 * @details
 * Control panel component for configuring simulation parameters:
 * - Disaster/evacuation scenario selection (pre-defined or custom)
 * - Regional selection (22 Florida metro areas)
 * - Custom event parameters (direction, velocity/wind speed)
 * - Contraflow mode toggle
 * 
 * Features:
 * - Fetches predefined scenarios from backend API
 * - Dynamic scenario data loading with error handling
 * - Region selection with scenario validation
 * - Real-time parameter input with validation
 * - Affected regions display with warning styling
 * - Error messaging via alerts
 * - Cookie consent aware (only shows affected regions if user accepted)
 * 
 * @see ControlPanelProps interface for props
 * @see DisasterScenario interface for scenario data
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * @brief Props for ControlPanel component
 * @details
 * State setters for all simulation parameters controlled by the UI.
 * 
 * @param showContraflow Boolean toggle for contraflow visualization mode
 * @param setShowContraflow Setter for contraflow mode
 * @param region Selected Florida region (string key from REGIONS map)
 * @param setRegion Setter for region selection
 * @param eventDirection Movement bearing (0-360 degrees, 0=North)
 * @param setEventDirection Setter for direction
 * @param eventVelocity Speed parameter in mph
 * @param setEventVelocity Setter for speed parameter
 * @param affectedRegions Array of regions impacted by scenario
 * @param setAffectedRegions Setter for affected regions list
 */
interface ControlPanelProps {
    showContraflow: boolean;
    setShowContraflow: (s: boolean) => void;
    region: string;
    setRegion: (r: string) => void;
    eventDirection: number;
    setEventDirection: (d: number) => void;
    eventVelocity: number;
    setEventVelocity: (v: number) => void;
    setEventLatitude: (lat: number) => void;
    setEventLongitude: (long: number) => void;
    affectedRegions: string[];
    setAffectedRegions: (r: string[]) => void;
}

/**
 * @brief Disaster/evacuation scenario data structure
 * @details
 * Loaded from backend API /api/scenarios endpoint.
 * Represents a pre-defined evacuation scenario with parameters.
 * 
 * @param id Unique identifier (e.g., "cat3_tampa_bay")
 * @param label Display name for UI (e.g., "Category 3 - Tampa Bay")
 * @param category Severity category (e.g., 1-5 for hurricanes)
 * @param windSpeed Maximum sustained wind speed or equivalent (mph)
 * @param pressureMb Atmospheric pressure or equivalent metric (millibars)
 * @param latitude Latitude of event center
 * @param longitude Longitude of event center
 * @param direction Movement direction (0-360 degrees)
 * @param translationSpeed Forward speed of event (mph)
 * @param affectedRegions Array of region names impacted by scenario
 */
interface DisasterScenario {
    id: string;
    label: string;
    category: number;
    windSpeed: number;
    pressureMb: number;
    latitude: number;
    longitude: number;
    direction: number;
    translationSpeed: number;
    affectedRegions: string[];
}

/**
 * @brief ControlPanel component - main user interface
 * @details
 * Floating Material-UI panel positioned at top-right of screen.
 * Provides controls for:
 * 1. Hurricane scenario selection (dropdown fetched from API)
 * 2. Region selection (dropdown of 15 Florida areas)
 * 3. Custom hurricane parameters (direction 0-360°, velocity 0+ mph)
 * 4. Contraflow mode toggle button
 * 
 * Features:
 * - Automatic scenario data loading from backend on mount
 * - Dynamic region list from fetched scenarios
 * - Validation: clamps direction to [0, 360], velocity to [0, ∞)
 * - Affected regions warning display with highlighting
 * - Error alerts via Snackbar component
 * - Responsive Material-UI styling with glassmorphism backdrop
 * 
 * @param props ControlPanelProps - all state management props
 * @returns JSX.Element - Material-UI Paper panel with controls
 * 
 * @complexity State management: O(n) for scenario lookups where n = number of scenarios
 * @note Scenarios are fetched on mount (once), then cached in component state
 */
export default function ControlPanel({
    showContraflow,
    setShowContraflow,
    region,
    setRegion,
    eventDirection,
    setEventDirection,
    eventVelocity,
    setEventVelocity,
    setEventLatitude,
    setEventLongitude,
    affectedRegions,
    setAffectedRegions
}: ControlPanelProps) {
    const [scenario, setScenario] = useState('None');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [scenarios, setScenarios] = useState<DisasterScenario[]>([]);
    const [scenariosLoading, setScenariosLoading] = useState(true);

    /**
     * @brief Load scenarios from backend API
     * @details
     * Fetches predefined scenarios on component mount.
     * Populates dropdown menu with available scenarios.
     * Handles fetch errors with error message display.
     * Sets loading state during fetch operation.
     * 
     * API Endpoint: GET /api/scenarios
     * Response Format: { scenarios: DisasterScenario[] }
     * 
     * Dependencies: None (runs once on mount)
     */
    // Load scenarios from backend
    useEffect(() => {
        const loadScenarios = async () => {
            try {
                // Try primary API first (from env or default)
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                let response;

                try {
                    response = await fetch(`${apiUrl}/scenarios`);
                    if (!response.ok) throw new Error('Primary API failed');
                } catch (primaryError) {
                    console.warn('Primary API unavailable, falling back to local mock:', primaryError);
                    // Fallback to local next.js API
                    response = await fetch('/api/scenarios');
                }

                if (!response || !response.ok) {
                    throw new Error('Failed to load scenarios from both primary and fallback');
                }
                const data = await response.json();
                setScenarios(data.scenarios);
            } catch (error) {
                console.error('Error loading scenarios:', error);
                setErrorMsg('Failed to load scenarios - Backend unavailable');
            } finally {
                setScenariosLoading(false);
            }
        };

        loadScenarios();
    }, []);

    /**
     * @brief Create lookup map for quick scenario data access
     * @details
     * Converts scenarios array to Record (object) keyed by scenario.id
     * Enables O(1) scenario data lookup in event handlers.
     * Updated whenever scenarios array changes (only on mount in practice).
     * 
     * @type Record<string, ScenarioData>
     * @complexity O(n) where n = number of scenarios (only on data load)
     */
    // Create scenario lookup from fetched data
    const SCENARIOS = scenarios.reduce((acc, scenarioItem) => {
        acc[scenarioItem.id] = {
            id: scenarioItem.id,
            label: scenarioItem.label,
            category: scenarioItem.category,
            windSpeed: scenarioItem.windSpeed,
            pressureMb: scenarioItem.pressureMb,
            latitude: scenarioItem.latitude,
            longitude: scenarioItem.longitude,
            direction: scenarioItem.direction,
            translationSpeed: scenarioItem.translationSpeed,
            affectedRegions: scenarioItem.affectedRegions
        };
        return acc;
    }, {} as Record<string, DisasterScenario>);

    /**
     * @brief Handle region selection change
     * @details
     * Updates selected region and validates against current scenario.
     * If new region is not in affected regions, clears scenario and contraflow mode.
     * Persists selection to localStorage (if cookies accepted).
     * 
     * @param newRegion The newly selected region value
     * @returns void
     * 
     * Side Effects:
     * - Updates region state
     * - Clears scenario if region mismatch
     * - Saves to localStorage (if GDPR consent given)
     */
    const handleRegionChange = (newRegion: string) => {
        setRegion(newRegion);

        // If user manually changes region and it's not in the affected regions, clear the scenario
        if (affectedRegions.length > 0 && !affectedRegions.includes(newRegion)) {
            setScenario('None');
            setAffectedRegions([]);
            setShowContraflow(false);
        }

        // Only save to localStorage if user accepted cookies
        const cookieConsent = localStorage.getItem('vectra_cookie_consent');
        if (cookieConsent === 'accepted') {
            localStorage.setItem('vectra_region', newRegion);
        }
    };

    /**
     * @brief Handle scenario selection
     * @details
     * Updates all simulation parameters from selected scenario:
     * - Sets direction, velocity, affected regions
     * - Auto-enables contraflow mode if scenario selected
     * - Auto-selects first affected region
     * - Persists selection to localStorage
     * 
     * Special Case:
     * - "None" scenario clears affected regions but preserves selected region
     * - Disables contraflow to show baseline routing
     * 
     * @param scenarioId The selected scenario ID
     * @returns void
     * 
     * @note Uses SCENARIOS lookup map for O(1) parameter retrieval
     */
    const handleScenarioChange = (scenarioId: string) => {
        setScenario(scenarioId);

        const scenarioData = SCENARIOS[scenarioId];
        if (scenarioData) {
            setEventDirection(scenarioData.direction);
            setEventVelocity(scenarioData.windSpeed);
            setEventLatitude(scenarioData.latitude);
            setEventLongitude(scenarioData.longitude);
            setAffectedRegions(scenarioData.affectedRegions);

            // Auto-enable contraflow if scenario is not 'None'
            if (scenarioId !== 'None') {
                setShowContraflow(true);
                // Auto-select first affected region only if scenario is not 'None'
                if (scenarioData.affectedRegions.length > 0) {
                    setRegion(scenarioData.affectedRegions[0]);
                }
            } else {
                setShowContraflow(false);
                // Don't change region when scenario is None - keep user's selected region
            }

            // Save to localStorage only if user accepted cookies
            const cookieConsent = localStorage.getItem('vectra_cookie_consent');
            if (cookieConsent === 'accepted') {
                localStorage.setItem('vectra_scenario', scenarioId);
            }
        }
    };

    /**
     * @brief Handle direction input change
     * @details
     * Validates and clamps direction value to [0, 360] degrees.
     * 0° = North, 90° = East, 180° = South, 270° = West
     * Handles non-numeric input by defaulting to 0.
     * 
     * @param event React input change event
     * @returns void
     * 
     * @note Clamping: Math.max(0, Math.min(360, value))
     */
    const handleDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(0, Math.min(360, parseFloat(event.target.value) || 0));
        setEventDirection(value);
    };

    /**
     * @brief Handle velocity (speed parameter) input change
     * @details
     * Validates and ensures velocity is non-negative.
     * Handles non-numeric input by defaulting to 0.
     * No upper limit to accommodate various scenarios.
     * 
     * @param event React input change event  
     * @returns void
     * 
     * @note Validation: Math.max(0, value) ensures velocity >= 0
     */
    const handleVelocityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(0, parseFloat(event.target.value) || 0);
        setEventVelocity(value);
    };

    return (
        <div className="fixed top-5 right-5 z-[9999] w-80 p-4 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-blue-600 mb-1">VECTRA UI</h2>
                <h3 className="text-sm font-bold text-red-600 mb-2">Evacuation Control</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    <strong>VECTRA UI</strong> (Vehicle Evacuation Counterflow Traffic Resilience Application) simulates <strong>Evacuation</strong> scenarios.
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                    Enables <strong>Contraflow Lane Reversal</strong> on major evacuation routes and <strong>Toll Roads</strong> (I-75, I-95, I-4, I-10, Turnpike) based on disaster event trajectory.
                </p>
            </div>

            <div className="mb-4">
                <label htmlFor="evacuation-scenario" className="block text-sm font-bold text-gray-800 mb-2">Evacuation Scenario</label>
                <select
                    id="evacuation-scenario"
                    value={scenario}
                    onChange={(e) => handleScenarioChange(e.target.value)}
                    disabled={scenariosLoading}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="None">None</option>
                    {scenarios.map((scenarioItem) => (
                        <option key={scenarioItem.id} value={scenarioItem.id}>{scenarioItem.label}</option>
                    ))}
                </select>
            </div>

            {affectedRegions.length > 0 && (
                <div className="mb-4 p-2 rounded-md bg-yellow-100 border border-yellow-400">
                    <p className="text-xs font-bold text-yellow-800 mb-1">⚠️ Affected Regions:</p>
                    <p className="text-xs text-yellow-800">{affectedRegions.join(', ')}</p>
                </div>
            )}

            <div className="mb-4">
                <label htmlFor="region-select" className="block text-sm font-bold text-gray-800 mb-2">Select Region for Detail</label>
                <select
                    id="region-select"
                    value={region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="Tampa Bay">Tampa Bay</option>
                    <option value="Orlando">Orlando</option>
                    <option value="Miami">Miami</option>
                    <option value="Jacksonville">Jacksonville</option>
                    <option value="Tallahassee">Tallahassee</option>
                    <option value="Pensacola">Pensacola</option>
                    <option value="Lakeland-Winter Haven">Lakeland-Winter Haven</option>
                    <option value="Cape Coral-Fort Myers">Cape Coral-Fort Myers</option>
                    <option value="Sarasota-North Port">Sarasota-North Port</option>
                    <option value="Daytona Beach">Daytona Beach-Deltona</option>
                    <option value="Palm Bay-Melbourne">Palm Bay-Melbourne</option>
                    <option value="Port St. Lucie">Port St. Lucie</option>
                    <option value="Ocala">Ocala</option>
                    <option value="Gainesville">Gainesville</option>
                    <option value="Naples-Marco Island">Naples-Marco Island</option>
                </select>
            </div>

            {/* Removed Direction and Velocity inputs as per request */}

            <button
                onClick={() => setShowContraflow(!showContraflow)}
                className={`w-full font-bold py-2 px-4 rounded-lg text-sm transition-colors mb-3 ${showContraflow
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
            >
                {showContraflow ? 'Hide Contraflow' : 'Show Contraflow'}
            </button>

            {errorMsg && (
                <div className="p-3 rounded-md bg-red-50 border border-red-300">
                    <div className="flex justify-between items-start gap-2">
                        <p className="text-sm text-red-700">{errorMsg}</p>
                        <button
                            onClick={() => setErrorMsg(null)}
                            className="text-red-700 hover:text-red-900 font-bold text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

