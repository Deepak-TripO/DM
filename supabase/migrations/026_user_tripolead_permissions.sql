-- 026_user_tripolead_permissions.sql
-- Per-user TripO Lead Entry Access Control (Lock/Unlock) and RLS Policies

-- 1. Ensure user_permissions table exists and add tripolead_entry_access column
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    finance_entry_access TEXT NOT NULL DEFAULT 'unlocked',
    tripolead_entry_access TEXT NOT NULL DEFAULT 'unlocked',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS tripolead_entry_access TEXT NOT NULL DEFAULT 'unlocked';

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 2. RLS for user_permissions table
DROP POLICY IF EXISTS "Authenticated users can view user_permissions." ON public.user_permissions;
CREATE POLICY "Authenticated users can view user_permissions."
    ON public.user_permissions FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can manage user_permissions." ON public.user_permissions;
CREATE POLICY "Admins can manage user_permissions."
    ON public.user_permissions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 3. RLS Policy for tripolead_entries INSERT enforcement
ALTER TABLE IF EXISTS public.tripolead_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allowed users can insert tripolead entries" ON public.tripolead_entries;
CREATE POLICY "Allowed users can insert tripolead entries"
    ON public.tripolead_entries FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid()) OR (
            NOT EXISTS (
                SELECT 1 FROM public.user_permissions
                WHERE user_id = auth.uid() AND tripolead_entry_access = 'locked'
            )
        )
    );
