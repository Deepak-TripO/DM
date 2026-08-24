-- Run this in Supabase SQL Editor to fix the 500 Internal Server Error on admin_users:

DROP POLICY IF EXISTS "Admins can view admin_users table." ON public.admin_users;

CREATE POLICY "Admins can view admin_users table."
    ON public.admin_users FOR SELECT
    USING (auth.uid() = user_id);
