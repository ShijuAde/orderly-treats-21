import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MenuCard from '@/components/MenuCard';
import { useMenuItems } from '@/hooks/useMenuItems';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const { data: menuItems = [], isLoading } = useMenuItems();

  const categories = [...new Set(menuItems.map((item) => item.category))];

  const filtered = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-serif text-3xl font-bold">Our Menu</h1>
          <p className="mt-1 text-muted-foreground">Choose from our delicious selection</p>
        </motion.div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search dishes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeCategory === 'All' ? 'default' : 'outline'} onClick={() => setActiveCategory('All')}>All</Button>
            {categories.map((cat) => (
              <Button key={cat} size="sm" variant={activeCategory === cat ? 'default' : 'outline'} onClick={() => setActiveCategory(cat)}>{cat}</Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading menu…</div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item, i) => (
                <MenuCard key={item.id} item={item} index={i} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">No dishes found. Try a different search or category.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
