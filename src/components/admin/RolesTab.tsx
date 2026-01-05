import { useState, useEffect } from "react";
import { Plus, Save, Trash2, Edit2, Loader2, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
  created_at: string;
  created_by?: string;
}

interface RolesTabProps {
  adminEmail?: string;
}

const ADMIN_SECTIONS = [
  { id: "products", name: "المنتجات", icon: "📦" },
  { id: "orders", name: "الطلبات", icon: "🛒" },
  { id: "users", name: "التسجيلات", icon: "👤" },
  { id: "approved-users", name: "المفعلين", icon: "✅" },
  { id: "blacklist", name: "الموقوفين", icon: "🚫" },
  { id: "admins", name: "الأدمنية", icon: "🛡️" },
  { id: "rules", name: "القوانين", icon: "📜" },
  { id: "appearance", name: "المظهر", icon: "🎨" },
  { id: "announcements", name: "الإعلانات", icon: "🔔" },
  { id: "roles", name: "الرولات", icon: "👑" },
  { id: "credentials", name: "كلمات السر", icon: "🔑" },
];

const RolesTab = ({ adminEmail }: RolesTabProps) => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const transformedRoles = (data || []).map(role => ({
        ...role,
        permissions: Array.isArray(role.permissions) ? role.permissions as string[] : []
      }));
      
      setRoles(transformedRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الرولات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الرول",
        variant: "destructive",
      });
      return;
    }

    if (selectedPermissions.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار صلاحية واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        const { error } = await supabase
          .from("custom_roles")
          .update({ 
            name: roleName, 
            permissions: selectedPermissions 
          })
          .eq("id", editingRole.id);
        
        if (error) throw error;
        toast({ title: "تم!", description: "تم تحديث الرول بنجاح" });
      } else {
        const { error } = await supabase
          .from("custom_roles")
          .insert({ 
            name: roleName, 
            permissions: selectedPermissions,
            created_by: adminEmail 
          });
        
        if (error) throw error;
        toast({ title: "تم!", description: "تم إضافة الرول بنجاح" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "خطأ",
        description: error.message?.includes("duplicate") ? "اسم الرول موجود مسبقاً" : "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
      toast({ title: "تم!", description: "تم حذف الرول بنجاح" });
      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setRoleName("");
    setSelectedPermissions([]);
    setEditingRole(null);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80">
              <Plus className="w-5 h-5 ml-2" />
              إضافة رول
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? "تعديل الرول" : "إضافة رول جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div>
                <Label>اسم الرول</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="مثال: بائع"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-lg font-semibold mb-4 block">الصلاحيات</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ADMIN_SECTIONS.map((section) => (
                    <Card 
                      key={section.id}
                      className={`cursor-pointer transition-all ${
                        selectedPermissions.includes(section.id) 
                          ? "border-primary bg-primary/10" 
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => togglePermission(section.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Checkbox 
                          checked={selectedPermissions.includes(section.id)}
                          onCheckedChange={() => togglePermission(section.id)}
                        />
                        <span className="text-xl">{section.icon}</span>
                        <span className="font-medium">{section.name}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                {editingRole ? "حفظ التعديلات" : "إضافة الرول"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            لا توجد رولات مخصصة
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {role.name}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(role)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm) => {
                    const section = ADMIN_SECTIONS.find(s => s.id === perm);
                    return (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {section?.icon} {section?.name || perm}
                      </Badge>
                    );
                  })}
                </div>
                {role.created_by && (
                  <p className="text-xs text-muted-foreground mt-3">
                    بواسطة: {role.created_by}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RolesTab;
