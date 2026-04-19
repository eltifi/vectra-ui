import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Proxies GET /api/stats → backend /stats
export async function GET() {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    try {
        const response = await fetch(`${apiUrl}/stats`, {
            next: { revalidate: 3600 },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error proxying stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch network statistics' },
            { status: 503 }
        );
    }
}
