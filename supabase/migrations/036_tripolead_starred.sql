-- 036_tripolead_starred.sql
-- Add is_starred column to tripolead_entries table

ALTER TABLE public.tripolead_entries ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
