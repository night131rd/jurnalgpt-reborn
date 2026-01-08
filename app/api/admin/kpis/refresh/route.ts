import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Attempt to call a custom RPC function that refreshes all MVs
        // User needs to create this function in Supabase SQL editor:
        /*
        CREATE OR REPLACE FUNCTION refresh_kpi_materialized_views()
        RETURNS void AS $$
        BEGIN
            REFRESH MATERIALIZED VIEW mv_kpi_dau_by_plan;
            REFRESH MATERIALIZED VIEW mv_kpi_wau_by_plan;
            REFRESH MATERIALIZED VIEW mv_kpi_mau_by_plan;
            REFRESH MATERIALIZED VIEW mv_kpi_activation_by_plan;
            REFRESH MATERIALIZED VIEW mv_kpi_daily_spau;
            REFRESH MATERIALIZED VIEW mv_kpi_wsr_by_plan;
            REFRESH MATERIALIZED VIEW mv_kpi_conversion_to_paid;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        */

        const { error } = await supabaseAdmin.rpc('refresh_kpi_materialized_views');

        if (error) {
            console.error('Error refreshing MVs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'All Materialized Views refreshed successfully' });
    } catch (error: any) {
        console.error('Refresh API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
