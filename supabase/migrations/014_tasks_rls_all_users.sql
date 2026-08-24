-- 014_tasks_rls_all_users.sql
-- Allow all authenticated users to SELECT active tasks/folders created by Admin, while restricting INSERT/UPDATE/DELETE to Admin users.

-- 1. Enable RLS on public.folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT policies on folders
DROP POLICY IF EXISTS "Admins can view all folders." ON public.folders;
DROP POLICY IF EXISTS "Allow authenticated users to view active folders" ON public.folders;
DROP POLICY IF EXISTS "Authenticated users can select active tasks." ON public.folders;

-- 3. Create SELECT policy for all authenticated users to read active tasks/folders
CREATE POLICY "Authenticated users can select active tasks."
    ON public.folders FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- 4. Drop and recreate management policy for Admin / owner only (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage all folders." ON public.folders;
DROP POLICY IF EXISTS "Admins can manage all tasks." ON public.folders;

CREATE POLICY "Admins can manage all tasks."
    ON public.folders FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()) OR auth.uid() = owner_id)
    WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = owner_id);

-- 5. Enable RLS and add SELECT policy for public.files inside tasks
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select task files." ON public.files;

CREATE POLICY "Authenticated users can select task files."
    ON public.files FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL AND (
            auth.uid() = owner_id
            OR public.is_admin(auth.uid())
            OR (folder_id IS NOT NULL)
        )
    );

