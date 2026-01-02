import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        // Google Autocomplete XML/JSON endpoint (JSON used here)
        // client=chrome or client=firefox usually returns a cleaner JSON array
        const googleUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;

        const response = await fetch(googleUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error('Google suggestions unreachable');
        }

        const data = await response.json();
        // Firefox client returns: [query, [suggestion1, suggestion2, ...]]
        const suggestions = data[1] || [];

        return NextResponse.json(suggestions);
    } catch (error) {
        console.error('Proxy suggestions error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
