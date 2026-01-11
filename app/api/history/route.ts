import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch search history
export async function GET(request: NextRequest) {
    try {
        // Get auth token from header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.substring(7);

        // Create client with user's token
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        // Get user from token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

        const { data, error } = await supabase
            .from('search_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Failed to get search history:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ history: data || [] });
    } catch (error) {
        console.error('History GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Save new search to history
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

        const { query, payload } = await request.json();

        if (!query || !payload) {
            return NextResponse.json({ error: 'Query and payload are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('search_history')
            .insert({
                user_id: user.id,
                query,
                payload
            });

        if (error) {
            console.error('Failed to save search history:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('History POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove history entry
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
        const clearAll = request.nextUrl.searchParams.get('all') === 'true';

        if (clearAll) {
            // Delete all history for user
            const { error } = await supabase
                .from('search_history')
                .delete()
                .eq('user_id', user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        } else if (id) {
            // Delete specific entry
            const { error } = await supabase
                .from('search_history')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('History DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
