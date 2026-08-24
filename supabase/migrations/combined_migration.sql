-- ===================================================
-- DM PLATFORM — MASTER COMBINED DATABASE MIGRATION
-- Run this entire script in Supabase SQL Editor
-- ===================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings." ON public.user_settings;
CREATE POLICY "Users can view own settings."
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings." ON public.user_settings;
CREATE POLICY "Users can update own settings."
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings." ON public.user_settings;
CREATE POLICY "Users can insert own settings."
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. FOLDERS
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON public.folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON public.folders(deleted_at);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own folders." ON public.folders;
CREATE POLICY "Users can manage own folders."
    ON public.folders FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 4. FILES
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    extension TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_files_owner_id ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON public.files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_extension ON public.files(extension);
CREATE INDEX IF NOT EXISTS idx_files_starred ON public.files(is_starred);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own files." ON public.files;
CREATE POLICY "Users can manage own files."
    ON public.files FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 5. SHARES
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    password_enabled BOOLEAN NOT NULL DEFAULT false,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_token ON public.shares(token);
CREATE INDEX IF NOT EXISTS idx_shares_owner ON public.shares(owner_id);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage shares." ON public.shares;
CREATE POLICY "Owners can manage shares."
    ON public.shares FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public can read active shares by token." ON public.shares;
CREATE POLICY "Public can read active shares by token."
    ON public.shares FOR SELECT
    USING (
        revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Now add policy to files referencing shares
DROP POLICY IF EXISTS "Shared files are viewable by everyone via share token." ON public.files;
CREATE POLICY "Shared files are viewable by everyone via share token."
    ON public.files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shares s
            WHERE s.file_id = public.files.id
              AND s.revoked_at IS NULL
              AND (s.expires_at IS NULL OR s.expires_at > NOW())
        )
    );

-- 6. SHARE ACCESS LOGS
CREATE TABLE IF NOT EXISTS public.share_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.share_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert access log." ON public.share_access_logs;
CREATE POLICY "Anyone can insert access log."
    ON public.share_access_logs FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Share owner can view access logs." ON public.share_access_logs;
CREATE POLICY "Share owner can view access logs."
    ON public.share_access_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shares s
            WHERE s.id = share_access_logs.share_id
              AND s.owner_id = auth.uid()
        )
    );

-- 7. ADMIN USERS
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

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. STORAGE QUOTAS
CREATE TABLE IF NOT EXISTS public.storage_quotas (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10 GB
    used_bytes BIGINT NOT NULL DEFAULT 0,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quota." ON public.storage_quotas;
CREATE POLICY "Users can view own quota."
    ON public.storage_quotas FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quota." ON public.storage_quotas;
CREATE POLICY "Users can insert own quota."
    ON public.storage_quotas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all quotas." ON public.storage_quotas;
CREATE POLICY "Admins can update all quotas."
    ON public.storage_quotas FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users a
            WHERE a.user_id = auth.uid()
        )
        OR auth.uid() = user_id
    );

CREATE OR REPLACE FUNCTION public.handle_new_user_quota()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.storage_quotas (user_id, quota_bytes, used_bytes)
    VALUES (new.id, 10737418240, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_quota
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_quota();

-- 9. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity logs." ON public.activity_logs;
CREATE POLICY "Users can view own activity logs."
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity logs." ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs."
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activity logs." ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs."
    ON public.activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users a
            WHERE a.user_id = auth.uid()
        )
    );

-- 10. STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('files', 'files', false, 5368709120, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- 11. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_storage_used(
    target_user_id UUID,
    delta BIGINT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.storage_quotas
    SET used_bytes = GREATEST(0, used_bytes + delta),
        updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.verify_share_password(
    share_token TEXT,
    password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password_hash INTO stored_hash
    FROM public.shares
    WHERE token = share_token
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW());

    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    IF stored_hash = password THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    user_count INT;
    file_count INT;
    total_used BIGINT;
    total_alloc BIGINT;
    share_count INT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT COUNT(*) INTO user_count FROM public.profiles;
    SELECT COUNT(*) INTO file_count FROM public.files WHERE deleted_at IS NULL;
    SELECT COALESCE(SUM(used_bytes), 0), COALESCE(SUM(quota_bytes), 0)
    INTO total_used, total_alloc FROM public.storage_quotas;
    SELECT COUNT(*) INTO share_count FROM public.shares WHERE revoked_at IS NULL;

    RETURN jsonb_build_object(
        'totalUsers', user_count,
        'totalFiles', file_count,
        'totalUsed', total_used,
        'totalAllocated', total_alloc,
        'activeShares', share_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
