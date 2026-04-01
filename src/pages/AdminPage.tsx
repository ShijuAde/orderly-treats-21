import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Shield, Plus, Pencil, Trash2, LogOut, UtensilsCrossed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCartStore, Order } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { notifyOrderStatus } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import { useMenuItems } from '@/hooks/useMenuItems';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
}

const emptyForm: MenuFormData = { name: '', description: '', price: '', image: '', category: 'Main Dishes' };

const AdminPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { orders, updateOrderStatus } = useCartStore();
  const { toast } = useToast();
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const handleAdvance = (order: Order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    updateOrderStatus(order.id, next);
    toast({ title: `Order ${order.id} updated`, description: `Status changed to ${statusLabels[next]}` });
    notifyOrderStatus(order.customerPhone, order.id, next);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description, price: String(item.price), image: item.image, category: item.category });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: parseInt(form.price) || 0,
      image: form.image,
      category: form.category,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('menu_items').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('menu_items').insert(payload));
    }
    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Item updated' : 'Item created' });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setFormOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item deleted' });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const categories = [...new Set(menuItems.map((i) => i.category))];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-1">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        <Tabs defaultValue="orders" className="mt-6">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {['pending', 'processing', 'out-for-delivery', 'delivered'].map((status) => (
                <Card key={status}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{orders.filter((o) => o.status === status).length}</div>
                    <div className="text-xs text-muted-foreground">{statusLabels[status]}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="mt-8 font-serif text-xl font-bold">Active Orders ({activeOrders.length})</h2>
            <div className="mt-4 space-y-4">
              {activeOrders.length === 0 && <p className="py-8 text-center text-muted-foreground">No active orders 🎉</p>}
              {activeOrders.map((order, i) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">{order.id}</span>
                            <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p>👤 {order.customerName} · 📞 {order.customerPhone}</p>
                            <p>📍 {order.customerAddress}</p>
                            <p>🕐 {new Date(order.date).toLocaleString()}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.items.map((item) => (
                              <span key={item.id} className="rounded-full bg-secondary px-3 py-1 text-xs">{item.name} × {item.quantity}</span>
                            ))}
                          </div>
                          <p className="mt-2 text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                        </div>
                        {nextStatus[order.status] && (
                          <Button onClick={() => handleAdvance(order)} className="gap-1 shrink-0">
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

            {completedOrders.length > 0 && (
              <>
                <h2 className="mt-10 font-serif text-xl font-bold">Completed ({completedOrders.length})</h2>
                <div className="mt-4 space-y-3">
                  {completedOrders.map((order) => (
                    <Card key={order.id} className="opacity-70">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <span className="font-semibold">{order.id}</span>
                          <span className="ml-3 text-sm text-muted-foreground">{order.customerName} · {formatPrice(order.total)}</span>
                        </div>
                        <Badge className={statusColors.delivered}>{statusLabels.delivered}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* MENU ITEMS TAB */}
          <TabsContent value="menu">
            <div className="mt-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold">Menu Items ({menuItems.length})</h2>
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" /> Add Item</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jollof Rice" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price (₦)</Label>
                        <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="3500" />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Main Dishes" />
                      </div>
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
                    </div>
                    {form.image && (
                      <img src={form.image} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
                    )}
                    <Button onClick={handleSave} disabled={saving} className="w-full">
                      {saving ? 'Saving…' : editingId ? 'Update Item' : 'Create Item'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {menuLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading menu…</p>
            ) : (
              <div className="mt-4 space-y-3">
                {menuItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{item.name}</span>
                          <Badge variant="secondary" className="shrink-0">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        <p className="font-bold text-primary">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
