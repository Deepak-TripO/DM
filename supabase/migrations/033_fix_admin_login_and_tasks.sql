-- 033_fix_admin_login_and_tasks.sql

-- 1. Ensure required columns exist on public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';

-- 2. Ensure public.admin_users table exists
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Enhanced public.is_admin RPC function (SECURITY DEFINER)
-- Checks admin_users table, auth.users email ('admin@dm.com'), and profiles role ('admin').
-- Auto-provisions admin_users table if user matches admin criteria.
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    u_email TEXT;
BEGIN
    IF uid IS NULL THEN
        uid := auth.uid();
    END IF;

    IF uid IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if user_id exists in admin_users table
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = uid) THEN
        RETURN TRUE;
    END IF;

    -- Check auth.users table for admin@dm.com email
    SELECT email INTO u_email FROM auth.users WHERE id = uid;
    IF u_email IS NOT NULL AND LOWER(u_email) = 'admin@dm.com' THEN
        INSERT INTO public.admin_users (user_id, role)
        VALUES (uid, 'admin')
        ON CONFLICT (user_id) DO NOTHING;
        RETURN TRUE;
    END IF;

    -- Check profiles table for role = 'admin' or username = 'admin'
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = uid 
        AND (
            LOWER(COALESCE(role, '')) = 'admin' 
            OR LOWER(COALESCE(username, '')) = 'admin'
        )
    ) THEN
        INSERT INTO public.admin_users (user_id, role)
        VALUES (uid, 'admin')
        ON CONFLICT (user_id) DO NOTHING;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure RLS on admin_users allows read/write for Admins and users checking their own state
DROP POLICY IF EXISTS "Admins can view admin_users table." ON public.admin_users;
CREATE POLICY "Admins can view admin_users table."
    ON public.admin_users FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage admin_users table." ON public.admin_users;
CREATE POLICY "Admins can manage admin_users table."
    ON public.admin_users FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 5. Ensure RLS on folders table allows Admins to view all root folders (tasks)
DROP POLICY IF EXISTS "Enable read access for all authenticated users." ON public.folders;
DROP POLICY IF EXISTS "Users can view assigned folders or admin view all" ON public.folders;
CREATE POLICY "Users can view assigned folders or admin view all"
    ON public.folders FOR SELECT
    USING (
        public.is_admin(auth.uid()) 
        OR auth.uid() = owner_id 
        OR EXISTS (SELECT 1 FROM public.task_access ta WHERE ta.task_id = id AND ta.user_id = auth.uid())
    );

-- 6. Auto-provision existing admin@dm.com user from auth.users into admin_users and profiles if present
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    SELECT id INTO admin_uid FROM auth.users WHERE LOWER(email) = 'admin@dm.com' LIMIT 1;
    IF admin_uid IS NOT NULL THEN
        INSERT INTO public.admin_users (user_id, role)
        VALUES (admin_uid, 'admin')
        ON CONFLICT (user_id) DO NOTHING;

        UPDATE public.profiles
        SET approval_status = 'approved', is_disabled = false, role = 'admin'
        WHERE id = admin_uid;
    END IF;
END $$;
