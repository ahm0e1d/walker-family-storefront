import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1457134764271079586/BFePlTsm_MYu9nr6rYbDaFZIQYhIxLhp_nm_LXyC3JvEZoe1-hLagsw-uI_rboLNJUPV";

interface CompleteOrderRequest {
  order_id: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id }: CompleteOrderRequest = await req.json();

    console.log("Completing order:", order_id);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "الطلب غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "فشل في تحديث الطلب" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send Discord notification
    try {
      const items = order.items as Array<{ name: string; quantity: number; price: number }>;
      const itemsList = items
        .map((item) => `• ${item.name} - الكمية: ${item.quantity} - السعر: ${item.price.toLocaleString()}`)
        .join("\n");

      const discordPayload = {
        embeds: [{
          title: "✅ تم تسليم طلب",
          color: 0x22c55e,
          fields: [
            { name: "🎫 رقم الطلب", value: order.order_number, inline: false },
            { name: "👤 اسم الحساب", value: order.account_name, inline: true },
            { name: "🎮 اسم الشخصية", value: order.character_name, inline: true },
            { name: "💬 يوزر الديسكورد", value: order.discord_username, inline: true },
            { name: "🆔 الايدي", value: order.game_id, inline: true },
            { name: "📦 المنتجات", value: itemsList, inline: false },
            { name: "💰 المجموع", value: order.total.toLocaleString(), inline: true },
          ],
          footer: { text: "Walker Family Shop - تم التسليم" },
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });

      console.log("Discord notification sent for order:", order.order_number);
    } catch (discordError) {
      console.error("Discord webhook error:", discordError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "تم تسليم الطلب بنجاح" }),
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
