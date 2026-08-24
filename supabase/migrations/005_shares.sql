-- 005_shares.sql
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

CREATE POLICY "Owners can manage shares."
    ON public.shares FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Public can read active shares by token."
    ON public.shares FOR SELECT
    USING (
        revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Policy on files allowing shared file access (added after shares table exists)
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

CREATE TABLE IF NOT EXISTS public.share_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.share_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert access log."
    ON public.share_access_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Share owner can view access logs."
    ON public.share_access_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shares s
            WHERE s.id = share_access_logs.share_id
              AND s.owner_id = auth.uid()
        )
    );
