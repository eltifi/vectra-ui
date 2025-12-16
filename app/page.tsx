/**
 * @file page.tsx
 * @brief Main application page for VECTRA UI evacuation simulator
 * @details
 * Home page component that orchestrates the entire VECTRA UI application.
 * Manages state for hurricane scenarios, regional selection, and contraflow visualization.
 * Implements localStorage-based persistence for user preferences and cookie consent.
 * 
 * This component:
 * - Loads evacuation scenarios from backend API (/api/scenarios)
 * - Manages user interaction state (region, hurricane direction/velocity, contraflow toggle)
 * - Handles localStorage persistence with cookie consent checking
 * - Dynamically renders MapLayer (Leaflet) to avoid SSR issues
 * - Displays control panel, disclaimers, and cookie consent modals
 * 
 * @see components/MapLayer.tsx for map visualization
 * @see components/ControlPanel.tsx for user input controls
 * @see components/CookieConsent.tsx for preference persistence
 * @see components/LegalDisclaimer.tsx for legal information modal
 */

'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import ControlPanel from '../components/ControlPanel';
import CookieConsent from '../components/CookieConsent';
import LegalDisclaimer from '../components/LegalDisclaimer';
import SystemStatus from '../components/SystemStatus';
import { useApiHealth } from '../lib/health';

/**
 * @brief Data structure for hurricane scenario parameters
 * @details
 * Represents a pre-defined hurricane scenario with Saffir-Simpson classification
 * and regional impact information. Loaded from backend API.
 * 
 * @param id Unique identifier (e.g., "cat3_tampa_bay")
 * @param label Display name (e.g., "Category 3 - Tampa Bay")
 * @param category Saffir-Simpson category (1-5)
 * @param windSpeed Maximum sustained wind speed (mph)
 * @param pressureMb Atmospheric pressure (millibars)
 * @param latitude Latitude of hurricane center
 * @param longitude Longitude of hurricane center
 * @param direction Movement direction in degrees (0-360, 0=North)
 * @param translationSpeed Speed of hurricane movement (mph)
 * @param affectedRegions Array of Florida regions affected by this scenario
 */
