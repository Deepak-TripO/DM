-- 030_tripolead_mobile_number.sql
-- Add mobile_number column to tripolead_entries table

ALTER TABLE public.tripolead_entries ADD COLUMN IF NOT EXISTS mobile_number TEXT DEFAULT NULL;
