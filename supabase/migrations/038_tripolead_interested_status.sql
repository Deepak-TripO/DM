-- 038_tripolead_interested_status.sql
-- Documenting and supporting 'Interested' status for TripO Lead entries

-- Note: tripolead_entries status column is TEXT type and supports 'Interested'
-- This migration serves as an explicit schema migration reference.

COMMENT ON COLUMN public.tripolead_entries.status IS 'TripO Lead status: Pending, No Response, Complete, Follow up, Interested, No Status';
