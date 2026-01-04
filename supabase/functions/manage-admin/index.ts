import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1457142786498236522/ipk_45BtgnxJc1p3UYx3FnoOE6LTbKVyjTaWJhJOZWCnNo7o3G5erqsESH0wGRiqvOmc";

interface ManageAdminRequest {
  approved_user_id: string;
  action: "add" | "remove";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { approved_user_id, action }: ManageAdminRequest = await req.json();

    console.log("Manage admin request:", { approved_user_id, action });

    if (!approved_user_id || !action) {
      return new Response(
        JSON.stringify({ error: "البيانات غير مكتملة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the approved user info
    const { data: approvedUser, error: fetchError } = await supabase
      .from("approved_users")
      .select("*")
      .eq("id", approved_user_id)
      .maybeSingle();

    if (fetchError || !approvedUser) {
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "المستخدم غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add") {
      // Check if already admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", approved_user_id)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: "هذا المستخدم أدمن بالفعل" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if auth user exists with this email
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
      const authUserExists = existingAuthUser?.users?.some(u => u.email === approvedUser.email);

      let authUserId = approved_user_id;

      if (!authUserExists) {
        // Create auth user with the same ID as approved_user
        // Generate a temporary password (user should reset it)
        const tempPassword = crypto.randomUUID().slice(0, 16);
        
        const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
          email: approvedUser.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            discord_username: approvedUser.discord_username
          }
        });

        if (authError) {
          console.error("Auth user creation error:", authError);
          return new Response(
            JSON.stringify({ error: "حدث خطأ أثناء إنشاء حساب المصادقة" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        authUserId = newAuthUser.user.id;

        // Update approved_users with the auth user id
        await supabase
          .from("approved_users")
          .update({ id: authUserId })
          .eq("id", approved_user_id);

        console.log("Auth user created with temp password");
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authUserId,
          role: "admin"
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "حدث خطأ أثناء إضافة صلاحية الأدمن" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Admin role added for:", approvedUser.discord_username);

      // Send Discord webhook
      try {
        const embed = {
          title: "🛡️ تم ترقية مستخدم لأدمن",
          color: 3066993, // Green color
          fields: [
            {
              name: "ID المستخدم",
              value: authUserId,
              inline: true,
            },
            {
              name: "اسم الديسكورد",
              value: approvedUser.discord_username,
              inline: true,
            },
            {
              name: "البريد الإلكتروني",
              value: approvedUser.email,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });

        console.log("Discord webhook sent for admin promotion");
      } catch (webhookError) {
        console.error("Failed to send Discord webhook:", webhookError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `تم منح صلاحية الأدمن لـ ${approvedUser.discord_username}` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "remove") {
      // Remove admin role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", approved_user_id)
        .eq("role", "admin");

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return new Response(
          JSON.stringify({ error: "حدث خطأ أثناء إزالة صلاحية الأدمن" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Admin role removed for:", approvedUser.discord_username);

      // Send Discord webhook
      try {
        const embed = {
          title: "⬇️ تم إزالة صلاحية الأدمن",
          color: 15105570, // Orange color
          fields: [
            {
              name: "ID المستخدم",
              value: approved_user_id,
              inline: true,
            },
            {
              name: "اسم الديسكورد",
              value: approvedUser.discord_username,
              inline: true,
            },
            {
              name: "البريد الإلكتروني",
              value: approvedUser.email,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });

        console.log("Discord webhook sent for admin demotion");
      } catch (webhookError) {
        console.error("Failed to send Discord webhook:", webhookError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `تم إزالة صلاحية الأدمن من ${approvedUser.discord_username}` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "إجراء غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
