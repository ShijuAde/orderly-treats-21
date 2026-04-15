import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Store, TrendingUp, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAllBrands } from '@/hooks/useBrand';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface BrandStats {
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  total_orders: number;
  total_sales: number;
  commission: number;
  customer_count: number;
}

const COMMISSION_RATE = 0.02;

const SuperAdminPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: brands = [] } = useAllBrands();
  const [brandStats, setBrandStats] = useState<BrandStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Total registered users
  const { data: totalUsers = 0 } = useQuery({
    queryKey: ['total-users'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Total restaurant owners
  const { data: totalOwners = 0 } = useQuery({
    queryKey: ['total-owners'],
    queryFn: async () => {
      const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'restaurant_owner');
      return count || 0;
    },
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!brands.length) return;
      const { data: orders } = await supabase.from('orders').select('brand_id, total, status, customer_email');
      if (!orders) { setLoading(false); return; }

      const statsMap = new Map<string, { total_orders: number; total_sales: number; customers: Set<string> }>();
      for (const order of orders) {
        if (!order.brand_id) continue;
        const existing = statsMap.get(order.brand_id) || { total_orders: 0, total_sales: 0, customers: new Set<string>() };
        existing.total_orders += 1;
        existing.total_sales += order.total || 0;
        if (order.customer_email) existing.customers.add(order.customer_email);
        statsMap.set(order.brand_id, existing);
      }

      const stats: BrandStats[] = brands.map((b) => {
        const s = statsMap.get(b.id) || { total_orders: 0, total_sales: 0, customers: new Set() };
        return {
          brand_id: b.id,
          brand_name: b.name,
          brand_slug: b.slug,
          total_orders: s.total_orders,
          total_sales: s.total_sales,
          commission: Math.round(s.total_sales * COMMISSION_RATE),
          customer_count: s.customers.size,
        };
      });
      setBrandStats(stats);
      setLoading(false);
    };
    fetchStats();
  }, [brands]);

  if (authLoading || roleLoading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user || role !== 'super_admin') return <Navigate to="/auth" replace />;

  const totalSales = brandStats.reduce((s, b) => s + b.total_sales, 0);
  const totalOrders = brandStats.reduce((s, b) => s + b.total_orders, 0);
  const totalCommission = brandStats.reduce((s, b) => s + b.commission, 0);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-3xl font-bold">Super Admin</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card><CardContent className="p-4 text-center">
            <Store className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{brands.length}</div>
            <div className="text-xs text-muted-foreground">Restaurants</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Users className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{totalOwners}</div>
            <div className="text-xs text-muted-foreground">Restaurant Owners</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Package className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="text-xs text-muted-foreground">Total Orders</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <DollarSign className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            <div className="text-xs text-muted-foreground">Total Sales</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <DollarSign className="mx-auto h-6 w-6 text-primary mb-1" />
            <div className="text-2xl font-bold text-primary">{formatPrice(totalCommission)}</div>
            <div className="text-xs text-muted-foreground">Commission (2%)</div>
          </CardContent></Card>
        </div>

        {/* Restaurants list */}
        <h2 className="mt-8 font-serif text-xl font-bold">All Restaurants</h2>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-4 space-y-3">
            {brandStats.length === 0 && <p className="py-8 text-center text-muted-foreground">No restaurants registered yet.</p>}
            {brandStats.map((bs) => (
              <motion.div key={bs.brand_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card><CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{bs.brand_name}</span>
                      <Badge variant="secondary">/{bs.brand_slug}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {bs.total_orders} orders · {bs.customer_count} customers · {formatPrice(bs.total_sales)} sales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-bold text-primary">{formatPrice(bs.commission)}</p>
                  </div>
                </CardContent></Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
