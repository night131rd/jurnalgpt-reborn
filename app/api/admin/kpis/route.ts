import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfSevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfThirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Fetch search logs and profiles
        const { data: searchLogs } = await supabaseAdmin
            .from('search_logs')
            .select('created_at, user_id, status, query, year')
            .order('created_at', { ascending: true });

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, created_at, role, tanggal_upgrade_premium');

        const logs = searchLogs || [];
        const users = profiles || [];

        // 2. DAU, WAU, MAU
        const dauSet = new Set(logs.filter(l => new Date(l.created_at) >= startOfToday).map(l => l.user_id || 'guest'));
        const wauSet = new Set(logs.filter(l => new Date(l.created_at) >= startOfSevenDaysAgo).map(l => l.user_id || 'guest'));
        const mauSet = new Set(logs.filter(l => new Date(l.created_at) >= startOfThirtyDaysAgo).map(l => l.user_id || 'guest'));

        // 3. Activation (Calculated from mv_kpi_activation_by_plan during parallel fetch below)

        // 4. WSR (Weekly Search Retention) - To be fetched from mv_kpi_wsr_by_plan

        // 5. SPAU
        const activeUsersCount = mauSet.size;
        const totalSearches = logs.length;
        const spau = activeUsersCount ? (totalSearches / activeUsersCount) : 0;

        // 6. Adoption (Filter Usage)
        const filterUsedCount = logs.filter(l => l.year && l.year !== '2020-2025' && l.year !== '-').length;
        const adoptionScore = totalSearches ? (filterUsedCount / totalSearches) : 0;

        // 7. TTV
        // Free: time sign up - first search
        // Premium: time upgraded - first search after upgrade
        let totalFreeTTV = 0;
        let freeTTVCount = 0;
        let totalPremiumTTV = 0;
        let premiumTTVCount = 0;

        users.forEach(u => {
            const userLogs = logs.filter(l => l.user_id === u.id);
            if (userLogs.length > 0) {
                // Free TTV
                const firstSearch = new Date(userLogs[0].created_at);
                const signup = new Date(u.created_at);
                const diff = firstSearch.getTime() - signup.getTime();
                if (diff > 0) {
                    totalFreeTTV += diff;
                    freeTTVCount++;
                }

                // Premium TTV
                if (u.tanggal_upgrade_premium) {
                    const upgradeTime = new Date(u.tanggal_upgrade_premium);
                    const firstSearchAfterUpgrade = userLogs.find(l => new Date(l.created_at) > upgradeTime);
                    if (firstSearchAfterUpgrade) {
                        const premiumDiff = new Date(firstSearchAfterUpgrade.created_at).getTime() - upgradeTime.getTime();
                        if (premiumDiff > 0) {
                            totalPremiumTTV += premiumDiff;
                            premiumTTVCount++;
                        }
                    }
                }
            }
        });

        const avgFreeTTV = freeTTVCount ? (totalFreeTTV / freeTTVCount / 1000 / 60).toFixed(2) : 0; // minutes
        const avgPremiumTTV = premiumTTVCount ? (totalPremiumTTV / premiumTTVCount / 1000 / 60).toFixed(2) : 0; // minutes

        // 8. Churn is now calculated below in Step 9 based on finalWsr

        // 9. Fetch DAU, WAU, MAU, Activation, SPAU, and WSR from Materialized Views
        const [dauRes, wauRes, mauRes, activationRes, spauTrendRes, wsrRes, conversionRes] = await Promise.all([
            supabaseAdmin.from('mv_kpi_dau_by_plan').select('day, plan, dau').order('day', { ascending: true }),
            supabaseAdmin.from('mv_kpi_wau_by_plan').select('week, plan, wau').order('week', { ascending: true }),
            supabaseAdmin.from('mv_kpi_mau_by_plan').select('month, plan, mau').order('month', { ascending: true }),
            supabaseAdmin.from('mv_kpi_activation_by_plan').select('*'),
            supabaseAdmin.from('mv_kpi_daily_spau').select('day, spau').order('day', { ascending: true }),
            supabaseAdmin.from('mv_kpi_wsr_by_plan').select('*'),
            supabaseAdmin.from('mv_kpi_conversion_to_paid').select('*')
        ]);

        const spauTrend = (spauTrendRes.data || []).map(row => ({
            date: row.day,
            spau: Number(row.spau).toFixed(2)
        }));

        const totalRegistered = (activationRes.data || []).reduce((acc, curr) => acc + Number(curr.registered_users || 0), 0);
        const totalActivated = (activationRes.data || []).reduce((acc, curr) => acc + Number(curr.activated_users || 0), 0);
        const finalActivationRate = totalRegistered ? (totalActivated / totalRegistered) : 0;

        // Aggregate WSR: (retained users / total users in previous week)
        // Assuming columns: week_start, plan, previous_week_users, retained_users
        const totalRetained = (wsrRes.data || []).reduce((acc, curr) => acc + Number(curr.retained_users || 0), 0);
        const totalPrevWeekUsers = (wsrRes.data || []).reduce((acc, curr) => acc + Number(curr.previous_week_users || 0), 0);
        const finalWsr = totalPrevWeekUsers ? (totalRetained / totalPrevWeekUsers) : 0;

        // Aggregate Conversion: (paid users / activated users)
        // Assuming columns: plan, paid_users, activated_users, conversion_rate
        const totalPaid = (conversionRes.data || []).reduce((acc, curr) => acc + Number(curr.paid_users || 0), 0);
        const totalActivatedConv = (conversionRes.data || []).reduce((acc, curr) => acc + Number(curr.activated_users || 0), 0);
        const finalConversionRate = totalActivatedConv ? (totalPaid / totalActivatedConv) : 0;

        const pivotData = (data: any[] | null, dateKey: string, valueKey: string) => {
            const map: Record<string, any> = {};
            (data || []).forEach(row => {
                const date = row[dateKey];
                if (!map[date]) map[date] = { date: date };
                map[date][row.plan] = row[valueKey];
            });
            return Object.values(map);
        };

        const chartData = {
            daily: pivotData(dauRes.data, 'day', 'dau'),
            weekly: pivotData(wauRes.data, 'week', 'wau'),
            monthly: pivotData(mauRes.data, 'month', 'mau')
        };

        const data = {
            activeUsers: {
                dau: dauSet.size,
                wau: wauSet.size,
                mau: mauSet.size,
            },
            retention: {
                activation: finalActivationRate,
                wsr: finalWsr,
                churn: 1 - finalWsr,
                conversion: finalConversionRate
            },
            engagement: {
                totalSearches,
                spau: spau.toFixed(2),
            },
            adoption: {
                score: adoptionScore,
            },
            ttv: {
                free: avgFreeTTV,
                premium: avgPremiumTTV,
            },
            charts: {
                dailySearches: chartData.daily,
                weeklyActive: chartData.weekly,
                monthlyActive: chartData.monthly,
                spauTrend
            }
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('KPI API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
    }
}
