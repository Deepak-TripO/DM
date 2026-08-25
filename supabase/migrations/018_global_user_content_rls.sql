-- 018_global_user_content_rls.sql

-- 1. Ensure files table exists and RLS enabled
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on files table to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own files." ON public.files;
DROP POLICY IF EXISTS "Authenticated users can view files" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can insert files" ON public.files;
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;

-- RLS Policies for files
CREATE POLICY "Authenticated users can view files"
    ON public.files FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can insert files"
    ON public.files FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own files"
    ON public.files FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = owner_id OR public.is_admin(auth.uid())
    );

CREATE POLICY "Users can delete own files"
    ON public.files FOR DELETE
    TO authenticated
    USING (
        auth.uid() = owner_id OR public.is_admin(auth.uid())
    );

-- 2. Ensure finance_entries table exists
CREATE TABLE IF NOT EXISTS public.finance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    description TEXT,
    person TEXT NOT NULL DEFAULT 'Deepak',
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    elumugam_amount NUMERIC(12,2),
    deepak_amount NUMERIC(12,2),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist in case finance_entries was created with an older schema
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS elumugam_amount NUMERIC(12,2);
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS deepak_amount NUMERIC(12,2);
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.finance_entries ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_finance_entries_date ON public.finance_entries(date);
CREATE INDEX IF NOT EXISTS idx_finance_entries_is_deleted ON public.finance_entries(is_deleted);

-- Enable RLS on finance_entries
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can manage finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can view finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Users can update own finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Users can delete own finance entries" ON public.finance_entries;

-- 1. All authenticated users can READ all non-deleted finance entries
CREATE POLICY "Authenticated users can view finance entries"
    ON public.finance_entries FOR SELECT
    TO authenticated
    USING (is_deleted = false OR created_by = auth.uid()::text);

-- 2. Authenticated users can INSERT finance entries
CREATE POLICY "Authenticated users can insert finance entries"
    ON public.finance_entries FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Only creator (or admin) can UPDATE finance entries
CREATE POLICY "Users can update own finance entries"
    ON public.finance_entries FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()::text OR public.is_admin(auth.uid())
    );

-- 4. Only creator (or admin) can DELETE finance entries
CREATE POLICY "Users can delete own finance entries"
    ON public.finance_entries FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()::text OR public.is_admin(auth.uid())
    );
