-- 017_finance_trash_support.sql
-- Add is_deleted and deleted_at columns to public.finance_entries for soft-delete/trash support

ALTER TABLE public.finance_entries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
