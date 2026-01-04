import { useState, useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { Loader2, Users, ShoppingBag, UserPlus, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useShop } from "@/context/ShopContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const HomePage = () => {
  const {
    products,
    loading
  } = useShop();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const {
    toast
  } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    scrollYProgress
  } = useScroll({
    container: containerRef
  });
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }
    if (!discordUsername.startsWith("@")) {
      toast({
        title: "خطأ",
        description: "يوزر Discord يجب أن يبدأ بـ @",
        variant: "destructive"
      });
      return;
    }
    setRegisterLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("register-user", {
        body: {
          email,
          password,
          discord_username: discordUsername
        }
      });
      if (error) throw error;
      if (data.error) {
        toast({
          title: "خطأ",
          description: data.error,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "تم التسجيل بنجاح!",
        description: "انتظر تفعيل حسابك من المالك"
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
        variant: "destructive"
      });
    } finally {
      setRegisterLoading(false);
    }
  };
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({
      behavior: "smooth"
    });
  };
  return <div ref={containerRef} className="h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory">
      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left" style={{
      scaleX: scrollYProgress
    }} />

      {/* Hero Section */}
      <section id="hero" className="min-h-screen snap-start flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        
        <motion.div initial={{
        opacity: 0,
        y: 50
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        ease: "easeOut"
      }} viewport={{
        once: true
      }} className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 initial={{
          opacity: 0,
          scale: 0.8
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} viewport={{
          once: true
        }} className="text-5xl md:text-7xl font-extrabold mb-6">
            <span className="text-gradient font-serif text-right">Walker Family Shop</span>
          </motion.h1>
          
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.4
        }} viewport={{
          once: true
        }} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6 font-mono">
            
مرحباً بكم في متجرنا العائلي - نوفر لكم أفضل المنتجات بأفضل الأسعار








          </motion.p>
          
          {/* Owner & Team */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.6
        }} viewport={{
          once: true
        }} className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full border border-primary/20">
              <span className="text-muted-foreground">مالك المتجر:</span>
              <span className="font-bold text-primary text-lg">@w8jl</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>شركاء:</span>
              <div className="flex gap-2">
                <span className="bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-medium">@s_h0.</span>
                <span className="bg-secondary px-3 py-1 rounded-full text-secondary-foreground font-medium">@3.bb3</span>
              </div>
            </div>
          </motion.div>
          
          {/* Discord Links */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.8
        }} viewport={{
          once: true
        }} className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-100 shadow-none">
            <a href="https://discord.gg/BuymXGjbdU" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Users className="w-6 h-6" />
                انضم لسيرفر العائلة
              </Button>
            </a>
            <a href="https://discord.gg/xVntJmJZ2f" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <ShoppingBag className="w-6 h-6" />
                سيرفر المتجر
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button onClick={() => scrollToSection("register")} initial={{
        opacity: 0
      }} animate={{
        opacity: 1,
        y: [0, 10, 0]
      }} transition={{
        opacity: {
          delay: 1.5,
          duration: 0.5
        },
        y: {
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut"
        }
      }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors">
          <ChevronDown className="w-10 h-10" />
        </motion.button>
      </section>

      {/* Registration Section */}
      <section id="register" className="min-h-screen snap-start flex items-center justify-center py-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        
        <motion.div initial={{
        opacity: 0,
        x: -100
      }} whileInView={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.8,
        ease: "easeOut"
      }} viewport={{
        once: true,
        margin: "-100px"
      }} className="container mx-auto px-4 relative z-10">
          <div className="max-w-md mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 50,
            rotateX: -15
          }} whileInView={{
            opacity: 1,
            y: 0,
            rotateX: 0
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }} viewport={{
            once: true
          }}>
              <Card className="border-primary/20 shadow-2xl backdrop-blur-sm bg-card/90">
                <CardHeader className="text-center">
                  <motion.div initial={{
                  scale: 0
                }} whileInView={{
                  scale: 1
                }} transition={{
                  duration: 0.5,
                  delay: 0.4,
                  type: "spring"
                }} viewport={{
                  once: true
                }}>
                    <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
                  </motion.div>
                  <CardDescription>
                    أنشئ حسابك وانتظر تفعيله من المالك
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} whileInView={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    duration: 0.4,
                    delay: 0.5
                  }} viewport={{
                    once: true
                  }} className="space-y-2">
                      <Label htmlFor="discord">يوزر Discord</Label>
                      <Input id="discord" type="text" placeholder="@username" value={discordUsername} onChange={e => setDiscordUsername(e.target.value)} required dir="ltr" />
                    </motion.div>
                    <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} whileInView={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    duration: 0.4,
                    delay: 0.6
                  }} viewport={{
                    once: true
                  }} className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
                    </motion.div>
                    <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} whileInView={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    duration: 0.4,
                    delay: 0.7
                  }} viewport={{
                    once: true
                  }} className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
                    </motion.div>
                    <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} whileInView={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    duration: 0.4,
                    delay: 0.8
                  }} viewport={{
                    once: true
                  }} className="space-y-2">
                      <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required dir="ltr" />
                    </motion.div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <motion.div initial={{
                    opacity: 0,
                    y: 20
                  }} whileInView={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    duration: 0.4,
                    delay: 0.9
                  }} viewport={{
                    once: true
                  }} className="w-full">
                      <Button type="submit" className="w-full" disabled={registerLoading}>
                        {registerLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <UserPlus className="w-4 h-4 ml-2" />}
                        إنشاء حساب
                      </Button>
                    </motion.div>
                    <p className="text-sm text-muted-foreground text-center">
                      لديك حساب؟{" "}
                      <Link to="/auth" className="text-primary hover:underline">
                        تسجيل الدخول
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.button onClick={() => scrollToSection("products")} initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} transition={{
        delay: 1
      }} viewport={{
        once: true
      }} animate={{
        y: [0, 10, 0]
      }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors">
          <ChevronDown className="w-10 h-10" />
        </motion.button>
      </section>

      {/* Products Section */}
      <section id="products" className="min-h-screen snap-start py-20 relative">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2 initial={{
          opacity: 0,
          y: -30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }} className="text-4xl font-bold text-foreground mb-12 text-center">
            <span className="text-gradient">منتجاتنا</span>
          </motion.h2>
          
          {loading ? <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => <motion.div key={product.id} initial={{
            opacity: 0,
            y: 50,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            y: 0,
            scale: 1
          }} transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: "easeOut"
          }} viewport={{
            once: true,
            margin: "-50px"
          }} whileHover={{
            y: -10,
            transition: {
              duration: 0.2
            }
          }}>
                  <ProductCard product={product} />
                </motion.div>)}
            </div>}
        </div>
      </section>
    </div>;
};
export default HomePage;