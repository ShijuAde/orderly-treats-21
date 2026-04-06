import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const OrdersPage = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading…</div>;

  // Redirect to account page where orders are shown, or to auth if not logged in
  return <Navigate to={user ? '/account' : '/auth'} replace />;
};

export default OrdersPage;
