-- 032_fix_profiles_admin_rls.sql
-- Grant Admins permission to INSERT and UPDATE any profile in public.profiles table to prevent 403 RLS violation

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins and users can insert profiles." ON public.profiles;
CREATE POLICY "Admins and users can insert profiles."
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Admins and users can update profiles." ON public.profiles;
CREATE POLICY "Admins and users can update profiles."
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
