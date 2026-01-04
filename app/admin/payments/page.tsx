"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface PendingPayment {
    id: string;
    user_id: string;
    plan_type: string;
    status: string;
    created_at: string;
    profiles: {
        email: string;
    };
    payment_proofs: {
        image_url: string;
        paid_amount: number;
    }[];
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<PendingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/';
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            window.location.href = '/';
            return;
        }

        setIsAdmin(true);
        fetchPayments();
    };

    const fetchPayments = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/pending-payments', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setPayments(data);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAdmin();
    }, []);

    const handleApprove = async (intentId: string, userId: string) => {
        if (!confirm('Approve this payment and upgrade user to Premium?')) return;

        setApprovingId(intentId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/approve-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ intentId, userId })
            });
            const result = await res.json();
            if (result.success) {
                alert('Payment approved successfully!');
                fetchPayments(); // Refresh list
            } else {
                alert('Failed to approve: ' + result.error);
            }
        } catch (error) {
            console.error('Approve error:', error);
            alert('An error occurred.');
        } finally {
            setApprovingId(null);
        }
    };

    if (loading && !isAdmin) {
        return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Checking permissions...</div>;
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-zinc-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-zinc-900 mb-8">Admin: Payment Verification</h1>

                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading pending payments...</div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200 text-zinc-500">
                        No pending payments found.
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">User Information</th>
                                    <th className="px-6 py-4 font-semibold">Plan</th>
                                    <th className="px-6 py-4 font-semibold">Payment Proof</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-zinc-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-zinc-900">{payment.profiles?.email || 'No email'}</div>
                                            <div className="text-xs text-zinc-500 font-mono mt-1">{payment.user_id}</div>
                                            <div className="text-[10px] text-zinc-400 mt-1">ID: {payment.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.plan_type === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                {payment.plan_type}
                                            </span>
                                            <div className="text-xs text-zinc-500 mt-1">Rp {payment.payment_proofs[0]?.paid_amount?.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.payment_proofs[0]?.image_url ? (
                                                <div className="relative group cursor-pointer" onClick={() => window.open(payment.payment_proofs[0].image_url, '_blank')}>
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 relative bg-zinc-100">
                                                        <Image
                                                            src={payment.payment_proofs[0].image_url}
                                                            alt="Proof"
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition duration-300"
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400 italic">No proof image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                Verification Required
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleApprove(payment.id, payment.user_id)}
                                                disabled={approvingId === payment.id}
                                                className="bg-zinc-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-800 transition active:scale-95 disabled:opacity-50"
                                            >
                                                {approvingId === payment.id ? 'Approving...' : 'Approve'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
