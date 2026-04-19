/**
 * @file ControlPanel.tsx
 * @brief User control interface for VECTRA UI evacuation simulator
 */

'use client';

import { useState, useEffect } from 'react';
import CapacityChart from './CapacityChart';

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

interface SimulationResult {
    scenario: string;
    max_throughput_vph: number;
    clearance_time_hours: number;
    gridlock_risk: string;
}

interface CompareResult {
    region: string;
    baseline: SimulationResult;
    contraflow: SimulationResult;
    comparison: {
        throughput_gain_pct: number;
        time_saved_hours: number;
        recommendation: 'CONTRAFLOW_RECOMMENDED' | 'BASELINE_SUFFICIENT';
    };
}

export default function ControlPanel({
    showContraflow,
    setShowContraflow,
    region,
    setRegion,
    setEventDirection,
    setEventVelocity,
    setEventLatitude,
    setEventLongitude,
    affectedRegions,
    setAffectedRegions
}: ControlPanelProps) {
    const [scenario, setScenario] = useState('None');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [scenarios, setScenarios] = useState<DisasterScenario[]>([]);
    const [scenariosLoading, setScenariosLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [simData, setSimData] = useState<{scenario: string, throughput: number}[]>([]);
    const [comparison, setComparison] = useState<CompareResult['comparison'] | null>(null);
    const [simLoading, setSimLoading] = useState(false);

    // Load scenarios
    useEffect(() => {
        const loadScenarios = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
                const response = await fetch(`${apiUrl}/scenarios`);
                if (!response.ok) throw new Error('Failed to load scenarios');
                const data = await response.json();
                setScenarios(data.scenarios);
            } catch (error) {
                console.error('Error loading scenarios:', error);
                setErrorMsg('Backend unavailable');
            } finally {
                setScenariosLoading(false);
            }
        };
        loadScenarios();
    }, []);

    // Fetch simulation data when scenario or region changes
    useEffect(() => {
        if (scenario === 'None') {
            setSimData([]);
            setComparison(null);
            return;
        }

        const fetchSim = async () => {
            setSimLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
                const res = await fetch(`${apiUrl}/simulate/compare?region=${encodeURIComponent(region)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: CompareResult = await res.json();

                setSimData([
                    { scenario: 'Baseline',   throughput: data.baseline.max_throughput_vph },
                    { scenario: 'Contraflow', throughput: data.contraflow.max_throughput_vph },
                ]);
                setComparison(data.comparison);
            } catch (err) {
                console.error("Sim fetch error:", err);
                setComparison(null);
            } finally {
                setSimLoading(false);
            }
        };

        fetchSim();
    }, [scenario, region]);

    const handleScenarioChange = (scenarioId: string) => {
        setScenario(scenarioId);
        const scenarioData = scenarios.find(s => s.id === scenarioId);
        if (scenarioData) {
            setEventDirection(scenarioData.direction);
            setEventVelocity(scenarioData.windSpeed);
            setEventLatitude(scenarioData.latitude);
            setEventLongitude(scenarioData.longitude);
            setAffectedRegions(scenarioData.affectedRegions);
            setShowContraflow(scenarioId !== 'None');
            if (scenarioId !== 'None' && scenarioData.affectedRegions.length > 0) {
                setRegion(scenarioData.affectedRegions[0]);
            }
        }
    };

    if (isCollapsed) {
        return (
            <button 
                onClick={() => setIsCollapsed(false)}
                className="fixed top-5 right-5 z-[9999] p-3 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
        );
    }

    return (
        <div className="fixed top-5 right-5 z-[9999] w-80 max-h-[90vh] overflow-y-auto p-4 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl text-slate-200 scrollbar-hide">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                <div>
                    <h2 className="text-xl font-black text-blue-400 tracking-tighter">VECTRA</h2>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Evacuation Control</p>
                </div>
                <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
            </div>

            <div className="space-y-4">
                <section>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Scenario</label>
                    <select
                        value={scenario}
                        onChange={(e) => handleScenarioChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="None">Baseline (No Event)</option>
                        {scenarios.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </section>

                <section>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Region</label>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        {["Tampa Bay", "Orlando", "Miami", "Jacksonville", "Tallahassee", "Pensacola", "Naples-Marco Island"].map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </section>

                {simLoading ? (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-500 animate-pulse">
                        Calculating Network Flow...
                    </div>
                ) : (
                    simData.length > 0 && (
                        <>
                            <CapacityChart data={simData} />
                            {comparison && (
                                <div className={`mt-2 p-2 rounded-lg border text-[11px] space-y-1 ${
                                    comparison.recommendation === 'CONTRAFLOW_RECOMMENDED'
                                        ? 'bg-blue-900/30 border-blue-500/40 text-blue-300'
                                        : 'bg-slate-800/60 border-slate-600/40 text-slate-400'
                                }`}>
                                    <div className="font-bold uppercase tracking-wide">
                                        {comparison.recommendation === 'CONTRAFLOW_RECOMMENDED'
                                            ? '⟳ Contraflow Recommended'
                                            : '✓ Baseline Sufficient'}
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Throughput gain</span>
                                        <span className="font-mono font-semibold">
                                            {comparison.throughput_gain_pct > 0 ? '+' : ''}{comparison.throughput_gain_pct}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Time saved</span>
                                        <span className="font-mono font-semibold">
                                            {comparison.time_saved_hours > 0
                                                ? `${comparison.time_saved_hours}h`
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                )}

                <button
                    onClick={() => setShowContraflow(!showContraflow)}
                    className={`w-full py-3 rounded-lg text-sm font-bold transition-all transform active:scale-95 ${
                        showContraflow ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white shadow-lg`}
                >
                    {showContraflow ? 'Disable Contraflow' : 'Enable Contraflow'}
                </button>
            </div>

            {errorMsg && (
                <div className="mt-4 p-2 bg-red-900/30 border border-red-500/50 rounded text-[11px] text-red-400 flex justify-between">
                    {errorMsg}
                    <button onClick={() => setErrorMsg(null)}>✕</button>
                </div>
            )}
        </div>
    );
}
