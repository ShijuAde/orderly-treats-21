
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'restaurant_owner', 'super_admin');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS for user_roles
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- 5. Create brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert their brand" ON public.brands
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'restaurant_owner'));

CREATE POLICY "Owners can update their brand" ON public.brands
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

-- 6. Add brand_id to menu_items
ALTER TABLE public.menu_items ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE;
CREATE INDEX idx_menu_items_brand ON public.menu_items(brand_id);

-- 7. Update menu_items RLS policies
DROP POLICY IF EXISTS "Anyone can read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated users can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated users can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated users can delete menu items" ON public.menu_items;

CREATE POLICY "Anyone can read menu items" ON public.menu_items
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert menu items" ON public.menu_items
  FOR INSERT TO authenticated
  WITH CHECK (
    brand_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can update menu items" ON public.menu_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete menu items" ON public.menu_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid())
  );

-- 8. Add brand_id to orders
ALTER TABLE public.orders ADD COLUMN brand_id UUID REFERENCES public.brands(id);
CREATE INDEX idx_orders_brand ON public.orders(brand_id);

-- 9. Update orders RLS policies
DROP POLICY IF EXISTS "Admin can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

CREATE POLICY "Owners can read their brand orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners can update their brand orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id AND owner_id = auth.uid())
  );

CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- 10. Trigger to auto-assign customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 11. Seed super_admin for existing user (if exists)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users WHERE email = 'shijuadeoyenuga@gmail.com'
ON CONFLICT DO NOTHING;
