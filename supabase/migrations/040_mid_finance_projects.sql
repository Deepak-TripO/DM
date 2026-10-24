-- 040_mid_finance_projects.sql
-- Create database schema and RLS policies for MID Finance Project section

-- 1. Project Folders Table
CREATE TABLE IF NOT EXISTS public.mid_finance_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    company_logo TEXT,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mid_finance_projects_task_id ON public.mid_finance_projects(task_id);
CREATE INDEX IF NOT EXISTS idx_mid_finance_projects_created_at ON public.mid_finance_projects(created_at);

-- 2. Payment Schedules Table
CREATE TABLE IF NOT EXISTS public.mid_finance_payment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.mid_finance_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mid_finance_payments_project_id ON public.mid_finance_payment_schedules(project_id);

-- 3. Project Documents Table
CREATE TABLE IF NOT EXISTS public.mid_finance_project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.mid_finance_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    storage_path TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mid_finance_docs_project_id ON public.mid_finance_project_documents(project_id);

-- 4. Project Invoices Table
CREATE TABLE IF NOT EXISTS public.mid_finance_project_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.mid_finance_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    invoice_number TEXT,
    invoice_date DATE,
    amount NUMERIC(12,2) DEFAULT 0.00,
    file_type TEXT,
    file_size BIGINT,
    storage_path TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mid_finance_invoices_project_id ON public.mid_finance_project_invoices(project_id);

-- 5. Project Expense Breakdown Table
CREATE TABLE IF NOT EXISTS public.mid_finance_project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.mid_finance_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    receipt_name TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mid_finance_expenses_project_id ON public.mid_finance_project_expenses(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mid_finance_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_finance_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_finance_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_finance_project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mid_finance_project_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mid_finance_projects
DROP POLICY IF EXISTS "Authenticated users can view mid_finance_projects" ON public.mid_finance_projects;
CREATE POLICY "Authenticated users can view mid_finance_projects"
    ON public.mid_finance_projects FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert mid_finance_projects" ON public.mid_finance_projects;
CREATE POLICY "Authenticated users can insert mid_finance_projects"
    ON public.mid_finance_projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update mid_finance_projects" ON public.mid_finance_projects;
CREATE POLICY "Authenticated users can update mid_finance_projects"
    ON public.mid_finance_projects FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()) OR created_by = auth.uid() OR created_by IS NULL)
    WITH CHECK (public.is_admin(auth.uid()) OR created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "Authenticated users can delete mid_finance_projects" ON public.mid_finance_projects;
CREATE POLICY "Authenticated users can delete mid_finance_projects"
    ON public.mid_finance_projects FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()) OR created_by = auth.uid() OR created_by IS NULL);

-- RLS Policies for child tables
DROP POLICY IF EXISTS "Authenticated users can manage mid_finance_payments" ON public.mid_finance_payment_schedules;
CREATE POLICY "Authenticated users can manage mid_finance_payments"
    ON public.mid_finance_payment_schedules FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage mid_finance_documents" ON public.mid_finance_project_documents;
CREATE POLICY "Authenticated users can manage mid_finance_documents"
    ON public.mid_finance_project_documents FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage mid_finance_invoices" ON public.mid_finance_project_invoices;
CREATE POLICY "Authenticated users can manage mid_finance_invoices"
    ON public.mid_finance_project_invoices FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage mid_finance_expenses" ON public.mid_finance_project_expenses;
CREATE POLICY "Authenticated users can manage mid_finance_expenses"
    ON public.mid_finance_project_expenses FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);
