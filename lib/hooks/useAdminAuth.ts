import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        try {
            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/');
                return;
            }

            // Check if user has admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/');
                return;
            }

            setIsAdmin(true);
        } catch (error) {
            console.error('Error checking admin status:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    return { isAdmin, loading };
}
