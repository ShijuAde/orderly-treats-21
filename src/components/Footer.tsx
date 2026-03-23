import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t bg-card py-8">
    <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
      <div className="flex items-center gap-2">
        <span className="text-lg">🍽️</span>
        <span className="font-serif font-semibold text-foreground">Bellefood</span>
      </div>
      <nav className="flex gap-4">
        <Link to="/menu" className="hover:text-foreground transition-colors">Menu</Link>
        <Link to="/orders" className="hover:text-foreground transition-colors">Orders</Link>
        <Link to="/reviews" className="hover:text-foreground transition-colors">Reviews</Link>
        <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
      </nav>
      <p>© {new Date().getFullYear()} Bellefood. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
