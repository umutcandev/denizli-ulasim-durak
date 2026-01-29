
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const recordCount = searchParams.get('recordCount') || '5';

    if (!lat || !lng) {
        return NextResponse.json(
            { isSuccess: false, message: 'Latitude or longitude is missing' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetAllDealers?lat=${lat}&lng=${lng}&recordCount=${recordCount}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching dealers:', error);
        return NextResponse.json(
            { isSuccess: false, message: 'Failed to fetch dealers data' },
            { status: 500 }
        );
    }
}
