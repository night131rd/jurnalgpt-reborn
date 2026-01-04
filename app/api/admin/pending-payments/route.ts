import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // --- Admin Check ---
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : "";

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            console.error('Admin Check - Auth Error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('Admin Check - User:', user.email, 'Role:', profile?.role);

        if (profile?.role !== 'admin') {
            console.warn('Admin Check - Not Admin:', user.email);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // -------------------

        // Fetch payment intents that are waiting for verification
        console.log('Fetching pending payments from DB...');
        const { data, error } = await supabaseAdmin
            .from('payment_intents')
            .select(`
                id,
                user_id,
                plan_type,
                status,
                created_at,
                profiles(email),
                payment_proofs(image_url, paid_amount)
            `)
            .eq('status', 'waiting_verification')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database Query Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('Data found:', data?.length || 0, 'records');
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Internal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
