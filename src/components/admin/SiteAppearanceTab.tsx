import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GripVertical, Save, Palette, Sparkles } from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface SectionItem {
  id: string;
  name: string;
  icon: string;
}

const SECTIONS: SectionItem[] = [
  { id: "hero", name: "القسم الرئيسي", icon: "🏠" },
  { id: "register", name: "قسم التسجيل", icon: "📝" },
  { id: "products", name: "قسم المنتجات", icon: "🛍️" },
];

const TRANSITIONS = [
  { id: "slide", name: "انزلاق", description: "انتقال انزلاقي سلس" },
  { id: "fade", name: "تلاشي", description: "ظهور وإخفاء تدريجي" },
  { id: "scale", name: "تكبير", description: "تكبير وتصغير" },
  { id: "flip", name: "قلب", description: "تأثير قلب ثلاثي الأبعاد" },
  { id: "slide-up", name: "انزلاق للأعلى", description: "انزلاق من الأسفل للأعلى" },
  { id: "zoom", name: "تقريب", description: "تأثير تقريب مع تلاشي" },
  { id: "rotate", name: "دوران", description: "دوران مع ظهور" },
];

interface SiteAppearanceTabProps {
  adminEmail?: string;
}

const SiteAppearanceTab = ({ adminEmail }: SiteAppearanceTabProps) => {
  const [sectionOrder, setSectionOrder] = useState<string[]>(["hero", "register", "products"]);
  const [transitionType, setTransitionType] = useState("slide");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        data.forEach((setting: { key: string; value: unknown }) => {
          if (setting.key === "section_order" && Array.isArray(setting.value)) {
            setSectionOrder(setting.value as string[]);
          }
          if (setting.key === "transition_type" && typeof setting.value === "string") {
            setTransitionType(setting.value);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save section order
      await supabase.functions.invoke("manage-site-settings", {
        body: { 
          action: "update", 
          key: "section_order", 
          value: sectionOrder,
          admin_email: adminEmail
        }
      });

      // Save transition type
      await supabase.functions.invoke("manage-site-settings", {
        body: { 
          action: "update", 
          key: "transition_type", 
          value: transitionType,
          admin_email: adminEmail
        }
      });

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات المظهر بنجاح"
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const orderedSections = sectionOrder.map(id => 
    SECTIONS.find(s => s.id === id) || { id, name: id, icon: "📄" }
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Order */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            ترتيب الأقسام
          </CardTitle>
          <CardDescription>
            اسحب وأفلت لتغيير ترتيب الأقسام في الصفحة الرئيسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Reorder.Group 
            axis="y" 
            values={sectionOrder} 
            onReorder={setSectionOrder}
            className="space-y-2"
          >
            {orderedSections.map((section) => (
              <Reorder.Item
                key={section.id}
                value={section.id}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </CardContent>
      </Card>

      {/* Transition Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            نوع الانتقالات
          </CardTitle>
          <CardDescription>
            اختر تأثير الانتقال بين الأقسام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>نوع الانتقال</Label>
            <Select value={transitionType} onValueChange={setTransitionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">معاينة التأثير:</p>
            <motion.div
              key={transitionType}
              initial={getInitialAnimation(transitionType)}
              animate={getAnimateAnimation(transitionType)}
              transition={{ duration: 0.5 }}
              className="w-full h-20 bg-primary/20 rounded-lg flex items-center justify-center"
            >
              <span className="text-primary font-medium">معاينة الانتقال</span>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin ml-2" />
        ) : (
          <Save className="w-4 h-4 ml-2" />
        )}
        حفظ الإعدادات
      </Button>
    </div>
  );
};

function getInitialAnimation(type: string) {
  switch (type) {
    case "slide": return { x: -50, opacity: 0 };
    case "fade": return { opacity: 0 };
    case "scale": return { scale: 0.8, opacity: 0 };
    case "flip": return { rotateY: -90, opacity: 0 };
    case "slide-up": return { y: 50, opacity: 0 };
    case "zoom": return { scale: 0.5, opacity: 0 };
    case "rotate": return { rotate: -10, opacity: 0 };
    default: return { opacity: 0 };
  }
}

function getAnimateAnimation(type: string) {
  switch (type) {
    case "slide": return { x: 0, opacity: 1 };
    case "fade": return { opacity: 1 };
    case "scale": return { scale: 1, opacity: 1 };
    case "flip": return { rotateY: 0, opacity: 1 };
    case "slide-up": return { y: 0, opacity: 1 };
    case "zoom": return { scale: 1, opacity: 1 };
    case "rotate": return { rotate: 0, opacity: 1 };
    default: return { opacity: 1 };
  }
}

export default SiteAppearanceTab;
