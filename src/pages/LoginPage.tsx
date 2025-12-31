import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const { login, isOwnerLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (isOwnerLoggedIn) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(username.trim(), password);

    setIsLoading(false);

    if (success) {
      toast({
        title: "مرحباً بك",
        description: "تم تسجيل الدخول بنجاح",
      });
      navigate("/admin");
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-8 bg-card border-border animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">تسجيل دخول المالك</h1>
          <p className="text-muted-foreground">أدخل بيانات الدخول للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              اسم المستخدم
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              className="bg-input border-border text-right"
              autoComplete="username"
            />
          </div>

          <div>
            <Label htmlFor="password" className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              كلمة المرور
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="bg-input border-border text-right"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-6 text-lg"
          >
            <LogIn className="w-5 h-5 ml-2" />
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
