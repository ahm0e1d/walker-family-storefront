import { useState } from "react";
import { Loader2, Users, ShoppingBag, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useShop } from "@/context/ShopContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const { products, loading } = useShop();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (!discordUsername.startsWith("@")) {
      toast({
        title: "خطأ",
        description: "يوزر Discord يجب أن يبدأ بـ @",
        variant: "destructive",
      });
      return;
    }

    setRegisterLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-user", {
        body: {
          email,
          password,
          discord_username: discordUsername,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "خطأ",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم التسجيل بنجاح!",
        description: "انتظر تفعيل حسابك من المالك",
      });

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDiscordUsername("");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التسجيل",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

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
              href="https://discord.gg/BuymXGjbdU" 
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
              href="https://discord.gg/xVntJmJZ2f" 
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

      {/* Registration Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="border-primary/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
                <CardDescription>
                  أنشئ حسابك وانتظر تفعيله من المالك
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord">يوزر Discord</Label>
                    <Input
                      id="discord"
                      type="text"
                      placeholder="@username"
                      value={discordUsername}
                      onChange={(e) => setDiscordUsername(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={registerLoading}>
                    {registerLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 ml-2" />
                    )}
                    إنشاء حساب
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    لديك حساب؟{" "}
                    <Link to="/auth" className="text-primary hover:underline">
                      تسجيل الدخول
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
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
