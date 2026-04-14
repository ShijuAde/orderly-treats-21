
-- Fix user_roles insert - restrict to super_admins (trigger bypasses RLS via SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Fix settings table policies - restrict to super_admins or restaurant owners
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can delete settings" ON public.settings;

CREATE POLICY "Super admins can insert settings" ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'restaurant_owner'));

CREATE POLICY "Super admins can update settings" ON public.settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'restaurant_owner'));

CREATE POLICY "Super admins can delete settings" ON public.settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
