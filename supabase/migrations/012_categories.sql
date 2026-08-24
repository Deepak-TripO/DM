-- 012_categories.sql
-- Create categories table for system document/file category management
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'document',
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view active categories
DROP POLICY IF EXISTS "Anyone can read categories." ON public.categories;
CREATE POLICY "Anyone can read categories."
    ON public.categories FOR SELECT
    USING (true);

-- Admins can insert, update, and delete categories
DROP POLICY IF EXISTS "Admins can insert categories." ON public.categories;
CREATE POLICY "Admins can insert categories."
    ON public.categories FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update categories." ON public.categories;
CREATE POLICY "Admins can update categories."
    ON public.categories FOR UPDATE
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete categories." ON public.categories;
CREATE POLICY "Admins can delete categories."
    ON public.categories FOR DELETE
    USING (public.is_admin(auth.uid()));

-- Insert default categories
INSERT INTO public.categories (name, type, status) VALUES
('Documents', 'document', 'Active'),
('Images', 'image', 'Active'),
('Videos', 'video', 'Active'),
('Audio', 'audio', 'Active'),
('PDF', 'pdf', 'Active'),
('Spreadsheets', 'spreadsheet', 'Active'),
('Presentations', 'presentation', 'Active'),
('Archives', 'archive', 'Active'),
('Other', 'other', 'Active')
ON CONFLICT (name) DO NOTHING;
