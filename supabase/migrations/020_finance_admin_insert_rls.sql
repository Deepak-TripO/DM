-- 020_finance_admin_insert_rls.sql
-- Restrict INSERT on finance_entries table to Admin users only

ALTER TABLE IF EXISTS public.finance_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policies on finance_entries
DROP POLICY IF EXISTS "Authenticated users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can manage finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Admins can insert finance entries" ON public.finance_entries;

-- 1. Create INSERT policy restricted to Admin users only
CREATE POLICY "Admins can insert finance entries"
    ON public.finance_entries FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));
