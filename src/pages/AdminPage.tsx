import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Shield, Plus, Pencil, Trash2, LogOut, Upload, Settings, X } from 'lucide-react';
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
import { useSettings, useUpsertSetting } from '@/hooks/useSettings';
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
  images: string[];
}

const emptyForm: MenuFormData = { name: '', description: '', price: '', image: '', category: 'Main Dishes', images: [] };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AdminPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { orders, updateOrderStatus } = useCartStore();
  const { toast } = useToast();
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const { data: settings = {} } = useSettings();
  const upsertSetting = useUpsertSetting();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [paystackKey, setPaystackKey] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Sync settings to local state once
  if (!settingsLoaded && settings.paystack_public_key !== undefined) {
    setPaystackKey(settings.paystack_public_key || '');
    setSettingsLoaded(true);
  }

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
    setImageFiles([]);
    setImagePreviews([]);
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    const allImages: string[] = item.images?.length ? item.images : (item.image ? [item.image] : []);
    setForm({ name: item.name, description: item.description, price: String(item.price), image: item.image, category: item.category, images: allImages });
    setImageFiles([]);
    setImagePreviews(allImages);
    setFormOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please select image files only', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum size is 5MB per image', variant: 'destructive' });
        return;
      }
    }

    setImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    // If it was a new file (index >= existing images count)
    const existingCount = form.images.length;
    if (index >= existingCount) {
      setImageFiles((prev) => prev.filter((_, i) => i !== (index - existingCount)));
    } else {
      setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(fileName, file);
    if (error) throw error;
    return `${SUPABASE_URL}/storage/v1/object/public/menu-images/${fileName}`;
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);

    let allImageUrls = [...form.images];

    if (imageFiles.length > 0) {
      try {
        setUploading(true);
        const uploaded = await Promise.all(imageFiles.map(uploadImage));
        allImageUrls = [...allImageUrls, ...uploaded];
        setUploading(false);
      } catch (err: any) {
        setUploading(false);
        setSaving(false);
        toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
        return;
      }
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: parseInt(form.price) || 0,
      image: allImageUrls[0] || '',
      images: allImageUrls,
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

  const handleSaveSettings = async () => {
    try {
      await upsertSetting.mutateAsync({ key: 'paystack_public_key', value: paystackKey });
      toast({ title: 'Settings saved!' });
    } catch (err: any) {
      toast({ title: 'Error saving settings', description: err.message, variant: 'destructive' });
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

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
            <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
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
                <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                      <Label>Images</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      {/* Image previews grid */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative group">
                              <img src={src} alt={`Preview ${idx + 1}`} className="h-24 w-full rounded-lg object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 transition-colors hover:border-primary hover:bg-muted/50"
                      >
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Upload className="h-8 w-8" />
                          <span className="text-sm">{imagePreviews.length > 0 ? 'Add more images' : 'Click to upload images'}</span>
                          <span className="text-xs">JPG, PNG, WebP · Max 5MB each</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving || uploading} className="w-full">
                      {uploading ? 'Uploading images…' : saving ? 'Saving…' : editingId ? 'Update Item' : 'Create Item'}
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
                      <div className="flex gap-1 shrink-0">
                        {(item.images?.length ? item.images.slice(0, 2) : [item.image]).map((src, i) => (
                          <img key={i} src={src} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                        ))}
                        {(item.images?.length || 0) > 2 && (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                            +{item.images!.length - 2}
                          </div>
                        )}
                      </div>
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

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <div className="mt-4 max-w-lg space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-serif text-lg font-semibold">Payment Settings</h3>
                  <div>
                    <Label htmlFor="paystack-key">Paystack Public Key</Label>
                    <Input
                      id="paystack-key"
                      value={paystackKey}
                      onChange={(e) => setPaystackKey(e.target.value)}
                      placeholder="pk_test_..."
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Find this in your Paystack dashboard under Settings → API Keys & Webhooks.
                    </p>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={upsertSetting.isPending}>
                    {upsertSetting.isPending ? 'Saving…' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
