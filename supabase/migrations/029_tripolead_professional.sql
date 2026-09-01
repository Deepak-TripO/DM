-- 029_tripolead_professional.sql
-- Add professional column to tripolead_entries table

ALTER TABLE public.tripolead_entries ADD COLUMN IF NOT EXISTS professional TEXT DEFAULT NULL;
