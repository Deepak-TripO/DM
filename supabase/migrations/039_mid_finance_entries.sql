-- 039_mid_finance_entries.sql
-- Create mid_finance_entries table and RLS policies for MID Finance Task entries

CREATE TABLE IF NOT EXISTS public.mid_finance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Software',
    description TEXT,
    person TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    elumugam_amount NUMERIC(12,2),
    deepak_amount NUMERIC(12,2),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for performance and fast lookups
CREATE INDEX IF NOT EXISTS idx_mid_finance_entries_task_id ON public.mid_finance_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_mid_finance_entries_date ON public.mid_finance_entries(date);
CREATE INDEX IF NOT EXISTS idx_mid_finance_entries_is_deleted ON public.mid_finance_entries(is_deleted);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mid_finance_entries ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: All authenticated users can view active MID Finance entries
DROP POLICY IF EXISTS "Authenticated users can view mid finance entries" ON public.mid_finance_entries;
CREATE POLICY "Authenticated users can view mid finance entries"
    ON public.mid_finance_entries FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR public.is_admin(auth.uid()));

-- 2. INSERT Policy: Admin users or unlocked users can insert
DROP POLICY IF EXISTS "Allowed users can insert mid finance entries" ON public.mid_finance_entries;
CREATE POLICY "Allowed users can insert mid finance entries"
    ON public.mid_finance_entries FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid()) OR (
            NOT EXISTS (
                SELECT 1 FROM public.user_permissions
                WHERE user_id = auth.uid() AND finance_entry_access = 'locked'
            )
        )
    );

-- 3. UPDATE Policy: Entry creator or Admin users can update
DROP POLICY IF EXISTS "Allowed users can update mid finance entries" ON public.mid_finance_entries;
CREATE POLICY "Allowed users can update mid finance entries"
    ON public.mid_finance_entries FOR UPDATE
    TO authenticated
    USING (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    )
    WITH CHECK (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    );

-- 4. DELETE Policy: Entry creator or Admin users can delete
DROP POLICY IF EXISTS "Allowed users can delete mid finance entries" ON public.mid_finance_entries;
CREATE POLICY "Allowed users can delete mid finance entries"
    ON public.mid_finance_entries FOR DELETE
    TO authenticated
    USING (
        created_by IS NULL OR created_by = auth.uid() OR public.is_admin(auth.uid())
    );

-- 5. Auto-provision MID Finance folder in public.folders if not present
DO $$
DECLARE
    first_admin_id UUID;
BEGIN
    SELECT user_id INTO first_admin_id FROM public.admin_users LIMIT 1;
    IF first_admin_id IS NULL THEN
        SELECT id INTO first_admin_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.folders
        WHERE LOWER(TRIM(name)) IN ('mid finance', 'midfinance')
        AND parent_id IS NULL
        AND deleted_at IS NULL
    ) THEN
        INSERT INTO public.folders (name, parent_id, owner_id)
        VALUES ('MID Finance', NULL, first_admin_id);
    END IF;
END $$;
