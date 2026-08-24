-- 007_activity_logs.sql
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

CREATE POLICY "Users can view own activity logs."
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs."
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs."
    ON public.activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users a
            WHERE a.user_id = auth.uid()
        )
    );
