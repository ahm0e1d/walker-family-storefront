import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
  admin_email?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, new_password, admin_email }: ResetPasswordRequest = await req.json();

    console.log("Password reset request:", { user_id, admin_email });

    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "البيانات غير مكتملة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "كلمة السر يجب أن تكون 6 أحرف على الأقل" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the approved user
    const { data: approvedUser, error: fetchError } = await supabase
      .from("approved_users")
      .select("*")
      .eq("id", user_id)
      .maybeSingle();

    if (!approvedUser) {
      return new Response(
        JSON.stringify({ error: "المستخدم غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the new password
    const encoder = new TextEncoder();
    const data = encoder.encode(new_password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const newPasswordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Update password hash in approved_users
    const { error: updateError } = await supabase
      .from("approved_users")
      .update({ password_hash: newPasswordHash })
      .eq("id", user_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "حدث خطأ أثناء تحديث كلمة السر" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password in Supabase Auth as well
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (authUpdateError) {
      console.error("Auth update error:", authUpdateError);
      // Continue anyway as the main password hash is updated
    }

    console.log("Password reset successful for user:", approvedUser.discord_username);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم إعادة تعيين كلمة السر لـ ${approvedUser.discord_username}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
