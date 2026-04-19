/**
 * @file route.ts
 * @brief Simple Proxy API route for fetching road segments
 * @details
 * Proxies requests to the Hono backend.
 * Caching is handled at the backend layer (Cloudflare KV).
 * Uses Edge Runtime for compatibility with Cloudflare Pages.
 * 
 * @author Vectra Project
 * @date 2026-04-11
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    try {
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
        
        const response = await fetch(`${apiUrl}/segments`, {
            next: { revalidate: 3600 } // Use Next.js fetch cache as well
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching segments:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve segments data' },
            { status: 503 }
        );
    }
}
