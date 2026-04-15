
-- Extend brands table with website content and fulfillment options
ALTER TABLE public.brands 
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS fulfillment_options jsonb NOT NULL DEFAULT '{"delivery": true, "pickup": false, "reservation": false}';

-- Create reservations table
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL,
  user_id uuid,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  party_size integer NOT NULL DEFAULT 1,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Customers can create reservations
CREATE POLICY "Anyone can create reservations"
  ON public.reservations FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can read own reservations
CREATE POLICY "Users can read own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Restaurant owners can read their brand reservations
CREATE POLICY "Owners can read brand reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM brands WHERE brands.id = reservations.brand_id AND brands.owner_id = auth.uid()
  ));

-- Restaurant owners can update their brand reservations
CREATE POLICY "Owners can update brand reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM brands WHERE brands.id = reservations.brand_id AND brands.owner_id = auth.uid()
  ));

-- Super admins can read all reservations
CREATE POLICY "Super admins can read all reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));
