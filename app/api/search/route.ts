import { NextRequest, NextResponse } from 'next/server';
import { searchJournals } from '@/lib/services/searchService';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, minYear, maxYear, scope } = body;

        // Validation
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return NextResponse.json(
                { error: 'Query is required and must be a non-empty string' },
                { status: 400 }
            );
        }

        // Quota Logic
        const cookieStore = await cookies();
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : "";

        const { data: { user } } = await supabaseAdmin.auth.getUser(token);

        if (!user) {
            // Guest Quota Implementation
            let guestId = cookieStore.get('guest_id')?.value;
            if (!guestId) {
                guestId = crypto.randomUUID();
                cookieStore.set('guest_id', guestId, {
                    maxAge: 60 * 60 * 24 * 365, // 1 year
                    path: '/'
                });
            }

            const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip') ||
                '127.0.0.1';

            // Check usage in Supabase
            let { data: usage, error: fetchError } = await supabaseAdmin
                .from('guest_search_usage')
                .select('*')
                .eq('guest_id', guestId)
                .maybeSingle();

            if (fetchError) console.error('Supabase fetch error:', fetchError);

            // Fallback to IP if guest_id not found (prevents simple cookie bypass)
            if (!usage) {
                const { data: usageByIp, error: ipFetchError } = await supabaseAdmin
                    .from('guest_search_usage')
                    .select('*')
                    .eq('ip_address', ipAddress)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (ipFetchError) console.error('Supabase IP fetch error:', ipFetchError);
                if (usageByIp) usage = usageByIp;
            }

            const currentCount = usage?.search_count || 0;
            console.log(`Guest Trace - ID: ${guestId}, IP: ${ipAddress}, Count: ${currentCount}`);

            if (currentCount >= 3) {
                cookieStore.set('guest_quota', '0', { maxAge: 60 * 60 * 24 * 365, path: '/' });
                return NextResponse.json(
                    { error: 'Kuota tamu habis. Silakan masuk untuk mendapatkan kuota lebih banyak!' },
                    { status: 403 }
                );
            }

            // Increment usage
            const newCount = currentCount + 1;
            if (!usage) {
                const { error: insertError } = await supabaseAdmin.from('guest_search_usage').insert({
                    guest_id: guestId,
                    ip_address: ipAddress,
                    search_count: newCount
                });
                if (insertError) console.error('Supabase insert error:', insertError);
            } else {
                const { error: updateError } = await supabaseAdmin.from('guest_search_usage')
                    .update({
                        search_count: newCount,
                        ip_address: ipAddress,
                        guest_id: guestId // sync guest_id
                    })
                    .eq('id', usage.id);
                if (updateError) console.error('Supabase update error:', updateError);
            }

            // Sync the legacy guest_quota cookie for the UI
            cookieStore.set('guest_quota', (3 - newCount).toString(), {
                maxAge: 60 * 60 * 24 * 365,
                path: '/'
            });
        } else {
            // Logged-in User Quota
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role, sisa_quota')
                .eq('id', user.id)
                .single();

            if (profile && profile.role !== 'premium') {
                if (profile.sisa_quota <= 0) {
                    return NextResponse.json(
                        { error: 'Kuota harian kamu sudah habis. Tunggu besok atau upgrade premium!' },
                        { status: 403 }
                    );
                }

                // Decrement quota
                await supabaseAdmin
                    .from('profiles')
                    .update({ sisa_quota: profile.sisa_quota - 1 })
                    .eq('id', user.id);
            }
        }

        // Determine premium status for search parameters
        let isPremium = false;
        if (user) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            isPremium = profile?.role === 'premium';
        }

        // Execute search
        const { journals, stream } = await searchJournals(
            query.trim(),
            minYear || '2020',
            maxYear || '2025',
            scope || 'all',
            isPremium
        );

        // Create a streaming response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    // 1. Send journals as a JSON line with prefix "J:"
                    const journalsPayload = JSON.stringify({ journals });
                    controller.enqueue(encoder.encode(`J:${journalsPayload}\n`));

                    // 2. Stream answer text chunks with prefix "T:"
                    // In case tokens contain newlines, we can handle them on client, but usually tokens are small.
                    // To be safe, we can just stream raw text after the newline, but splitting by newlines on client might be tricky if content has newlines.
                    // Let's use "T:" for every chunk and ensure we handle newlines in content correctly.
                    // Actually, simpler: "J:{...}\n" then just raw text.
                    // The client reads "J:{...}\n", parses it, and treats the rest as answer stream.

                    for await (const chunk of stream) {
                        controller.enqueue(encoder.encode(chunk));
                    }

                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Disable caching for dynamic API
export const dynamic = 'force-dynamic';
