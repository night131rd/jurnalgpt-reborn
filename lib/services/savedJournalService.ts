import { supabase } from '@/lib/supabase';
import type { Journal } from '@/lib/types/journal';

export interface SavedJournal extends Journal {
    id: string;
    saved_at: string;
}

/**
 * Save a journal to user's collection
 */
export async function saveJournal(journal: Journal): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
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
        // Check for duplicate error (unique constraint violation)
        if (error.code === '23505') {
            return { success: false, error: 'Journal already saved' };
        }
        console.error('Failed to save journal:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Get all saved journals for current user
 */
export async function getSavedJournals(): Promise<SavedJournal[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('saved_journals')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

    if (error) {
        console.error('Failed to get saved journals:', error);
        return [];
    }

    // Map database columns to Journal interface
    return (data || []).map(row => ({
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
}

/**
 * Remove a saved journal
 */
export async function removeSavedJournal(journalId: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
        .from('saved_journals')
        .delete()
        .eq('id', journalId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Failed to remove saved journal:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Check if a journal is already saved (by title since DOI can be null)
 */
export async function isJournalSaved(title: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data, error } = await supabase
        .from('saved_journals')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', title)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Failed to check saved journal:', error);
        return false;
    }

    return !!data;
}

/**
 * Toggle saved status for a journal
 */
export async function toggleSaveJournal(journal: Journal): Promise<{ saved: boolean; error?: string }> {
    const isSaved = await isJournalSaved(journal.title);

    if (isSaved) {
        // Find and remove
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { saved: false, error: 'User not authenticated' };

        const { data } = await supabase
            .from('saved_journals')
            .select('id')
            .eq('user_id', user.id)
            .eq('title', journal.title)
            .single();

        if (data) {
            const result = await removeSavedJournal(data.id);
            if (result.error) return { saved: true, error: result.error };
        }
        return { saved: false };
    } else {
        const result = await saveJournal(journal);
        if (result.error) return { saved: false, error: result.error };
        return { saved: true };
    }
}
