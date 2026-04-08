import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, MapPin, Store, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, generateOrderId } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { payWithPaystack } from '@/lib/paystack';
import { useSetting } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { toast } = useToast();
  const { data: paystackKey } = useSetting('paystack_public_key');
  const { data: whatsappNumber } = useSetting('whatsapp_number');
  const { data: deliveryFeeStr } = useSetting('delivery_fee');
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [paying, setPaying] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string;
    reference: string;
    items: { id: string; name: string; quantity: number; price: number; image: string }[];
    total: number;
    whatsappUrl: string;
  } | null>(null);

  const subtotal = getTotal();
  const deliveryFee = fulfillment === 'delivery' ? (parseInt(deliveryFeeStr) || 0) : 0;
  const total = subtotal + deliveryFee;
  const whatsapp = whatsappNumber || '2347089989283';

  const buildWhatsAppMessage = (orderId: string) => {
    const itemsList = items
      .map((i) => `• ${i.name} × ${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`)
      .join('\n');
    const type = fulfillment === 'delivery' ? '🚗 Delivery' : '🏪 Pickup';
    let msg = `✅ *Order Confirmed!*\n\nOrder: ${orderId}\nName: ${customerName}\nPhone: ${customerPhone}\nType: ${type}\n\n${itemsList}\n`;
    if (deliveryFee > 0) msg += `\nDelivery Fee: ₦${deliveryFee.toLocaleString()}`;
    msg += `\n*Total: ₦${total.toLocaleString()}*\n\n`;
    if (fulfillment === 'delivery') {
      msg += `📍 *Delivery Address:* ${customerAddress}\n\nPlease confirm your address is correct so we can dispatch your order! 🙏`;
    } else {
      msg += `Please confirm your pickup order and we'll have it ready for you! 🙏`;
    }
    return msg;
  };

  const handleCheckout = () => {
    if (!customerName || !customerPhone || !customerEmail) {
      toast({ title: 'Please fill in all required details', variant: 'destructive' });
      return;
    }
    if (fulfillment === 'delivery' && !customerAddress) {
      toast({ title: 'Please enter your delivery address', variant: 'destructive' });
      return;
    }
    if (!paystackKey) {
      toast({ title: 'Payment not configured', description: 'Please contact the admin.', variant: 'destructive' });
      return;
    }

    setPaying(true);

    payWithPaystack({
      email: customerEmail,
      amount: total * 100,
      publicKey: paystackKey,
      onSuccess: async (reference) => {
        const orderId = generateOrderId();

        // Save order to database
        await supabase.from('orders').insert({
          order_number: orderId,
          user_id: user?.id || null,
          items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, image: i.image })),
          total,
          status: 'pending',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: fulfillment === 'delivery' ? customerAddress : 'Pickup',
          fulfillment,
          payment_reference: reference,
        } as any);

        const orderItems = items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, image: i.image }));
        clearCart();
        setPaying(false);

        toast({ title: '🎉 Payment successful!', description: `Order ${orderId} confirmed. Ref: ${reference}` });

        // Build WhatsApp message and redirect
        const message = buildWhatsAppMessage(orderId);
        const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

        // Show order summary then redirect to WhatsApp
        setCompletedOrder({ orderId, reference, items: orderItems, total, whatsappUrl });
      },
      onClose: () => {
        setPaying(false);
        toast({ title: 'Payment cancelled', description: 'You can try again when ready.' });
      },
    });
  };

  // Show order summary after successful payment
  if (completedOrder) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto max-w-lg px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card>
              <CardContent className="p-6 text-center space-y-6">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <div>
                  <h2 className="font-serif text-2xl font-bold">Order Confirmed! 🎉</h2>
                  <p className="text-muted-foreground mt-1">Order #{completedOrder.orderId}</p>
                  <p className="text-xs text-muted-foreground">Ref: {completedOrder.reference}</p>
                </div>

                <div className="text-left space-y-2 bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm">Order Summary</h3>
                  {completedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(completedOrder.total)}</span>
                  </div>
                </div>

                {fulfillment === 'delivery' && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-left">
                    <p className="text-sm font-medium text-primary">📍 Please confirm your delivery address on WhatsApp</p>
                    <p className="text-xs text-muted-foreground mt-1">{customerAddress}</p>
                  </div>
                )}

                <Button size="lg" className="w-full gap-2" onClick={() => window.open(completedOrder.whatsappUrl, '_blank')}>
                  <MessageCircle className="h-5 w-5" />
                  Confirm Order on WhatsApp
                </Button>

                <Link to="/menu">
                  <Button variant="outline" className="w-full gap-2 mt-2">
                    <ArrowLeft className="h-4 w-4" /> Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="font-serif text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground">Add some delicious dishes to get started!</p>
        <Link to="/menu">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold">Your Cart</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-primary font-medium">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">How do you want your order?</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={fulfillment} onValueChange={(v) => setFulfillment(v as any)} className="grid grid-cols-2 gap-3">
                  <Label htmlFor="delivery" className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${fulfillment === 'delivery' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                    <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                    <MapPin className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Delivery</span>
                  </Label>
                  <Label htmlFor="pickup" className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${fulfillment === 'pickup' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                    <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                    <Store className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Pickup</span>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+234..." />
                </div>
                {fulfillment === 'delivery' && (
                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input id="address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="123 Main St, Lagos" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
                <Button className="mt-4 w-full" size="lg" onClick={handleCheckout} disabled={paying}>
                  {paying ? 'Processing…' : `Pay ${formatPrice(total)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
