import { Loader2, Users, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useShop } from "@/context/ShopContext";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const { products, loading } = useShop();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            <span className="text-gradient">Walker Family Shop</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            مرحباً بكم في متجرنا العائلي - نوفر لكم أفضل المنتجات بأفضل الأسعار
          </p>
          
          {/* Owner & Team */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full border border-primary/20">
              <span className="text-muted-foreground">مالك المتجر:</span>
              <span className="font-bold text-primary text-lg">@w8jl</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>الطاقم:</span>
              <div className="flex gap-2">
                <span className="bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-medium">@s_h0.</span>
                <span className="bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-medium">@3.bb3</span>
              </div>
            </div>
          </div>
          
          {/* Discord Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://discord.gg/xVntJmJZ2f" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Users className="w-6 h-6" />
                انضم لسيرفر العائلة
              </Button>
            </a>
            <a 
              href="https://lovable.dev/invite/2YU4PM3" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <ShoppingBag className="w-6 h-6" />
                سيرفر المتجر
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            منتجاتنا
          </h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
