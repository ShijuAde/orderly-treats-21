import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

const RestaurantNotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
    <Store className="h-16 w-16 text-muted-foreground/40" />
    <h1 className="font-serif text-3xl font-bold">Restaurant Not Found</h1>
    <p className="text-muted-foreground max-w-md">
      The restaurant you're looking for doesn't exist or may have been removed.
    </p>
    <Link to="/auth">
      <Button>Go to Login</Button>
    </Link>
  </div>
);

export default RestaurantNotFound;
