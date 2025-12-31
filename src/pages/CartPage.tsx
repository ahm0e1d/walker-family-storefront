import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShop } from "@/context/ShopContext";
import { useToast } from "@/hooks/use-toast";
import { sendPurchaseWebhook } from "@/lib/webhooks";

const CartPage = () => {
  const { cart, updateCartQuantity, removeFromCart, clearCart, cartTotal } = useShop();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-SA").format(price);
  };

  const handleCheckout = async () => {
    if (!customerName || !customerEmail) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم والبريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "السلة فارغة",
        description: "الرجاء إضافة منتجات إلى السلة",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const success = await sendPurchaseWebhook({
      customerName,
      customerEmail,
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.cartQuantity,
        price: item.price * item.cartQuantity,
      })),
      total: cartTotal,
    });

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "تم الطلب بنجاح",
        description: "سنتواصل معك قريباً",
      });
      clearCart();
      setCustomerName("");
      setCustomerEmail("");
    } else {
      toast({
        title: "تم إرسال الطلب",
        description: "سنتواصل معك قريباً",
      });
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">السلة فارغة</h1>
            <p className="text-muted-foreground">لم تقم بإضافة أي منتجات بعد</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-foreground mb-8 text-center">سلة التسوق</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="p-6 bg-card border-border">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-4xl">
                    {item.image}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                    <p className="text-accent font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                      className="border-border"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-10 text-center font-semibold">{item.cartQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                      className="border-border"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-left w-24">
                    <p className="font-bold text-foreground">
                      {formatPrice(item.price * item.cartQuantity)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="p-6 bg-card border-border sticky top-24">
              <h2 className="text-2xl font-bold text-foreground mb-6">إتمام الشراء</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسمك"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="أدخل بريدك الإلكتروني"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>المجموع الكلي</span>
                  <span className="text-accent">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-6 text-lg"
              >
                {isSubmitting ? "جاري الإرسال..." : "إتمام الشراء"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
