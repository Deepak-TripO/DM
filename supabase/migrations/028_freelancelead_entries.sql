-- 028_freelancelead_entries.sql
-- Create freelancelead_entries table for Freelance Lead task entries

CREATE TABLE IF NOT EXISTS public.freelancelead_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    hotel_name TEXT NOT NULL,
    district TEXT NOT NULL,
    area TEXT NOT NULL,
    location_link TEXT,
    phone_number TEXT DEFAULT NULL,
    contact_person TEXT DEFAULT NULL,
    status TEXT DEFAULT NULL,
    approach_date DATE DEFAULT NULL,
    short_notes TEXT DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.freelancelead_entries ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT NULL;
ALTER TABLE public.freelancelead_entries ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_freelancelead_entries_task_id ON public.freelancelead_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_freelancelead_entries_deleted_at ON public.freelancelead_entries(deleted_at);

ALTER TABLE public.freelancelead_entries ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy (All authenticated users can view active non-deleted entries)
DROP POLICY IF EXISTS "Authenticated users can select freelancelead entries" ON public.freelancelead_entries;
CREATE POLICY "Authenticated users can select freelancelead entries"
    ON public.freelancelead_entries FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR public.is_admin(auth.uid()));

-- 2. INSERT Policy (Authenticated users can insert entries)
DROP POLICY IF EXISTS "Authenticated users can insert freelancelead entries" ON public.freelancelead_entries;
CREATE POLICY "Authenticated users can insert freelancelead entries"
    ON public.freelancelead_entries FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- 3. UPDATE Policy (Admins ONLY)
DROP POLICY IF EXISTS "Admins can update freelancelead entries" ON public.freelancelead_entries;
CREATE POLICY "Admins can update freelancelead entries"
    ON public.freelancelead_entries FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 4. DELETE Policy (Admins ONLY)
DROP POLICY IF EXISTS "Admins can delete freelancelead entries" ON public.freelancelead_entries;
CREATE POLICY "Admins can delete freelancelead entries"
    ON public.freelancelead_entries FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));
