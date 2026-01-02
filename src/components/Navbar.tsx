import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Home, Package, MessageCircle, Settings, LogIn, LogOut } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const { cartItemsCount } = useShop();
  const { user, isAdmin, signOut } = useAuth();

  const links = [
    { path: "/", label: "الرئيسية", icon: Home },
    { path: "/products", label: "المنتجات", icon: Package },
    { path: "/cart", label: "السلة", icon: ShoppingCart, badge: cartItemsCount },
    { path: "/contact", label: "تواصل معنا", icon: MessageCircle },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gradient">Walker Family Shop</span>
          </Link>

          <div className="flex items-center gap-4">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      location.pathname === "/admin"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">الإدارة</span>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 ml-1" />
                  خروج
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === "/login"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`}
              >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">دخول المالك</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
