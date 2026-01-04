import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // --- Admin Check ---
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : "";

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // -------------------

        const { intentId, userId } = await request.json();

        if (!intentId || !userId) {
            return NextResponse.json({ error: 'Missing intentId or userId' }, { status: 400 });
        }

        // 1. Fetch intent to get plan type
        const { data: intent, error: intentError } = await supabaseAdmin
            .from('payment_intents')
            .select('plan_type')
            .eq('id', intentId)
            .single();

        if (intentError || !intent) {
            return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
        }

        const planType = intent.plan_type;
        const premiumDays = planType === 'weekly' ? 7 : 30;

        // 2. Start Approval Process - Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'premium',
                tipe_premium: planType,
                tanggal_upgrade_premium: new Date().toISOString(),
                sisa_waktu_premium: premiumDays,
                sisa_quota: 0
            })
            .eq('id', userId);

        if (profileError) {
            console.error('Error updating profile:', profileError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        // 3. Update Payment Intent Status
        const { error: updateIntentError } = await supabaseAdmin
            .from('payment_intents')
            .update({ status: 'active' })
            .eq('id', intentId);

        if (updateIntentError) {
            console.error('Error updating intent:', updateIntentError);
            // Even if this fails, the user is already premium, maybe we should log this.
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Approval API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
