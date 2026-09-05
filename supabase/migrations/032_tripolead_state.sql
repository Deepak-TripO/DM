-- 032_tripolead_state.sql
-- Add state column to tripolead_entries table

ALTER TABLE public.tripolead_entries ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Tamil Nadu';
