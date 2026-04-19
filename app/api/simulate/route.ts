import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Proxies GET /api/simulate?region=&lat=&lon= → backend /simulate/compare
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'Tampa Bay';
    const lat    = searchParams.get('lat');
    const lon    = searchParams.get('lon');

    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    const params = new URLSearchParams({ region });
    if (lat) params.set('lat', lat);
    if (lon) params.set('lon', lon);

    try {
        const response = await fetch(`${apiUrl}/simulate/compare?${params}`, {
            cache: 'no-store',
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error proxying simulate/compare:', error);
        return NextResponse.json(
            { error: 'Failed to fetch simulation data' },
            { status: 503 }
        );
    }
}
