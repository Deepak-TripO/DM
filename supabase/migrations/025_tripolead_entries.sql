-- 025_tripolead_entries.sql
-- Create tripolead_entries table for TripO Lead task entries

CREATE TABLE IF NOT EXISTS public.tripolead_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    hotel_name TEXT NOT NULL,
    district TEXT NOT NULL,
    area TEXT NOT NULL,
    location_link TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tripolead_entries_task_id ON public.tripolead_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_tripolead_entries_deleted_at ON public.tripolead_entries(deleted_at);

ALTER TABLE public.tripolead_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select tripolead entries." ON public.tripolead_entries;
CREATE POLICY "Authenticated users can select tripolead entries."
    ON public.tripolead_entries FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage tripolead entries." ON public.tripolead_entries;
CREATE POLICY "Authenticated users can manage tripolead entries."
    ON public.tripolead_entries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
