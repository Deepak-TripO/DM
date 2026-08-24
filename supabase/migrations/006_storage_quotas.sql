-- 006_storage_quotas.sql
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.storage_quotas (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10 GB default
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

-- Auto create quota for new profile
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
