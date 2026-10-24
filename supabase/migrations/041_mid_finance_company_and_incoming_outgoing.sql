-- 041_mid_finance_company_and_incoming_outgoing.sql
-- Update mid_finance_entries to support Company Name and Incoming/Outgoing classifications

-- 1. Add company_name column if it does not exist
ALTER TABLE public.mid_finance_entries ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Make item and category nullable with sensible defaults to avoid constraint failures
ALTER TABLE public.mid_finance_entries ALTER COLUMN item DROP NOT NULL;
ALTER TABLE public.mid_finance_entries ALTER COLUMN item SET DEFAULT '';

ALTER TABLE public.mid_finance_entries ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.mid_finance_entries ALTER COLUMN category SET DEFAULT 'General';

-- 3. Add index on company_name for fast searches
CREATE INDEX IF NOT EXISTS idx_mid_finance_entries_company_name ON public.mid_finance_entries(company_name);

-- 4. Safe data migration: Populate company_name for existing entries where missing
UPDATE public.mid_finance_entries 
SET company_name = item 
WHERE (company_name IS NULL OR company_name = '') AND item IS NOT NULL AND item <> '';

-- 5. Map existing legacy person classifications safely
UPDATE public.mid_finance_entries
SET person = 'Incoming'
WHERE person = 'Deepak';

UPDATE public.mid_finance_entries
SET person = 'Outgoing'
WHERE person = 'Elumugam';

UPDATE public.mid_finance_entries
SET person = 'Incoming + Outgoing'
WHERE person IN ('Elumugam+Deepak', 'Elumugam + Deepak', 'Deepak+Elumugam', 'Deepak + Elumugam');
