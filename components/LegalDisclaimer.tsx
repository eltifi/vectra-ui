/**
 * @file LegalDisclaimer.tsx
 * @brief Legal terms and disclaimer modal for VECTRA UI application
 * @details
 * Full-screen modal displayed on first visit with important legal information:
 * - Data source attribution (FDOT - not affiliated)
 * - FDOT data attribution and usage guidelines
 * - No warranty disclaimers
 * - GDPR/California privacy law compliance
 * - AGPL-3.0 licensing information
 * 
 * Features:
 * - Shows only once per browser (localStorage persistence)
 * - Required acceptance before using application
 * - Scrollable content for accessibility
 * - Warning icon and color-coded sections
 * - Link to GitHub LICENSE file
 * 
 * @see Legal / terms acceptance stored in vectra_disclaimer_accepted
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * @brief LegalDisclaimer component - required legal acknowledgment
 * @details
 * Full-screen modal overlay requiring user acceptance of legal terms.
 * Must be acknowledged before user can interact with application.
 * 
 * @returns JSX.Element | null - Modal or null if already accepted
 * 
 * Storage Key: vectra_disclaimer_accepted = 'true'
 */
export default function LegalDisclaimer() {
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    /**
     * @brief Check if user has accepted legal disclaimer
     * @details
     * On component mount, checks localStorage for vectra_disclaimer_accepted key.
     * Shows modal only on first visit or if key was manually cleared.
     * 
     * Dependencies: None (runs once on mount)
     */
    useEffect(() => {
        const disclaimerAccepted = localStorage.getItem('vectra_disclaimer_accepted');
        if (!disclaimerAccepted) {
            setShowDisclaimer(true);
        }
    }, []);

    /**
     * @brief Handle user accepting legal terms
     * @details
     * Sets vectra_disclaimer_accepted to 'true' in localStorage.
     * Prevents modal from showing again on future visits.
     * Allows application to load and function normally.
     */
    const handleAccept = () => {
        localStorage.setItem('vectra_disclaimer_accepted', 'true');
        setShowDisclaimer(false);
    };

    if (!showDisclaimer) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl max-h-80 overflow-y-auto p-6 rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">⚠️</span>
                        <h2 className="text-lg font-bold">Legal Disclaimer & Terms of Use</h2>
                    </div>

                    <p className="text-sm leading-relaxed mb-4">
                        This application uses public geospatial data from the <strong>Florida Department of Transportation (FDOT)</strong>. 
                        This project is <strong>NOT affiliated with FDOT</strong>. 
                        <strong>This product uses FDOT public data.</strong> 
                        No warranty provided. Not for emergency response.
                    </p>

                    <div className="flex gap-3 pt-2 mb-4">
                        <button
                            onClick={handleAccept}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
                        >
                            ✓ Accept & Continue
                        </button>
                        <button
                            onClick={() => setShowDisclaimer(false)}
                            className="border border-white/50 hover:border-white hover:bg-white/10 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
                        >
                            ✗ Review Later
                        </button>
                    </div>

                    <div className="text-xs opacity-90">
                        <a 
                            href="https://github.com/eltifi/vectra/blob/main/LICENSE"
                            target="_blank"
                            rel="noopener"
                            className="text-white/90 hover:text-white hover:underline"
                        >
                            View Full License (AGPL-3.0)
                        </a>
                    </div>
                </div>

                <button
                    onClick={() => setShowDisclaimer(false)}
                    className="text-white hover:bg-white/10 rounded-full p-1 flex-shrink-0 transition-colors"
                    aria-label="Close"
                >
                    <span className="text-2xl">✕</span>
                </button>
            </div>
        </div>
    );
}
