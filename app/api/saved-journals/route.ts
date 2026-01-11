import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch saved journals
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.substring(7);

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('saved_journals')
            .select('*')
            .eq('user_id', user.id)
            .order('saved_at', { ascending: false });

        if (error) {
            console.error('Failed to get saved journals:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to Journal format
        const journals = (data || []).map(row => ({
            id: row.id,
            title: row.title,
            year: row.year,
            publisher: row.publisher,
            journalLink: row.journal_link,
            abstract: row.abstract,
            doi: row.doi,
            authors: row.authors,
            citationCount: row.citation_count,
            source: row.source,
            saved_at: row.saved_at
        }));

        return NextResponse.json({ journals });
    } catch (error) {
        console.error('Saved journals GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Save a journal
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.substring(7);

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const journal = await request.json();

        if (!journal.title) {
            return NextResponse.json({ error: 'Journal title is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('saved_journals')
            .insert({
                user_id: user.id,
                title: journal.title,
                year: journal.year,
                publisher: journal.publisher,
                journal_link: journal.journalLink,
                abstract: journal.abstract,
                doi: journal.doi,
                authors: journal.authors,
                citation_count: journal.citationCount,
                source: journal.source
            });

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Journal already saved' }, { status: 409 });
            }
            console.error('Failed to save journal:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Saved journals POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove saved journal
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.substring(7);

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = request.nextUrl.searchParams.get('id');
        const title = request.nextUrl.searchParams.get('title');

        if (id) {
            const { error } = await supabase
                .from('saved_journals')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        } else if (title) {
            const { error } = await supabase
                .from('saved_journals')
                .delete()
                .eq('title', title)
                .eq('user_id', user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Missing id or title parameter' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Saved journals DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