interface HurricaneScenario {
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
 * @brief Dynamically imported MapLayer component
 * @details
 * Imported with ssr=false to prevent server-side rendering errors with Leaflet.
 * Leaflet requires window/DOM APIs that are not available during SSR.
 * Shows loading placeholder while component is being loaded.
 */
const MapLayer = dynamic(() => import('../components/MapLayer'), {
    ssr: false,
    loading: () => <div style={{ height: '100vh', background: '#e0e0e0' }}>Loading Map...</div>
});

/**
 * @brief Main Home component for VECTRA UI application
 * @details
 * React functional component that:
 * 1. Manages application state (hurricane parameters, region, contraflow mode)
 * 2. Fetches hurricane scenarios from backend on mount
 * 3. Implements localStorage persistence with GDPR-compliant cookie consent
 * 4. Renders map, controls, and legal notices
 * 
 * @returns JSX.Element - Full-screen application interface with map and controls
 * 
 * State Management:
 * - showContraflow: Boolean toggle for contraflow visualization mode
 * - region: Selected Florida region for detailed view
 * - hurricaneDirection: Bearing in degrees (0-360)
 * - hurricaneVelocity: Wind speed in mph
 * - hurricaneLatitude/Longitude: Hurricane center position
 * - affectedRegions: Array of regions impacted by scenario
 * - scenarios: Fetched hurricane scenario data from API
 * 
 * Persistence Strategy:
 * - Only saves to localStorage if user accepts cookies (vectra_cookie_consent)
 * - Restores state from localStorage on mount if consent given
 * - Auto-loads scenario data from backend API
 * 
 * @see HurricaneScenario interface for scenario data structure
 * @see components/MapLayer.tsx for visualization
 * @see components/ControlPanel.tsx for user input
 */
export default function Home() {
    const [showContraflow, setShowContraflow] = useState(false);
    const [region, setRegion] = useState('Tampa Bay');
    const [hurricaneDirection, setHurricaneDirection] = useState(0);
    const [hurricaneVelocity, setHurricaneVelocity] = useState(0);
    const [hurricaneLatitude, setHurricaneLatitude] = useState(27.5);
    const [hurricaneLongitude, setHurricaneLongitude] = useState(-81.5);
    const [affectedRegions, setAffectedRegions] = useState<string[]>([]);
    const [scenarios, setScenarios] = useState<HurricaneScenario[]>([]);

    // Health check hook - monitors backend status
    const { health, isLoading, checkHealth } = useApiHealth({
        pollInterval: 30000, // Check every 30 seconds
        enableAutoPolling: false // Disable auto-polling to prevent unnecessary checks
    });

    /**
     * @brief Load evacuation scenarios from backend API
     * @details
     * Fetches all pre-defined evacuation scenarios on component mount.
     * Handles fetch errors gracefully with console logging.
     * Called once on mount (empty dependency array).
     * 
     * @async
     * @returns void
     * 
     * @code
     * // API Response format:
     * { scenarios: HurricaneScenario[] }
     * @endcode
     */
    // Load evacuation scenarios from backend
    useEffect(() => {
        const loadScenarios = async () => {
            try {
                const response = await fetch('/api/hurricane-scenarios');
                if (response.ok) {
                    const data = await response.json();
                    setScenarios(data.scenarios);
                }
            } catch (error) {
                console.error('Error loading scenarios:', error);
            }
        };

        loadScenarios();
    }, []);

    /**
     * @brief Load saved preferences from localStorage
     * @details
     * Restores user's previous selections (region, hurricane scenario) from browser storage.
     * Only executes if user has accepted cookies (GDPR compliance).
     * Restores full hurricane scenario state from fetched scenarios array.
     * 
     * Dependencies: scenarios array from backend API
     * 
     * @note Does not restore if scenarios array is empty (API not yet loaded)
     */
    // Persistence
    useEffect(() => {
        const cookieConsent = localStorage.getItem('vectra_cookie_consent');

        // Only load saved preferences if user has accepted cookies
        if (cookieConsent === 'accepted' && scenarios.length > 0) {
            const savedRegion = localStorage.getItem('vectra_region');
            if (savedRegion) setRegion(savedRegion);

            const savedScenario = localStorage.getItem('vectra_scenario');
            if (savedScenario && savedScenario !== 'None' && savedScenario !== 'Custom') {
                // Restore hurricane scenario state from fetched scenarios
                const scenarioData = scenarios.find(s => s.id === savedScenario);
                if (scenarioData) {
                    setHurricaneDirection(scenarioData.direction);
                    setHurricaneVelocity(scenarioData.windSpeed);
                    setHurricaneLatitude(scenarioData.latitude);
                    setHurricaneLongitude(scenarioData.longitude);
                    setAffectedRegions(scenarioData.affectedRegions);
                    setShowContraflow(true);
                }
            }
        }
    }, [scenarios]);

    /**
     * @brief Save region selection to localStorage
     * @details
     * Persists the selected region whenever it changes.
     * Only saves if user has accepted cookie preferences.
     * 
     * Dependencies: region selection changes
     */
    useEffect(() => {
        const cookieConsent = localStorage.getItem('vectra_cookie_consent');
        if (cookieConsent === 'accepted') {
            localStorage.setItem('vectra_region', region);
        }
    }, [region]);

    return (
        <main style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <SystemStatus
                health={health}
                isLoading={isLoading}
                onRetry={checkHealth}
            />
            <MapLayer
                scenario={showContraflow ? 'contraflow' : 'baseline'}
                region={region}
                hurricaneDirection={hurricaneDirection}
                hurricaneVelocity={hurricaneVelocity}
                hurricaneLatitude={hurricaneLatitude}
                hurricaneLongitude={hurricaneLongitude}
                affectedRegions={affectedRegions}
            />
            {/* Only show Control Panel when system is healthy and not loading */}
            {(!isLoading && health.status !== 'unhealthy') && (
                <ControlPanel
                    showContraflow={showContraflow}
                    setShowContraflow={setShowContraflow}
                    region={region}
                    setRegion={setRegion}
                    eventDirection={hurricaneDirection}
                    setEventDirection={setHurricaneDirection}
                    eventVelocity={hurricaneVelocity}
                    setEventVelocity={setHurricaneVelocity}
                    setEventLatitude={setHurricaneLatitude}
                    setEventLongitude={setHurricaneLongitude}
                    affectedRegions={affectedRegions}
                    setAffectedRegions={setAffectedRegions}
                />
            )}
            <LegalDisclaimer />
            <CookieConsent />
        </main>
    );
}
