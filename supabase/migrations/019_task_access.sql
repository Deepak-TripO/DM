-- 019_task_access.sql
-- Create task_access table for admin task assignment to specific user IDs

CREATE TABLE IF NOT EXISTS public.task_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_task_user_access UNIQUE (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_access_task_id ON public.task_access(task_id);
CREATE INDEX IF NOT EXISTS idx_task_access_user_id ON public.task_access(user_id);

ALTER TABLE public.task_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage task_access" ON public.task_access;
DROP POLICY IF EXISTS "Users can view own task_access" ON public.task_access;
DROP POLICY IF EXISTS "Authenticated users can manage task_access" ON public.task_access;

CREATE POLICY "Authenticated users can manage task_access"
    ON public.task_access FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Update RLS on folders to allow reading assigned tasks
DROP POLICY IF EXISTS "Users can view assigned or owned folders" ON public.folders;
CREATE POLICY "Users can view assigned or owned folders"
    ON public.folders FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL AND (
            auth.uid() = owner_id 
            OR public.is_admin(auth.uid())
            OR EXISTS (
                SELECT 1 FROM public.task_access ta 
                WHERE ta.task_id = public.folders.id 
                AND ta.user_id = auth.uid()
            )
        )
    );
