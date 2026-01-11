import { supabase } from '@/lib/supabase';

export interface SearchHistoryEntry {
    id: string;
    query: string;
    filters: {
        minYear: string;
        maxYear: string;
        scope: 'all' | 'national' | 'international';
    };
    created_at: string;
}

/**
 * Save a search query to history
 */
export async function saveSearchHistory(
    query: string,
    payload: any[]
): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
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
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Get search history for current user
 */
export async function getSearchHistory(limit: number = 100): Promise<SearchHistoryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to get search history:', error);
        return [];
    }

    return data || [];
}

/**
 * Delete a specific history entry
 */
export async function deleteSearchHistory(historyId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', historyId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Failed to delete search history:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Clear all search history for current user
 */
export async function clearSearchHistory(): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Failed to clear search history:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
