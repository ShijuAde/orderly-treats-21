import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, MapPin, Store } from 'lucide-react';
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

const RESTAURANT_WHATSAPP = '2347089989283';

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotal, addOrder } = useCartStore();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [paying, setPaying] = useState(false);

  const total = getTotal();

  const buildWhatsAppMessage = (orderId: string) => {
    const itemsList = items
      .map((i) => `• ${i.name} × ${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}`)
      .join('\n');

    const type = fulfillment === 'delivery' ? '🚗 Delivery' : '🏪 Pickup';

    let msg = `✅ *Order Confirmed!*\n\nOrder: ${orderId}\nName: ${customerName}\nPhone: ${customerPhone}\nType: ${type}\n\n${itemsList}\n\n*Total: ₦${total.toLocaleString()}*\n\n`;

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

    setPaying(true);

    payWithPaystack({
      email: customerEmail,
      amount: total * 100, // kobo
      onSuccess: (reference) => {
        const orderId = generateOrderId();

        const order = {
          id: orderId,
          items: [...items],
          total,
          status: 'pending' as const,
          date: new Date().toISOString(),
          customerName,
          customerPhone,
          customerAddress: fulfillment === 'delivery' ? customerAddress : 'Pickup',
        };

        addOrder(order);
        clearCart();

        toast({ title: '🎉 Payment successful!', description: `Ref: ${reference}` });

        // Redirect to WhatsApp
        const message = buildWhatsAppMessage(orderId);
        const whatsappUrl = `https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        setPaying(false);
      },
      onClose: () => {
        setPaying(false);
        toast({ title: 'Payment cancelled', description: 'You can try again when ready.' });
      },
    });
  };

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
          {/* Items */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-primary font-medium">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Summary & checkout */}
          <div className="space-y-4">
            {/* Fulfillment type */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">How do you want your order?</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={fulfillment}
                  onValueChange={(v) => setFulfillment(v as 'delivery' | 'pickup')}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="delivery"
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      fulfillment === 'delivery' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                    <MapPin className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Delivery</span>
                  </Label>
                  <Label
                    htmlFor="pickup"
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      fulfillment === 'pickup' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                    <Store className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Pickup</span>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customer details */}
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

            {/* Order summary */}
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
