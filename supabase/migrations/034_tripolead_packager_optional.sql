-- 034_tripolead_packager_optional.sql
-- Allow district and area columns in tripolead_entries table to be NULL for Packager entries

ALTER TABLE public.tripolead_entries ALTER COLUMN district DROP NOT NULL;
ALTER TABLE public.tripolead_entries ALTER COLUMN area DROP NOT NULL;
