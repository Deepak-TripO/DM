-- 033_tripolead_vishal_permissions.sql
-- Grant Edit, Delete, and Status Update permissions on tripolead_entries table to vishal@gmail.com and Administrators ONLY

DROP POLICY IF EXISTS "Admins can update tripolead entries" ON public.tripolead_entries;
DROP POLICY IF EXISTS "Admins and Vishal can update tripolead entries" ON public.tripolead_entries;

CREATE POLICY "Admins and Vishal can update tripolead entries"
    ON public.tripolead_entries FOR UPDATE
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR 
        LOWER(auth.jwt() ->> 'email') = 'vishal@gmail.com'
    )
    WITH CHECK (
        public.is_admin(auth.uid()) OR 
        LOWER(auth.jwt() ->> 'email') = 'vishal@gmail.com'
    );

DROP POLICY IF EXISTS "Admins can delete tripolead entries" ON public.tripolead_entries;
DROP POLICY IF EXISTS "Admins and Vishal can delete tripolead entries" ON public.tripolead_entries;

CREATE POLICY "Admins and Vishal can delete tripolead entries"
    ON public.tripolead_entries FOR DELETE
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR 
        LOWER(auth.jwt() ->> 'email') = 'vishal@gmail.com'
    );
