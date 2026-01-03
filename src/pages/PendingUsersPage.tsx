import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Check, X, Users, RefreshCw } from "lucide-react";

interface PendingUser {
  id: string;
  email: string;
  discord_username: string;
  created_at: string;
  status: string;
}

const PendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchPendingUsers();
  }, [isAdmin, navigate]);

  const fetchPendingUsers = async () => {
    setLoading(true);
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
      toast({
        title: "خطأ",
        description: "فشل في جلب الطلبات المعلقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("approve-user", {
        body: {
          pending_user_id: userId,
          action,
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

      // Remove from list
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8" />
            طلبات التسجيل المعلقة
          </h1>
          <Button onClick={fetchPendingUsers} variant="outline" size="icon">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
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
                        onClick={() => handleAction(user.id, "approve")}
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
                        onClick={() => handleAction(user.id, "reject")}
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
      </div>
    </div>
  );
};

export default PendingUsersPage;
