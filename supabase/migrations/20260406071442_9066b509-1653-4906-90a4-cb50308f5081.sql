
-- Settings table for storing app configuration like Paystack key
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for Paystack public key on checkout)
CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated users can insert/update/delete settings
CREATE POLICY "Authenticated users can insert settings" ON public.settings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings" ON public.settings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete settings" ON public.settings
  FOR DELETE TO authenticated USING (true);

-- Insert default Paystack key
INSERT INTO public.settings (key, value) VALUES ('paystack_public_key', 'pk_test_e598295829f3d2ad28904885b46b0b94c0a754b7');

-- Add images array column to menu_items for multiple images
ALTER TABLE public.menu_items ADD COLUMN images text[] NOT NULL DEFAULT '{}';
