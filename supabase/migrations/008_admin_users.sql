-- 008_admin_users.sql
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users table." ON public.admin_users;
CREATE POLICY "Admins can view admin_users table."
    ON public.admin_users FOR SELECT
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
