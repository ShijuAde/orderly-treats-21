import { useParams } from 'react-router-dom';
import { useBrandBySlug } from '@/hooks/useBrand';
import RestaurantNotFound from './RestaurantNotFound';
import RestaurantLandingPage from './RestaurantLandingPage';

const BrandMenuPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: brand, isLoading } = useBrandBySlug(slug);

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!brand) {
    return <RestaurantNotFound />;
  }

  return <RestaurantLandingPage brand={brand as any} />;
};

export default BrandMenuPage;
