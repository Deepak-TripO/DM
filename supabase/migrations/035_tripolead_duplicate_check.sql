-- 035_tripolead_duplicate_check.sql
-- Duplicate protection for tripolead_entries table

CREATE OR REPLACE FUNCTION public.check_tripolead_duplicate()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check if entry is soft deleted
    IF NEW.deleted_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.tripolead_entries
        WHERE task_id = NEW.task_id
          AND deleted_at IS NULL
          AND (TG_OP = 'INSERT' OR id != NEW.id)
          AND LOWER(TRIM(COALESCE(hotel_name, ''))) = LOWER(TRIM(COALESCE(NEW.hotel_name, '')))
          AND LOWER(TRIM(COALESCE(mobile_number, ''))) = LOWER(TRIM(COALESCE(NEW.mobile_number, '')))
          AND LOWER(TRIM(COALESCE(district, ''))) = LOWER(TRIM(COALESCE(NEW.district, '')))
          AND LOWER(TRIM(COALESCE(location_link, ''))) = LOWER(TRIM(COALESCE(NEW.location_link, '')))
    ) THEN
        RAISE EXCEPTION 'Duplicate TripO Lead entry. This lead already exists.' USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_tripolead_duplicate ON public.tripolead_entries;

CREATE TRIGGER trg_check_tripolead_duplicate
BEFORE INSERT OR UPDATE ON public.tripolead_entries
FOR EACH ROW
EXECUTE FUNCTION public.check_tripolead_duplicate();
