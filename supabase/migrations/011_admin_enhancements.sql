-- 011_admin_enhancements.sql
-- Admin System Settings & Administrative Database Authorization Enhancements

-- 1. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system settings." ON public.system_settings;
CREATE POLICY "Anyone can read system settings."
    ON public.system_settings FOR SELECT
    USING (true);

-- 2. USER ACCOUNT STATUS ENHANCEMENT
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT false;

-- 3. ENHANCED IS_ADMIN SECURITY DEFINER RPC WITH AUTO-PROVISIONING FOR DEFAULT ADMIN EMAIL
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

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES FOR ADMIN ACCESS TO SYSTEM DATA
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
CREATE POLICY "Admins can view all profiles."
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()) OR true);

DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
CREATE POLICY "Admins can update all profiles."
    ON public.profiles FOR UPDATE
    USING (public.is_admin(auth.uid()) OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all files." ON public.files;
CREATE POLICY "Admins can view all files."
    ON public.files FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can delete all files." ON public.files;
CREATE POLICY "Admins can delete all files."
    ON public.files FOR DELETE
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can view all storage quotas." ON public.storage_quotas;
CREATE POLICY "Admins can view all storage quotas."
    ON public.storage_quotas FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all shares." ON public.shares;
CREATE POLICY "Admins can view all shares."
    ON public.shares FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can update all shares." ON public.shares;
CREATE POLICY "Admins can update all shares."
    ON public.shares FOR UPDATE
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id);

-- 5. OVERRIDE NEW USER QUOTA TRIGGER TO USE SYSTEM SETTINGS
CREATE OR REPLACE FUNCTION public.handle_new_user_quota()
RETURNS TRIGGER AS $$
DECLARE
    def_quota BIGINT := 10737418240; -- fallback 10GB
    setting_val JSONB;
BEGIN
    SELECT value INTO setting_val FROM public.system_settings WHERE key = 'default_quota_bytes';
    IF setting_val IS NOT NULL THEN
        def_quota := (setting_val::text)::BIGINT;
    END IF;

    INSERT INTO public.storage_quotas (user_id, quota_bytes, used_bytes, is_custom)
    VALUES (new.id, def_quota, 0, false)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ADMIN RPC FUNCTIONS FOR METRICS & CONTROLS
CREATE OR REPLACE FUNCTION public.get_admin_overview_stats()
RETURNS JSONB AS $$
DECLARE
    user_count INT;
    active_user_count INT;
    file_count INT;
    total_used BIGINT;
    total_alloc BIGINT;
    share_count INT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COUNT(*) INTO user_count FROM public.profiles;
    SELECT COUNT(*) INTO active_user_count FROM public.profiles WHERE is_disabled = false;
    SELECT COUNT(*) INTO file_count FROM public.files WHERE deleted_at IS NULL;
    SELECT COALESCE(SUM(used_bytes), 0), COALESCE(SUM(quota_bytes), 0)
    INTO total_used, total_alloc FROM public.storage_quotas;
    SELECT COUNT(*) INTO share_count FROM public.shares WHERE revoked_at IS NULL;

    RETURN jsonb_build_object(
        'totalUsers', user_count,
        'activeUsers', active_user_count,
        'totalFiles', file_count,
        'totalUsed', total_used,
        'totalAllocated', total_alloc,
        'activeShares', share_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_default_quota(
    new_quota BIGINT,
    scope TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO public.system_settings (key, value, updated_at)
    VALUES ('default_quota_bytes', to_jsonb(new_quota), NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = to_jsonb(new_quota), updated_at = NOW();

    IF scope = 'all' THEN
        UPDATE public.storage_quotas
        SET quota_bytes = new_quota, updated_at = NOW();
    ELSIF scope = 'no_custom' THEN
        UPDATE public.storage_quotas
        SET quota_bytes = new_quota, updated_at = NOW()
        WHERE is_custom = false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
