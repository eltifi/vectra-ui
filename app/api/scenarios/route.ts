/**
 * @file route.ts
 * @brief Mock API route for fetching disaster scenarios
 * @details
 * Provides static mock data for scenarios to allow frontend development
 * without a running backend service.
 */

import { NextResponse } from 'next/server';

export async function GET() {
    const scenarios = [
        {
            id: 'cat3_tampa_bay',
            label: 'Category 3 - Tampa Bay',
            category: 3,
            windSpeed: 115,
            pressureMb: 960,
            latitude: 27.5,
            longitude: -83.0,
            direction: 45,
            translationSpeed: 12,
            affectedRegions: ['Tampa Bay', 'Sarasota-North Port', 'Lakeland-Winter Haven']
        },
        {
            id: 'cat4_miami',
            label: 'Category 4 - Miami',
            category: 4,
            windSpeed: 140,
            pressureMb: 940,
            latitude: 25.0,
            longitude: -79.5,
            direction: 290,
            translationSpeed: 14,
            affectedRegions: ['Miami', 'Cape Coral-Fort Myers', 'Naples-Marco Island', 'Port St. Lucie']
        },
        {
            id: 'cat5_keys',
            label: 'Category 5 - Florida Keys',
            category: 5,
            windSpeed: 165,
            pressureMb: 910,
            latitude: 24.0,
            longitude: -81.0,
            direction: 315,
            translationSpeed: 10,
            affectedRegions: ['Miami', 'Naples-Marco Island', 'Cape Coral-Fort Myers']
        }
    ];

    return NextResponse.json({ scenarios });
}
