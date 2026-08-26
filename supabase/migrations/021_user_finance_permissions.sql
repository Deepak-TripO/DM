-- 021_user_finance_permissions.sql
-- Per-user Finance Entry Access Control (Lock/Unlock) and RLS Policies

CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    finance_entry_access TEXT NOT NULL DEFAULT 'unlocked',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 1. All authenticated users can view user permissions
DROP POLICY IF EXISTS "Authenticated users can view user_permissions." ON public.user_permissions;
CREATE POLICY "Authenticated users can view user_permissions."
    ON public.user_permissions FOR SELECT
    TO authenticated
    USING (true);

-- 2. Admins can insert, update, or delete user permissions
DROP POLICY IF EXISTS "Admins can manage user_permissions." ON public.user_permissions;
CREATE POLICY "Admins can manage user_permissions."
    ON public.user_permissions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 3. Update INSERT policy on finance_entries table to enforce user-level finance entry lock
ALTER TABLE IF EXISTS public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can insert finance entries" ON public.finance_entries;

CREATE POLICY "Allowed users can insert finance entries"
    ON public.finance_entries FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid()) OR (
            NOT EXISTS (
                SELECT 1 FROM public.user_permissions
                WHERE user_id = auth.uid() AND finance_entry_access = 'locked'
            )
        )
    );
