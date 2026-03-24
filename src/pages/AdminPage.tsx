import { motion } from 'framer-motion';
import { Package, ChevronRight, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore, Order } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { notifyOrderStatus } from '@/lib/whatsapp';

const nextStatus: Record<string, Order['status'] | null> = {
  pending: 'processing',
  processing: 'out-for-delivery',
  'out-for-delivery': 'delivered',
  delivered: null,
};

const statusLabels: Record<string, string> = {
  pending: '⏳ Pending',
  processing: '👨‍🍳 Processing',
  'out-for-delivery': '🚗 Out for Delivery',
  delivered: '✅ Delivered',
};

const statusColors: Record<string, string> = {
  pending: 'bg-warm text-warm-foreground',
  processing: 'bg-primary text-primary-foreground',
  'out-for-delivery': 'bg-accent text-accent-foreground',
  delivered: 'bg-muted text-muted-foreground',
};

const nextActionLabel: Record<string, string> = {
  pending: 'Start Processing',
  processing: 'Mark Out for Delivery',
  'out-for-delivery': 'Mark Delivered',
};

const AdminPage = () => {
  const { orders, updateOrderStatus } = useCartStore();
  const { toast } = useToast();

  const handleAdvance = (order: Order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    updateOrderStatus(order.id, next);
    toast({
      title: `Order ${order.id} updated`,
      description: `Status changed to ${statusLabels[next]}`,
    });
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Manage incoming orders</p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {['pending', 'processing', 'out-for-delivery', 'delivered'].map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <Card key={status}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{statusLabels[status]}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active orders */}
        <h2 className="mt-10 font-serif text-xl font-bold">
          Active Orders ({activeOrders.length})
        </h2>
        <div className="mt-4 space-y-4">
          {activeOrders.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No active orders 🎉</p>
          )}
          {activeOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{order.id}</span>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>👤 {order.customerName} · 📞 {order.customerPhone}</p>
                        <p>📍 {order.customerAddress}</p>
                        <p>🕐 {new Date(order.date).toLocaleString()}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <span key={item.id} className="rounded-full bg-secondary px-3 py-1 text-xs">
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                    </div>
                    {nextStatus[order.status] && (
                      <Button
                        onClick={() => handleAdvance(order)}
                        className="gap-1 shrink-0"
                      >
                        {nextActionLabel[order.status]}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Completed */}
        {completedOrders.length > 0 && (
          <>
            <h2 className="mt-10 font-serif text-xl font-bold">
              Completed ({completedOrders.length})
            </h2>
            <div className="mt-4 space-y-3">
              {completedOrders.map((order) => (
                <Card key={order.id} className="opacity-70">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold">{order.id}</span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {order.customerName} · {formatPrice(order.total)}
                      </span>
                    </div>
                    <Badge className={statusColors.delivered}>{statusLabels.delivered}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
