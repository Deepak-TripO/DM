-- 022_fix_finance_entries_rls.sql
-- Fix complete Row Level Security (RLS) policies for finance_entries table (SELECT, INSERT, UPDATE, DELETE)

ALTER TABLE IF EXISTS public.finance_entries ENABLE ROW LEVEL SECURITY;

-- 1. Drop old conflicting policies
DROP POLICY IF EXISTS "Authenticated users can select finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can manage finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Admins can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can view finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can update finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can delete finance entries" ON public.finance_entries;

-- 2. SELECT Policy: All authenticated users can view active finance entries
CREATE POLICY "Authenticated users can view finance entries"
    ON public.finance_entries FOR SELECT
    TO authenticated
    USING (true);

-- 3. INSERT Policy: Admin users or unlocked normal users can insert
CREATE POLICY "Allowed users can insert finance entries"
    ON public.finance_entries FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid()) OR (
            NOT EXISTS (
                SELECT 1 FROM public.user_permissions
                WHERE user_id = auth.uid() AND finance_entry_access = 'locked'
            )
        )
    );

-- 4. UPDATE Policy: Entry creator or Admin users can update
CREATE POLICY "Allowed users can update finance entries"
    ON public.finance_entries FOR UPDATE
    TO authenticated
    USING (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    );

-- 5. DELETE Policy: Entry creator or Admin users can delete
CREATE POLICY "Allowed users can delete finance entries"
    ON public.finance_entries FOR DELETE
    TO authenticated
    USING (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    );
