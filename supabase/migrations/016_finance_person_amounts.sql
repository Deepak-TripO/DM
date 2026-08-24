-- 016_finance_person_amounts.sql
-- Add elumugam_amount and deepak_amount columns to public.finance_entries

ALTER TABLE public.finance_entries
ADD COLUMN IF NOT EXISTS elumugam_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS deepak_amount NUMERIC(12,2);
