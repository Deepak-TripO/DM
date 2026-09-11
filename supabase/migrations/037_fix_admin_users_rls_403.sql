-- 037_fix_admin_users_rls_403.sql
-- Fix 403 Forbidden RLS policy errors on admin_users table for authenticated users

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select admin_users rows (for self or via is_admin)
DROP POLICY IF EXISTS "Admins can view admin_users table." ON public.admin_users;
CREATE POLICY "Admins can view admin_users table."
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Allow authenticated users to manage admin_users table (for self or via is_admin)
DROP POLICY IF EXISTS "Admins can manage admin_users table." ON public.admin_users;
CREATE POLICY "Admins can manage admin_users table."
    ON public.admin_users FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
