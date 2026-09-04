-- 031_freelancelead_vishal_permissions.sql
-- Grant Edit, Delete, and Status Update permissions on freelancelead_entries table to vishal@gmail.com and Administrators ONLY

DROP POLICY IF EXISTS "Admins can update freelancelead entries" ON public.freelancelead_entries;
DROP POLICY IF EXISTS "Admins and Vishal can update freelancelead entries" ON public.freelancelead_entries;

CREATE POLICY "Admins and Vishal can update freelancelead entries"
    ON public.freelancelead_entries FOR UPDATE
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR 
        LOWER(auth.jwt() ->> 'email') = 'vishal@gmail.com'
    )
    WITH CHECK (
        public.is_admin(auth.uid()) OR 
        LOWER(auth.jwt() ->> 'email') = 'vishal@gmail.com'
    );

DROP POLICY IF EXISTS "Admins can delete freelancelead entries" ON public.freelancelead_entries;
DROP POLICY IF EXISTS "Admins and Vishal can delete freelancelead entries" ON public.freelancelead_entries;

CREATE POLICY "Admins and Vishal can delete freelancelead entries"
    ON public.freelancelead_entries FOR DELETE
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR 
        LOWER(auth.jwt() ->> 'email') = 'vishal@gmail.com'
    );
