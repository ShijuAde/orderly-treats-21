import { motion } from 'framer-motion';
import { Package, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

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

const OrdersPage = () => {
  const orders = useCartStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <ClipboardList className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="font-serif text-2xl font-bold">No orders yet</h2>
        <p className="text-muted-foreground">Place your first order to see it here!</p>
        <Link to="/menu">
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold">My Orders</h1>
        <p className="mt-1 text-muted-foreground">Track your order history</p>

        <div className="mt-6 space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="font-sans text-base font-semibold">
                      {order.id}
                    </CardTitle>
                  </div>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                    <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span key={item.id} className="rounded-full bg-secondary px-3 py-1 text-xs">
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
