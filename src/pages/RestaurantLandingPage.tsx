import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, Clock, CalendarDays, Store as StoreIcon, Truck, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import MenuCard from '@/components/MenuCard';
import { Brand } from '@/hooks/useBrand';
import { useMenuItemsByBrand } from '@/hooks/useMenuItems';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  brand: Brand & {
    description?: string;
    hero_image_url?: string;
    about_text?: string;
    gallery_images?: string[];
    theme?: string;
    fulfillment_options?: { delivery?: boolean; pickup?: boolean; reservation?: boolean };
  };
}

const themeStyles: Record<string, { hero: string; accent: string }> = {
  classic: { hero: 'from-primary/20 via-background to-secondary/20', accent: 'bg-primary' },
  modern: { hero: 'from-foreground/5 via-background to-muted/30', accent: 'bg-foreground' },
  elegant: { hero: 'from-amber-100/40 via-background to-primary/10', accent: 'bg-amber-600' },
};

const RestaurantLandingPage = ({ brand }: Props) => {
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItemsByBrand(brand.id);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [reservationOpen, setReservationOpen] = useState(false);
  const [resForm, setResForm] = useState({ name: '', email: '', phone: '', date: '', time: '', party_size: '2', notes: '' });
  const [resSubmitting, setResSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const theme = themeStyles[brand.theme || 'classic'] || themeStyles.classic;
  const fulfillment = brand.fulfillment_options || { delivery: true, pickup: false, reservation: false };
  const categories = [...new Set(menuItems.map((item) => item.category))];

  const filtered = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleReservation = async () => {
    if (!resForm.name || !resForm.date || !resForm.time) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setResSubmitting(true);
    const { error } = await supabase.from('reservations').insert({
      brand_id: brand.id,
      user_id: user?.id || null,
      customer_name: resForm.name,
      customer_email: resForm.email,
      customer_phone: resForm.phone,
      reservation_date: resForm.date,
      reservation_time: resForm.time,
      party_size: parseInt(resForm.party_size) || 2,
      notes: resForm.notes,
    } as any);
    setResSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reservation submitted! 🎉', description: 'The restaurant will confirm shortly.' });
      setReservationOpen(false);
      setResForm({ name: '', email: '', phone: '', date: '', time: '', party_size: '2', notes: '' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br ${theme.hero} py-20`}>
        {brand.hero_image_url && (
          <div className="absolute inset-0">
            <img src={brand.hero_image_url} alt="" className="h-full w-full object-cover opacity-20" />
          </div>
        )}
        <div className="container relative mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
            {brand.logo_url && (
              <img src={brand.logo_url} alt={brand.name} className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-xl mb-6" />
            )}
            <h1 className="font-serif text-4xl font-bold md:text-5xl">{brand.name}</h1>
            {brand.description && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{brand.description}</p>}

            {/* Fulfillment options badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {fulfillment.delivery && (
                <Badge variant="secondary" className="gap-1 px-4 py-2 text-sm">
                  <Truck className="h-4 w-4" /> Delivery
                </Badge>
              )}
              {fulfillment.pickup && (
                <Badge variant="secondary" className="gap-1 px-4 py-2 text-sm">
                  <ShoppingBag className="h-4 w-4" /> Pickup
                </Badge>
              )}
              {fulfillment.reservation && (
                <Dialog open={reservationOpen} onOpenChange={setReservationOpen}>
                  <DialogTrigger asChild>
                    <Badge variant="default" className="gap-1 px-4 py-2 text-sm cursor-pointer hover:opacity-90">
                      <CalendarDays className="h-4 w-4" /> Reserve a Table
                    </Badge>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Reserve a Table at {brand.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input value={resForm.name} onChange={(e) => setResForm({ ...resForm, name: e.target.value })} placeholder="Your name" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Email</Label>
                          <Input value={resForm.email} onChange={(e) => setResForm({ ...resForm, email: e.target.value })} placeholder="email@example.com" />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input value={resForm.phone} onChange={(e) => setResForm({ ...resForm, phone: e.target.value })} placeholder="+234..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Date *</Label>
                          <Input type="date" value={resForm.date} onChange={(e) => setResForm({ ...resForm, date: e.target.value })} />
                        </div>
                        <div>
                          <Label>Time *</Label>
                          <Input type="time" value={resForm.time} onChange={(e) => setResForm({ ...resForm, time: e.target.value })} />
                        </div>
                        <div>
                          <Label>Guests</Label>
                          <Input type="number" min="1" value={resForm.party_size} onChange={(e) => setResForm({ ...resForm, party_size: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Input value={resForm.notes} onChange={(e) => setResForm({ ...resForm, notes: e.target.value })} placeholder="Special requests..." />
                      </div>
                      <Button onClick={handleReservation} disabled={resSubmitting} className="w-full">
                        {resSubmitting ? 'Submitting…' : 'Reserve Table'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About section */}
      {brand.about_text && (
        <section className="py-12 bg-card">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="font-serif text-2xl font-bold mb-4">About Us</h2>
            <p className="text-muted-foreground leading-relaxed">{brand.about_text}</p>
          </div>
        </section>
      )}

      {/* Gallery */}
      {brand.gallery_images && brand.gallery_images.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold mb-6 text-center">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brand.gallery_images.map((img, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <img src={img} alt={`Gallery ${i + 1}`} className="h-48 w-full rounded-xl object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Menu Section */}
      <section className="py-12" id="menu">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">Our Menu</h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center mb-8">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search dishes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button size="sm" variant={activeCategory === 'All' ? 'default' : 'outline'} onClick={() => setActiveCategory('All')}>All</Button>
              {categories.map((cat) => (
                <Button key={cat} size="sm" variant={activeCategory === cat ? 'default' : 'outline'} onClick={() => setActiveCategory(cat)}>{cat}</Button>
              ))}
            </div>
          </div>

          {menuLoading ? (
            <div className="py-20 text-center text-muted-foreground">Loading menu…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((item, i) => (
                  <MenuCard key={item.id} item={item} index={i} />
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">No dishes found.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default RestaurantLandingPage;
