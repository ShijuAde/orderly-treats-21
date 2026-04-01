
-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Main Dishes',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read menu items
CREATE POLICY "Anyone can read menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can insert/update/delete (admin check in app)
CREATE POLICY "Authenticated users can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (true);

-- Seed with initial menu data
INSERT INTO public.menu_items (name, description, price, image, category) VALUES
  ('Jollof Rice & Chicken', 'Smoky party-style jollof rice served with perfectly grilled chicken', 3500, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop', 'Main Dishes'),
  ('Pounded Yam & Egusi', 'Smooth pounded yam with rich melon seed soup and assorted meat', 4000, 'https://images.unsplash.com/photo-1643279479068-f700d523e22b?w=400&h=300&fit=crop', 'Main Dishes'),
  ('Pepper Soup', 'Spicy goat meat pepper soup with aromatic herbs', 3000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', 'Soups'),
  ('Fried Rice & Plantain', 'Nigerian fried rice with sweet fried plantain and coleslaw', 3200, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', 'Main Dishes'),
  ('Suya Platter', 'Spiced grilled beef skewers with onions and tomatoes', 2500, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', 'Grills'),
  ('Chapman Drink', 'Refreshing Nigerian cocktail with Fanta, Sprite, and grenadine', 1500, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', 'Drinks'),
  ('Asun (Spicy Goat)', 'Tender spicy grilled goat meat with peppers and onions', 3500, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', 'Grills'),
  ('Chin Chin', 'Crunchy fried dough snack — a Nigerian classic', 800, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop', 'Snacks'),
  ('Zobo Drink', 'Chilled hibiscus flower drink with ginger and pineapple', 1000, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&h=300&fit=crop', 'Drinks'),
  ('Efo Riro', 'Rich spinach stew with assorted meat and stockfish', 3800, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', 'Soups'),
  ('Moi Moi', 'Steamed bean pudding with eggs and fish', 1200, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', 'Sides'),
  ('Puff Puff', 'Sweet deep-fried dough balls — light and fluffy', 600, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', 'Snacks');
