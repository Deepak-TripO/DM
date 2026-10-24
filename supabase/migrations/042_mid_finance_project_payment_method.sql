-- 042_mid_finance_project_payment_method.sql
-- Update mid_finance_payment_schedules to support Payment Method and custom descriptions
-- Make category optional in mid_finance_project_expenses and invoice_number optional in mid_finance_project_invoices

-- 1. Add payment_method and payment_method_custom columns to mid_finance_payment_schedules
ALTER TABLE public.mid_finance_payment_schedules 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.mid_finance_payment_schedules 
ADD COLUMN IF NOT EXISTS payment_method_custom TEXT;

CREATE INDEX IF NOT EXISTS idx_mid_finance_payments_method 
ON public.mid_finance_payment_schedules(payment_method);

-- 2. Make category nullable with 'General' default in mid_finance_project_expenses
ALTER TABLE public.mid_finance_project_expenses 
ALTER COLUMN category DROP NOT NULL;

ALTER TABLE public.mid_finance_project_expenses 
ALTER COLUMN category SET DEFAULT 'General';

-- 3. Ensure invoice_number in mid_finance_project_invoices is nullable
ALTER TABLE public.mid_finance_project_invoices 
ALTER COLUMN invoice_number DROP NOT NULL;
