-- Run this in Supabase SQL Editor to fix 403 / 500 RLS errors on admin_users:

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users table." ON public.admin_users;
CREATE POLICY "Admins can view admin_users table."
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage admin_users table." ON public.admin_users;
CREATE POLICY "Admins can manage admin_users table."
    ON public.admin_users FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
