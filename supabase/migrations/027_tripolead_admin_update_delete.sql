-- 027_tripolead_admin_update_delete.sql
-- Restrict UPDATE and DELETE on tripolead_entries table to Administrators ONLY

DROP POLICY IF EXISTS "Users can update tripolead entries" ON public.tripolead_entries;
DROP POLICY IF EXISTS "Admins can update tripolead entries" ON public.tripolead_entries;
CREATE POLICY "Admins can update tripolead entries"
    ON public.tripolead_entries FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete tripolead entries" ON public.tripolead_entries;
DROP POLICY IF EXISTS "Admins can delete tripolead entries" ON public.tripolead_entries;
CREATE POLICY "Admins can delete tripolead entries"
    ON public.tripolead_entries FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));
