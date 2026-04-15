import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Store, Star, ShoppingBag, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAllBrands } from '@/hooks/useBrand';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';

const CustomerHomePage = () => {
  const { user } = useAuth();
  const { data: brands = [], isLoading } = useAllBrands();
  const [search, setSearch] = useState('');

  // Fetch user's recent orders for personalized section
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-orders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Get unique brand IDs from recent orders
  const recentBrandIds = [...new Set(recentOrders.map((o: any) => o.brand_id).filter(Boolean))];
  const recentBrands = brands.filter((b) => recentBrandIds.includes(b.id));

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">
              Discover & Order from <span className="text-primary">Local Restaurants</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse menus, place orders, and enjoy delicious meals from your favorite spots
            </p>
            <div className="mx-auto mt-8 max-w-md relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Personalized section for logged-in users */}
        {user && recentBrands.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold">Order Again</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentBrands.slice(0, 3).map((brand) => (
                <Link key={brand.id} to={`/${brand.slug}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="flex items-center gap-4 p-4">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{brand.name}</h3>
                        <p className="text-sm text-muted-foreground">Order again →</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent orders */}
        {user && recentOrders.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">Recent Orders</h2>
              </div>
              <Link to="/orders">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            <div className="space-y-2">
              {recentOrders.slice(0, 3).map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold">{order.order_number}</span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{order.status}</Badge>
                      <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All restaurants directory */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold">All Restaurants</h2>
            <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">Loading restaurants…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              {search ? 'No restaurants match your search.' : 'No restaurants registered yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((brand, i) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/${brand.slug}`}>
                    <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="h-20 w-20 rounded-full object-cover border-4 border-background shadow-lg" />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background border-4 border-background shadow-lg">
                            <Store className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-serif text-lg font-bold group-hover:text-primary transition-colors">
                          {brand.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">View Menu →</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerHomePage;
