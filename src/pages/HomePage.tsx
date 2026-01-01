import { Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useShop } from "@/context/ShopContext";

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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            مرحباً بكم في متجرنا العائلي - نوفر لكم أفضل المنتجات بأفضل الأسعار
          </p>
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
