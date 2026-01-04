import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, Trash2, Edit2, LogOut, Loader2, ShieldAlert, Sparkles, Users, Check, X, RefreshCw, Package, ShoppingBag, CheckCircle, UserCheck, UserX, ScrollText, Shield, Ban, UserPlus, Palette, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import SiteAppearanceTab from "@/components/admin/SiteAppearanceTab";
import AnnouncementsTab from "@/components/admin/AnnouncementsTab";

interface PendingUser {
  id: string;
  email: string;
  discord_username: string;
  created_at: string;
  status: string;
  deactivation_reason?: string;
  deactivated_by_email?: string;
  deactivated_by_discord?: string;
}

interface ApprovedUser {
  id: string;
  email: string;
  discord_username: string;
  created_at: string;
  approved_by_email?: string;
  approved_by_discord?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  account_name: string;
  character_name: string;
  discord_username: string;
  game_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

interface RuleCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface Rule {
  id: string;
  category_id: string;
  content: string;
  sort_order: number;
}

const AdminPage = () => {
  const { products, loading: productsLoading, updateProduct, addProduct, deleteProduct } = useShop();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Pending users state
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [completingOrder, setCompletingOrder] = useState<string | null>(null);

  // Approved users state
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [approvedUsersLoading, setApprovedUsersLoading] = useState(true);

  // Deactivated users state
  const [deactivatedUsers, setDeactivatedUsers] = useState<PendingUser[]>([]);
  const [deactivatedLoading, setDeactivatedLoading] = useState(true);
  const [reactivatingUser, setReactivatingUser] = useState<string | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<string | null>(null);

  // Rules state
  const [ruleCategories, setRuleCategories] = useState<RuleCategory[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [ruleContent, setRuleContent] = useState("");
  const [editingCategory, setEditingCategory] = useState<RuleCategory | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingRule, setSavingRule] = useState(false);

  // Admins state
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [managingAdmin, setManagingAdmin] = useState<string | null>(null);

  // Deactivation with reason
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");

  // Remove admin with reason
  const [isRemoveAdminDialogOpen, setIsRemoveAdminDialogOpen] = useState(false);
  const [removeAdminUserId, setRemoveAdminUserId] = useState<string | null>(null);
  const [removeAdminReason, setRemoveAdminReason] = useState("");

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

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
      fetchOrders();
      fetchApprovedUsers();
      fetchRulesData();
      fetchAdmins();
      fetchDeactivatedUsers();
    }
  }, [isAdmin]);

  const fetchDeactivatedUsers = async () => {
    setDeactivatedLoading(true);
    try {
      const { data, error } = await supabase
        .from("pending_users")
        .select("*")
        .eq("status", "rejected")
        .not("deactivation_reason", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeactivatedUsers(data || []);
    } catch (error) {
      console.error("Error fetching deactivated users:", error);
    } finally {
      setDeactivatedLoading(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setReactivatingUser(userId);
    try {
      const { error } = await supabase
        .from("pending_users")
        .update({ status: "pending", deactivation_reason: null })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "تم!",
        description: "تم إزالة المستخدم من القائمة السوداء وإعادته للطلبات المعلقة",
      });

      setDeactivatedUsers(prev => prev.filter(u => u.id !== userId));
      fetchPendingUsers();
    } catch (error) {
      console.error("Reactivate error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة التفعيل",
        variant: "destructive",
      });
    } finally {
      setReactivatingUser(null);
    }
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .is("removed_at", null);

      if (error) throw error;
      setAdminUserIds((data || []).map(r => r.user_id));
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchRulesData = async () => {
    setRulesLoading(true);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("rule_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setRuleCategories(categoriesData || []);

      const { data: rulesData, error: rulesError } = await supabase
        .from("rules")
        .select("*")
        .order("sort_order", { ascending: true });

      if (rulesError) throw rulesError;
      setRules(rulesData || []);
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setRulesLoading(false);
    }
  };

  const fetchApprovedUsers = async () => {
    setApprovedUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("approved_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApprovedUsers(data || []);
    } catch (error) {
      console.error("Error fetching approved users:", error);
    } finally {
      setApprovedUsersLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingLoading(true);
    try {
      const { data, error } = await supabase
        .from("pending_users")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const transformedOrders = (data || []).map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[]
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setCompletingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("complete-order", {
        body: { order_id: orderId },
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
        title: "تم!",
        description: "تم تسليم الطلب بنجاح",
      });

      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسليم الطلب",
        variant: "destructive",
      });
    } finally {
      setCompletingOrder(null);
    }
  };

  const handleUserAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId);
    try {
      // Get current admin info
      const currentAdminUser = approvedUsers.find(u => u.id === user?.id);
      
      const { data, error } = await supabase.functions.invoke("approve-user", {
        body: {
          pending_user_id: userId,
          action,
          admin_email: user?.email,
          admin_discord: currentAdminUser?.discord_username
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
        title: "تم!",
        description: data.message,
      });

      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Action error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تنفيذ العملية",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openDeactivateDialog = (userId: string) => {
    setDeactivateUserId(userId);
    setDeactivateReason("");
    setIsDeactivateDialogOpen(true);
  };

  const handleDeactivateUser = async () => {
    if (!deactivateUserId || !deactivateReason.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال سبب إلغاء التفعيل",
        variant: "destructive",
      });
      return;
    }

    setDeactivatingUser(deactivateUserId);
    try {
      // Get current admin info
      const currentAdminUser = approvedUsers.find(u => u.id === user?.id);
      
      const { data, error } = await supabase.functions.invoke("deactivate-user", {
        body: { 
          user_id: deactivateUserId, 
          reason: deactivateReason,
          admin_email: user?.email,
          admin_discord: currentAdminUser?.discord_username
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
        title: "تم!",
        description: data.message,
      });

      setApprovedUsers(prev => prev.filter(u => u.id !== deactivateUserId));
      setAdminUserIds(prev => prev.filter(id => id !== deactivateUserId));
      setIsDeactivateDialogOpen(false);
      setDeactivateUserId(null);
      setDeactivateReason("");
    } catch (error) {
      console.error("Deactivate error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء التفعيل",
        variant: "destructive",
      });
    } finally {
      setDeactivatingUser(null);
    }
  };

  // Admin management functions
  const openRemoveAdminDialog = (userId: string) => {
    setRemoveAdminUserId(userId);
    setRemoveAdminReason("");
    setIsRemoveAdminDialogOpen(true);
  };

  const handleManageAdmin = async (userId: string, action: "add" | "remove", reason?: string) => {
    setManagingAdmin(userId);
    try {
      // Get current admin info
      const currentAdminUser = approvedUsers.find(u => u.id === user?.id);
      
      const { data, error } = await supabase.functions.invoke("manage-admin", {
        body: { 
          approved_user_id: userId, 
          action,
          admin_email: user?.email,
          admin_discord: currentAdminUser?.discord_username,
          removal_reason: reason
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
        title: "تم!",
        description: data.message,
      });

      fetchAdmins();
    } catch (error) {
      console.error("Manage admin error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تنفيذ العملية",
        variant: "destructive",
      });
    } finally {
      setManagingAdmin(null);
    }
  };

  // Rules management functions
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الفئة",
        variant: "destructive",
      });
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("rule_categories")
          .update({ name: categoryName })
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast({ title: "تم!", description: "تم تحديث الفئة بنجاح" });
      } else {
        const maxOrder = Math.max(0, ...ruleCategories.map(c => c.sort_order));
        const { error } = await supabase
          .from("rule_categories")
          .insert({ name: categoryName, sort_order: maxOrder + 1 });
        if (error) throw error;
        toast({ title: "تم!", description: "تم إضافة الفئة بنجاح" });
      }
      setIsCategoryDialogOpen(false);
      setCategoryName("");
      setEditingCategory(null);
      fetchRulesData();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from("rule_categories")
        .delete()
        .eq("id", categoryId);
      if (error) throw error;
      toast({ title: "تم!", description: "تم حذف الفئة بنجاح" });
      fetchRulesData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    }
  };

  const handleSaveRule = async () => {
    if (!ruleContent.trim() || !selectedCategory) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال محتوى القانون واختيار الفئة",
        variant: "destructive",
      });
      return;
    }

    setSavingRule(true);
    try {
      if (editingRule) {
        const { error } = await supabase
          .from("rules")
          .update({ content: ruleContent, category_id: selectedCategory })
          .eq("id", editingRule.id);
        if (error) throw error;
        toast({ title: "تم!", description: "تم تحديث القانون بنجاح" });
      } else {
        const categoryRules = rules.filter(r => r.category_id === selectedCategory);
        const maxOrder = Math.max(0, ...categoryRules.map(r => r.sort_order));
        const { error } = await supabase
          .from("rules")
          .insert({ content: ruleContent, category_id: selectedCategory, sort_order: maxOrder + 1 });
        if (error) throw error;
        toast({ title: "تم!", description: "تم إضافة القانون بنجاح" });
      }
      setIsRuleDialogOpen(false);
      setRuleContent("");
      setEditingRule(null);
      fetchRulesData();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("rules")
        .delete()
        .eq("id", ruleId);
      if (error) throw error;
      toast({ title: "تم!", description: "تم حذف القانون بنجاح" });
      fetchRulesData();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    }
  };

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
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-5 h-5 ml-2" />
            تسجيل الخروج
          </Button>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-8">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              الطلبات
              {orders.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              التسجيلات
              {pendingUsers.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved-users" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              المفعلين
            </TabsTrigger>
            <TabsTrigger value="blacklist" className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              الموقوفين
              {deactivatedUsers.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {deactivatedUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الأدمنية
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <ScrollText className="w-4 h-4" />
              القوانين
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              المظهر
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              الإعلانات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-end mb-6">
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
          </TabsContent>

          <TabsContent value="orders">
            <div className="flex justify-end mb-6">
              <Button onClick={fetchOrders} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ml-2 ${ordersLoading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  لا توجد طلبات معلقة
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            {order.order_number}
                          </Badge>
                          <span className="text-muted-foreground text-sm font-normal">
                            {order.discord_username}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground font-normal">
                          {new Date(order.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">اسم الحساب:</span>
                          <p className="font-medium">{order.account_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">اسم الشخصية:</span>
                          <p className="font-medium">{order.character_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الديسكورد:</span>
                          <p className="font-medium">{order.discord_username}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الايدي:</span>
                          <p className="font-medium">{order.game_id}</p>
                        </div>
                      </div>

                      <div className="border-t border-border pt-3 mb-4">
                        <h4 className="font-medium mb-2 text-sm">المنتجات:</h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-accent">{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                          <span>المجموع</span>
                          <span className="text-accent">{order.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={completingOrder === order.id}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {completingOrder === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 ml-2" />
                        )}
                        تم التسليم
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="flex justify-end mb-6">
              <Button onClick={fetchPendingUsers} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ml-2 ${pendingLoading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            {pendingLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  لا توجد طلبات معلقة
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <Card key={user.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{user.discord_username}</span>
                        <span className="text-sm text-muted-foreground font-normal">
                          {new Date(user.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUserAction(user.id, "approve")}
                            disabled={actionLoading === user.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 ml-1" />
                                قبول
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserAction(user.id, "reject")}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 ml-1" />
                                رفض
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved-users">
            <div className="flex justify-end mb-6">
              <Button onClick={fetchApprovedUsers} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ml-2 ${approvedUsersLoading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            {approvedUsersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : approvedUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  لا يوجد مستخدمين مفعلين
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approvedUsers.map((approvedUser) => (
                  <Card key={approvedUser.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{approvedUser.discord_username}</span>
                        <span className="text-sm text-muted-foreground font-normal">
                          {new Date(approvedUser.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground">{approvedUser.email}</p>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeactivateDialog(approvedUser.id)}
                            disabled={deactivatingUser === approvedUser.id}
                          >
                            {deactivatingUser === approvedUser.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserX className="w-4 h-4 ml-1" />
                                إلغاء التفعيل
                              </>
                            )}
                          </Button>
                        </div>
                        {(approvedUser.approved_by_discord || approvedUser.approved_by_email) && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">تم التفعيل بواسطة:</span>{" "}
                              {approvedUser.approved_by_discord || approvedUser.approved_by_email}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deactivation Reason Dialog */}
          <Dialog open={isDeactivateDialogOpen} onOpenChange={(open) => {
            setIsDeactivateDialogOpen(open);
            if (!open) {
              setDeactivateUserId(null);
              setDeactivateReason("");
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>سبب إلغاء التفعيل</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>السبب</Label>
                  <Input
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="أدخل سبب إلغاء التفعيل"
                  />
                </div>
                <Button 
                  onClick={handleDeactivateUser} 
                  disabled={deactivatingUser !== null || !deactivateReason.trim()} 
                  variant="destructive"
                  className="w-full"
                >
                  {deactivatingUser ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <UserX className="w-4 h-4 ml-2" />
                  )}
                  تأكيد إلغاء التفعيل
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Blacklist Tab */}
          <TabsContent value="blacklist">
            <div className="flex justify-end mb-6">
              <Button onClick={fetchDeactivatedUsers} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ml-2 ${deactivatedLoading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            {deactivatedLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : deactivatedUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Ban className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  لا يوجد مستخدمين موقوفين
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {deactivatedUsers.map((deactivatedUser) => (
                  <Card key={deactivatedUser.id} className="border-destructive/30 bg-destructive/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ban className="w-5 h-5 text-destructive" />
                          <span>{deactivatedUser.discord_username}</span>
                        </div>
                        <span className="text-sm text-muted-foreground font-normal">
                          {new Date(deactivatedUser.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-muted-foreground">{deactivatedUser.email}</p>
                        {deactivatedUser.deactivation_reason && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <p className="text-sm font-medium text-destructive mb-1">سبب الإيقاف:</p>
                            <p className="text-sm text-foreground">{deactivatedUser.deactivation_reason}</p>
                          </div>
                        )}
                        {(deactivatedUser.deactivated_by_discord || deactivatedUser.deactivated_by_email) && (
                          <div className="bg-muted/50 border border-border rounded-lg p-3">
                            <p className="text-sm font-medium text-muted-foreground mb-1">تم بواسطة:</p>
                            <p className="text-sm text-foreground">
                              {deactivatedUser.deactivated_by_discord || deactivatedUser.deactivated_by_email}
                            </p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleReactivateUser(deactivatedUser.id)}
                          disabled={reactivatingUser === deactivatedUser.id}
                        >
                          {reactivatingUser === deactivatedUser.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 ml-1" />
                              إزالة من القائمة السوداء
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="admins">
            <div className="flex justify-end mb-6">
              <Button onClick={() => { fetchAdmins(); fetchApprovedUsers(); }} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ml-2 ${adminsLoading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Admins */}
              <div>
                <h2 className="text-xl font-bold mb-4">الأدمنية الحاليين</h2>
                {adminsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : adminUserIds.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      لا يوجد أدمنية
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {approvedUsers
                      .filter(u => adminUserIds.includes(u.id))
                      .map((adminUser) => (
                        <Card key={adminUser.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{adminUser.discord_username}</p>
                              <p className="text-sm text-muted-foreground">{adminUser.email}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRemoveAdminDialog(adminUser.id)}
                              disabled={managingAdmin === adminUser.id}
                            >
                              {managingAdmin === adminUser.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-4 h-4 ml-1" />
                                  إزالة
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              {/* Add Admin from Approved Users */}
              <div>
                <h2 className="text-xl font-bold mb-4">إضافة أدمن جديد</h2>
                {approvedUsersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : approvedUsers.filter(u => !adminUserIds.includes(u.id)).length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      لا يوجد مستخدمين متاحين للترقية
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {approvedUsers
                      .filter(u => !adminUserIds.includes(u.id))
                      .map((normalUser) => (
                        <Card key={normalUser.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{normalUser.discord_username}</p>
                              <p className="text-sm text-muted-foreground">{normalUser.email}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleManageAdmin(normalUser.id, "add")}
                              disabled={managingAdmin === normalUser.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {managingAdmin === normalUser.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 ml-1" />
                                  ترقية لأدمن
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Remove Admin Dialog */}
            <Dialog open={isRemoveAdminDialogOpen} onOpenChange={(open) => {
              setIsRemoveAdminDialogOpen(open);
              if (!open) {
                setRemoveAdminUserId(null);
                setRemoveAdminReason("");
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>سحب صلاحية الأدمن</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>سبب سحب الأدمنية *</Label>
                    <Input
                      value={removeAdminReason}
                      onChange={(e) => setRemoveAdminReason(e.target.value)}
                      placeholder="أدخل سبب سحب صلاحية الأدمن"
                      className="mt-2"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!removeAdminReason.trim()) {
                        toast({
                          title: "خطأ",
                          description: "الرجاء إدخال سبب سحب الأدمنية",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (removeAdminUserId) {
                        await handleManageAdmin(removeAdminUserId, "remove", removeAdminReason);
                        setIsRemoveAdminDialogOpen(false);
                        setRemoveAdminUserId(null);
                        setRemoveAdminReason("");
                      }
                    }}
                    disabled={managingAdmin === removeAdminUserId}
                    className="w-full"
                  >
                    {managingAdmin === removeAdminUserId ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <X className="w-4 h-4 ml-2" />
                    )}
                    تأكيد سحب الأدمنية
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="rules">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Categories Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">الفئات</h2>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
                    setIsCategoryDialogOpen(open);
                    if (!open) {
                      setCategoryName("");
                      setEditingCategory(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة فئة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>اسم الفئة</Label>
                          <Input
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="مثال: قوانين عامة"
                          />
                        </div>
                        <Button onClick={handleSaveCategory} disabled={savingCategory} className="w-full">
                          {savingCategory ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                          {editingCategory ? "حفظ التعديلات" : "إضافة"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {rulesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : ruleCategories.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      لا توجد فئات
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {ruleCategories.map((category) => (
                      <Card 
                        key={category.id} 
                        className={`cursor-pointer transition-colors ${selectedCategory === category.id ? "border-primary bg-primary/5" : ""}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <span className="font-medium">{category.name}</span>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setCategoryName(category.name);
                                setIsCategoryDialogOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Rules Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">القوانين</h2>
                  <Dialog open={isRuleDialogOpen} onOpenChange={(open) => {
                    setIsRuleDialogOpen(open);
                    if (!open) {
                      setRuleContent("");
                      setEditingRule(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!selectedCategory}>
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة قانون
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRule ? "تعديل القانون" : "إضافة قانون جديد"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>محتوى القانون</Label>
                          <Input
                            value={ruleContent}
                            onChange={(e) => setRuleContent(e.target.value)}
                            placeholder="أدخل نص القانون"
                          />
                        </div>
                        <Button onClick={handleSaveRule} disabled={savingRule} className="w-full">
                          {savingRule ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                          {editingRule ? "حفظ التعديلات" : "إضافة"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {!selectedCategory ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      اختر فئة لعرض القوانين
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {rules.filter(r => r.category_id === selectedCategory).length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          لا توجد قوانين في هذه الفئة
                        </CardContent>
                      </Card>
                    ) : (
                      rules
                        .filter(r => r.category_id === selectedCategory)
                        .map((rule, index) => (
                          <Card key={rule.id}>
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-primary font-bold">{index + 1}.</span>
                                <span>{rule.content}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingRule(rule);
                                    setRuleContent(rule.content);
                                    setIsRuleDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Site Appearance Tab */}
          <TabsContent value="appearance">
            <SiteAppearanceTab adminEmail={user?.email} />
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <AnnouncementsTab adminEmail={user?.email} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
