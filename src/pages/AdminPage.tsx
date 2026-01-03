import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, Trash2, Edit2, LogOut, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";

const AdminPage = () => {
  const { products, loading: productsLoading, updateProduct, addProduct, deleteProduct } = useShop();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    image: "",
    rating: "5",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    navigate("/");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      quantity: "",
      image: "",
      rating: "5",
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      image: product.image,
      rating: product.rating.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleGenerateImage = async () => {
    if (!formData.name) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم المنتج أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: {
          productName: formData.name,
          productDescription: formData.description,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setFormData({ ...formData, image: data.imageUrl });
        toast({
          title: "تم التوليد",
          description: "تم توليد صورة المنتج بنجاح",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "خطأ",
        description: "فشل في توليد الصورة. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.quantity) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      quantity: parseInt(formData.quantity),
      image: formData.image || "📦",
      rating: parseInt(formData.rating) || 5,
    };

    try {
      if (editingProduct) {
        await updateProduct({ ...productData, id: editingProduct.id });
        toast({ title: "تم التحديث", description: "تم تحديث المنتج بنجاح" });
      } else {
        await addProduct(productData);
        toast({ title: "تم الإضافة", description: "تم إضافة المنتج بنجاح" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ. تأكد من أن لديك صلاحيات الإدارة.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح" });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف. تأكد من أن لديك صلاحيات الإدارة.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-SA").format(price);
  };

  if (authLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="p-8 text-center max-w-md">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground mb-2">غير مصرح</h1>
          <p className="text-muted-foreground mb-6">
            ليس لديك صلاحيات الوصول إلى لوحة التحكم. تواصل مع المالك لمنحك صلاحيات الإدارة.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/")} variant="outline">
              العودة للرئيسية
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1">مرحباً بك، {user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة منتج
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>اسم المنتج</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل اسم المنتج"
                      className="bg-input border-border"
                    />
                  </div>
                  <div>
                    <Label>الوصف</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف المنتج"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>السعر</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0"
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>صورة المنتج (رابط أو إيموجي)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="📦 أو رابط صورة"
                          className="bg-input border-border flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !formData.name}
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          {isGeneratingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {formData.image.startsWith('http') && (
                        <div className="mt-2">
                          <img 
                            src={formData.image} 
                            alt="معاينة" 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>التقييم (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5 ml-2" />
                    )}
                    {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-6 bg-card border-border">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                  {product.image.startsWith('http') ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{product.image}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
                  <p className="text-muted-foreground text-sm">{product.description}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="font-bold text-accent">{formatPrice(product.price)}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-sm text-muted-foreground">الكمية</p>
                  <p className="font-bold text-foreground">{product.quantity}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(product)}
                    className="border-border hover:bg-primary hover:text-primary-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
