-- 031_account_approval.sql
-- Add approval_status column to public.profiles table with default 'approved' for existing users

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
