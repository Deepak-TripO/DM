-- 024_fix_finance_entries_schema.sql
-- Fix schema & constraints on public.finance_entries table to resolve Supabase 400 Bad Request errors

-- 1. Ensure finance_entries table exists
CREATE TABLE IF NOT EXISTS public.finance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Software',
    description TEXT,
    person TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Make task_id nullable if it was created with NOT NULL constraint
ALTER TABLE public.finance_entries ALTER COLUMN task_id DROP NOT NULL;

-- 3. Add person split amount columns
ALTER TABLE public.finance_entries
ADD COLUMN IF NOT EXISTS elumugam_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS deepak_amount NUMERIC(12,2);

-- 4. Add soft-delete columns
ALTER TABLE public.finance_entries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

-- 6. Re-create RLS Policies
DROP POLICY IF EXISTS "Authenticated users can select finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can manage finance entries." ON public.finance_entries;
DROP POLICY IF EXISTS "Admins can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can insert finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Authenticated users can view finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can update finance entries" ON public.finance_entries;
DROP POLICY IF EXISTS "Allowed users can delete finance entries" ON public.finance_entries;

CREATE POLICY "Authenticated users can view finance entries"
    ON public.finance_entries FOR SELECT
    TO authenticated
    USING (true);

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

CREATE POLICY "Allowed users can update finance entries"
    ON public.finance_entries FOR UPDATE
    TO authenticated
    USING (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    );

CREATE POLICY "Allowed users can delete finance entries"
    ON public.finance_entries FOR DELETE
    TO authenticated
    USING (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    );
