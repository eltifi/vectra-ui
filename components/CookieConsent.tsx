/**
 * @file CookieConsent.tsx
 * @brief GDPR-compliant cookie consent banner component
 * @details
 * Floating banner that requests user consent for browser local storage usage.
 * When accepted, enables localStorage persistence of:
 * - Selected region (vectra_region)
 * - Evacuation scenario (vectra_scenario)
 * 
 * Features:
 * - Shows only once per browser (checks localStorage)
 * - Accept button: Enables preference persistence
 * - Deny button: Clears any existing saved preferences
 * - In-app privacy policy link with modal explanation
 * - Gradient styling and glassmorphism effects
 * - GDPR/California privacy law compliance
 * 
 * @see page.tsx and ControlPanel.tsx which check for 'vectra_cookie_consent' value
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * @brief CookieConsent component - GDPR consent banner
 * @details
 * Renders a floating Material-UI paper with cookie consent options.
 * Only displays if no previous consent choice found in localStorage.
 * 
 * @returns JSX.Element | null - Paper banner or null if already chosen
 * 
 * Storage Keys:
 * - vectra_cookie_consent: 'accepted' | (not set if denied)
 * - vectra_region: Deleted if denied
 * - vectra_scenario: Deleted if denied
 */
export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    /**
     * @brief Check if user has previously made a cookie consent choice
     * @details
     * On component mount, checks localStorage for vectra_cookie_consent key.
     * Shows banner only if no previous choice was made.
     * 
     * Dependencies: None (runs once on mount)
     */
    useEffect(() => {
        // Check if user has already made a choice
        const cookieChoice = localStorage.getItem('vectra_cookie_consent');
        if (!cookieChoice) {
            setShowBanner(true);
        }
    }, []);

    /**
     * @brief Handle user accepting cookies
     * @details
     * Sets vectra_cookie_consent to 'accepted' in localStorage.
     * Enables subsequent localStorage writes in page.tsx and ControlPanel.tsx.
     * Hides banner.
     */
    const handleAccept = () => {
        localStorage.setItem('vectra_cookie_consent', 'accepted');
        setShowBanner(false);
    };

    /**
     * @brief Handle user denying cookies
     * @details
     * Removes any previously saved preferences from localStorage.
     * Does NOT set vectra_cookie_consent key (causes banner to reappear on reload).
     * Ensures privacy even if user previously accepted.
     */
    const handleDeny = () => {
        // Clear any previously saved cookies
        localStorage.removeItem('vectra_region');
        localStorage.removeItem('vectra_scenario');
        // Don't set cookie_consent - so banner shows again on next reload
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm p-6 rounded-lg bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-2xl">
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">🍪 Cookie Preferences</h2>
                <p className="text-sm leading-relaxed">
                    We use cookies to remember your preferences (region selection and evacuation scenario). 
                    This helps us provide a better experience on your next visit. We comply with GDPR and California privacy laws.
                </p>
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked disabled className="w-4 h-4 opacity-70" />
                        <label className="text-sm"><strong>Essential Cookies</strong> - Required for the app to function</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked disabled className="w-4 h-4 opacity-70" />
                        <label className="text-sm"><strong>Preference Cookies</strong> - Remember your choices</label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleAccept}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        ✓ Accept Cookies
                    </button>
                    <button
                        onClick={handleDeny}
                        className="flex-1 border border-white/50 hover:border-white hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        ✗ Deny Cookies
                    </button>
                </div>

                <div className="text-xs opacity-80">
                    <a 
                        href="#privacy" 
                        className="text-white/90 hover:text-white"
                        onClick={(e) => {
                            e.preventDefault();
                            alert('Privacy Policy: We store your region and evacuation scenario selections locally on your device using browser cookies. This data is never sent to external servers.');
                        }}
                    >
                        Privacy Policy
                    </a>
                </div>
            </div>
        </div>
    );
}
