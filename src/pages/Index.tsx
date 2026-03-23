import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Truck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuCard from '@/components/MenuCard';
import { menuItems } from '@/data/menu';
import { useCartStore } from '@/store/cartStore';

const Index = () => {
  const reviews = useCartStore((s) => s.reviews);
  const featuredItems = menuItems.slice(0, 4);
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                🔥 Fresh & Delicious
              </span>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-tight md:text-6xl">
                Taste the soul of{' '}
                <span className="text-primary">Nigerian cuisine</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Order authentic, home-style meals from Bellefood. From jollof rice to suya,
                we deliver flavour straight to your door.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link to="/menu">
                  <Button size="lg" className="gap-2 text-base">
                    Explore Menu <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button size="lg" variant="outline" className="text-base">
                    Track Order
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-warm/10 blur-3xl" />
      </section>

      {/* Features */}
      <section className="border-b py-12">
        <div className="container mx-auto grid grid-cols-1 gap-6 px-4 sm:grid-cols-3">
          {[
            { icon: Clock, title: 'Quick Delivery', desc: '30–45 min delivery time' },
            { icon: Star, title: `${avgRating}★ Rated`, desc: `${reviews.length || '100+'}  happy customers` },
            { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₦5,000' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-sans font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured menu */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold">Popular Dishes</h2>
              <p className="mt-1 text-muted-foreground">Most loved by our customers</p>
            </div>
            <Link to="/menu">
              <Button variant="ghost" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredItems.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold">Ready to order?</h2>
          <p className="mx-auto mt-3 max-w-md opacity-90">
            Browse our full menu, add your favourites to cart, and checkout in seconds.
          </p>
          <Link to="/menu">
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 text-base font-semibold"
            >
              Order Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
