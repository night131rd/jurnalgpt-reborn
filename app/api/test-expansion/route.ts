
import { NextResponse } from 'next/server';
import { expandQuery } from '@/lib/services/llmService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'AI';
    const result = await expandQuery(query);
    return NextResponse.json({ query, result });
}
