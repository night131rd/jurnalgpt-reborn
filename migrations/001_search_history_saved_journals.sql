-- ============================================
-- SEARCH HISTORY & SAVED JOURNALS MIGRATION
-- Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================

-- Table: search_history
CREATE TABLE IF NOT EXISTS public.search_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query text NOT NULL,
    payload jsonb, -- Array JSON berisi riwayat percakapan: [ {role: user, content, filters}, {role: assistant, content, journals} ]
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- Function to limit history to 100 entries per user
CREATE OR REPLACE FUNCTION limit_search_history() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.search_history
    WHERE id IN (
        SELECT id FROM public.search_history
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        OFFSET 100
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-delete old history
DROP TRIGGER IF EXISTS trigger_limit_search_history ON public.search_history;
CREATE TRIGGER trigger_limit_search_history
AFTER INSERT ON public.search_history
FOR EACH ROW EXECUTE FUNCTION limit_search_history();

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Policies for search_history
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history"
    ON public.search_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own search history" ON public.search_history;
CREATE POLICY "Users can create own search history"
    ON public.search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;
CREATE POLICY "Users can delete own search history"
    ON public.search_history FOR DELETE
    USING (auth.uid() = user_id);

-- Table: saved_journals
CREATE TABLE IF NOT EXISTS public.saved_journals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    year integer,
    publisher text,
    journal_link text,
    abstract text,
    doi text,
    authors text[],
    citation_count integer,
    source text,
    saved_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, title)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_journals_user_id ON public.saved_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_journals_saved_at ON public.saved_journals(saved_at DESC);

-- Enable RLS
ALTER TABLE public.saved_journals ENABLE ROW LEVEL SECURITY;

-- Policies for saved_journals
DROP POLICY IF EXISTS "Users can view own saved journals" ON public.saved_journals;
CREATE POLICY "Users can view own saved journals"
    ON public.saved_journals FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save journals" ON public.saved_journals;
CREATE POLICY "Users can save journals"
    ON public.saved_journals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete saved journals" ON public.saved_journals;
CREATE POLICY "Users can delete saved journals"
    ON public.saved_journals FOR DELETE
    USING (auth.uid() = user_id);

-- Success message
SELECT 'Migration completed successfully! Tables created: search_history, saved_journals' as message;
