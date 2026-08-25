-- 018_global_user_content_rls.sql

-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on files table to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own files." ON public.files;
DROP POLICY IF EXISTS "Authenticated users can view files" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can insert files" ON public.files;
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;

-- 1. All authenticated users can READ all non-deleted files created by any user
CREATE POLICY "Authenticated users can view files"
    ON public.files FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR auth.uid() = owner_id);

-- 2. Authenticated users can INSERT their own files
CREATE POLICY "Authenticated users can insert files"
    ON public.files FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- 3. Only owner (or admin) can UPDATE files
CREATE POLICY "Users can update own files"
    ON public.files FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = owner_id OR public.is_admin(auth.uid())
    );

-- 4. Only owner (or admin) can DELETE files
CREATE POLICY "Users can delete own files"
    ON public.files FOR DELETE
    TO authenticated
    USING (
        auth.uid() = owner_id OR public.is_admin(auth.uid())
    );

-- Enable RLS on finance_entries table
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

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
