import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MenuItem, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

interface MenuCardProps {
  item: MenuItem;
  index: number;
}

const MenuCard = ({ item, index }: MenuCardProps) => {
  const { addItem, items, updateQuantity, removeItem } = useCartStore();
  const cartItem = items.find((i) => i.id === item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative h-48 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
            {item.category}
          </span>
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif text-lg font-semibold">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
            {cartItem ? (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{cartItem.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => addItem(item)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => addItem(item)} className="gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MenuCard;
