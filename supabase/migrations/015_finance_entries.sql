-- 015_finance_entries.sql
-- Create finance_entries table and RLS policies for Finance Task entries

CREATE TABLE IF NOT EXISTS public.finance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    description TEXT,
    person TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_entries_task_id ON public.finance_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_date ON public.finance_entries(date);

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select finance entries." ON public.finance_entries;
CREATE POLICY "Authenticated users can select finance entries."
    ON public.finance_entries FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage finance entries." ON public.finance_entries;
CREATE POLICY "Authenticated users can manage finance entries."
    ON public.finance_entries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
