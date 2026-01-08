'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Zap,
    ArrowUpRight,
    BarChart3,
    MousePointer2,
    Clock,
    RefreshCcw,
    TrendingUp,
    ShieldCheck,
    Search
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';

interface KPIData {
    activeUsers: { dau: number; wau: number; mau: number };
    retention: { activation: number; wsr: number; churn: number; conversion: number };
    engagement: { totalSearches: number; spau: string };
    adoption: { score: number };
    ttv: { free: string; premium: string };
    charts: {
        dailySearches: any[];
        weeklyActive: any[];
        monthlyActive: any[];
        spauTrend: { date: string, spau: string }[];
    };
}

export default function AdminDashboard() {
    const { isAdmin, loading: authLoading } = useAdminAuth();
    const [data, setData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const fetchData = () => {
        setLoading(true);
        fetch('/api/admin/kpis')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/admin/kpis/refresh', { method: 'POST' });
            if (res.ok) {
                // Fetch data again after successful refresh
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error refreshing data: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            alert('Failed to refresh data. Please make sure the SQL function is installed.');
        } finally {
            setRefreshing(false);
        }
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading metrics...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const cards = [
        {
            title: 'Activation Rate',
            value: `${(data.retention.activation * 100).toFixed(1)}%`,
            icon: Zap,
            color: 'bg-amber-500',
            trend: '',
            desc: 'Persentase user aktif / total user'
        },
        {
            title: 'Conversion to Paid',
            value: `${(data.retention.conversion * 100).toFixed(1)}%`,
            icon: ShieldCheck,
            color: 'bg-indigo-500',
            trend: '',
            desc: 'Paid users / Activated users'
        },
        {
            title: 'Retention (WSR)',
            value: `${(data.retention.wsr * 100).toFixed(1)}%`,
            icon: RefreshCcw,
            color: 'bg-emerald-500',
            trend: '',
            desc: 'Weekly Search Retention'
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics Dashboard</h1>
                        <p className="text-slate-500 mt-1">Real-time performance metrics for JurnalGPT</p>
                    </div>
                    <div className="flex items-center gap-3">
                    </div>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between">
                                <div className={`${card.color} p-3 rounded-xl text-white shadow-lg`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <span className={`flex items-center gap-1 text-sm font-bold ${card.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {card.trend}
                                    <TrendingUp className={`w-4 h-4 ${card.trend.startsWith('-') ? 'rotate-180' : ''}`} />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">{card.title}</h3>
                                <div className="text-3xl font-bold text-slate-900 mt-1">{card.value}</div>
                                <p className="text-slate-400 text-xs mt-2">{card.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Charts & Detailed Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Users Trends Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Active User Trends</h3>
                                <p className="text-sm text-slate-500">Breakdown of active users by role</p>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                                    <button
                                        key={view}
                                        onClick={() => setActiveView(view)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${activeView === view
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {view}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={
                                        activeView === 'daily' ? data.charts.dailySearches :
                                            activeView === 'weekly' ? data.charts.weeklyActive :
                                                data.charts.monthlyActive
                                    }
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 12 }}
                                        tickFormatter={(str) => {
                                            const d = new Date(str);
                                            if (activeView === 'daily') return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                            if (activeView === 'weekly') return `W${Math.ceil((d.getDate() + d.getDay()) / 7)} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;
                                            return d.toLocaleDateString('id-ID', { month: 'long', year: '2-digit' });
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#1E293B' }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Line
                                        type="monotone"
                                        dataKey="free"
                                        name="Free"
                                        stroke="#6366F1"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#FFF' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="premium_monthly"
                                        name="Premium Monthly"
                                        stroke="#F59E0B"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFF' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="premium_weekly"
                                        name="Premium Weekly"
                                        stroke="#10B981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFF' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="unknown"
                                        name="Unknown/Guest"
                                        stroke="#94A3B8"
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={{ r: 4, fill: '#94A3B8', strokeWidth: 2, stroke: '#FFF' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* SPAU Trend Chart Section */}
                        <div className="mt-12">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Engagement Efficiency (SPAU)</h3>
                                    <p className="text-sm text-slate-500">Searches per active user over time</p>
                                </div>
                                <div className="bg-indigo-50 px-3 py-1 rounded-lg text-xs font-bold text-indigo-600 uppercase tracking-wider">Trend View</div>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.charts.spauTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            tickFormatter={(str) => {
                                                const d = new Date(str);
                                                return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#1E293B' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="spau"
                                            name="Avg. SPAU"
                                            stroke="#818CF8"
                                            strokeWidth={4}
                                            dot={{ r: 4, fill: '#818CF8', strokeWidth: 2, stroke: '#FFF' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Column */}
                    <div className="space-y-8">




                    </div>
                </div>


            </div>
        </div >
    );
}
