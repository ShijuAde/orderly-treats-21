import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Package, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-warm text-warm-foreground',
  processing: 'bg-primary text-primary-foreground',
  'out-for-delivery': 'bg-accent text-accent-foreground',
  delivered: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pending: '⏳ Pending',
  processing: '👨‍🍳 Processing',
  'out-for-delivery': '🚗 Out for Delivery',
  delivered: '✅ Delivered',
};

interface OrderRow {
  id: string;
  order_number: string;
  items: any[];
  total: number;
  status: string;
  created_at: string;
  fulfillment: string;
}

const AccountPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as any) || []);
      setLoadingOrders(false);
    };

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('notifications_enabled').eq('id', user.id).maybeSingle();
      if (data) setNotificationsEnabled(data.notifications_enabled);
    };

    fetchOrders();
    fetchProfile();

    // Real-time order updates
    const channel = supabase
      .channel('my-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (user) {
      await supabase.from('profiles').update({ notifications_enabled: enabled }).eq('id', user.id);
      toast({ title: enabled ? 'Notifications enabled' : 'Notifications disabled' });
    }
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-3xl font-bold">My Account</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-1">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Profile info */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">{user.user_metadata?.full_name || 'Customer'}</h2>
                <p className="text-sm text-muted-foreground">{user.email || user.phone}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notifications" className="text-sm">Push Notifications</Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={toggleNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order history */}
        <h2 className="mt-8 font-serif text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5" /> Order History
        </h2>

        {loadingOrders ? (
          <p className="py-8 text-center text-muted-foreground">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-2 text-muted-foreground">No orders yet</p>
            <Link to="/menu"><Button className="mt-4">Browse Menu</Button></Link>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="font-sans text-base font-semibold">{order.order_number}</CardTitle>
                    </div>
                    <Badge className={statusColors[order.status] || 'bg-muted'}>{statusLabels[order.status] || order.status}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span>{order.items?.length || 0} items</span>
                      <span>{order.fulfillment === 'pickup' ? '🏪 Pickup' : '🚗 Delivery'}</span>
                      <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(order.items || []).map((item: any, idx: number) => (
                        <span key={idx} className="rounded-full bg-secondary px-3 py-1 text-xs">
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
