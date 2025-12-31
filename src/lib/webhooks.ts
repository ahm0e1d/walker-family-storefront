const PURCHASE_WEBHOOK = "https://discord.com/api/webhooks/1455151545695080459/Yh79KZFAKIGdJ9xf0sZG5ssFpnPidW8Dh5JMnQYQ957TVDSPZHmcIGNpoTMkJ6L6xY_Z";
const COMPLAINT_WEBHOOK = "https://discord.com/api/webhooks/1455640996955291698/h3593UQNNnG4_syGS3YFSfOXjnTIfYFn3WB4gy9aZ998hTpMYcNIjAfBT4D4zn_gpuD9";

interface PurchaseData {
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

interface ComplaintData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendPurchaseWebhook = async (data: PurchaseData) => {
  const itemsList = data.items
    .map((item) => `• ${item.name} - الكمية: ${item.quantity} - السعر: ${item.price.toLocaleString()}`)
    .join("\n");

  const embed = {
    title: "🛒 طلب شراء جديد",
    color: 0xdc2626,
    fields: [
      { name: "👤 اسم العميل", value: data.customerName, inline: true },
      { name: "📧 البريد الإلكتروني", value: data.customerEmail, inline: true },
      { name: "📦 المنتجات", value: itemsList, inline: false },
      { name: "💰 المجموع الكلي", value: `${data.total.toLocaleString()}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Walker Family Shop",
    },
  };

  try {
    await fetch(PURCHASE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "no-cors",
      body: JSON.stringify({ embeds: [embed] }),
    });
    return true;
  } catch (error) {
    console.error("Error sending purchase webhook:", error);
    return false;
  }
};

export const sendComplaintWebhook = async (data: ComplaintData) => {
  const embed = {
    title: "📝 شكوى/رسالة جديدة",
    color: 0xfbbf24,
    fields: [
      { name: "👤 الاسم", value: data.name, inline: true },
      { name: "📧 البريد الإلكتروني", value: data.email, inline: true },
      { name: "📋 الموضوع", value: data.subject, inline: false },
      { name: "💬 الرسالة", value: data.message, inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Walker Family Shop",
    },
  };

  try {
    await fetch(COMPLAINT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "no-cors",
      body: JSON.stringify({ embeds: [embed] }),
    });
    return true;
  } catch (error) {
    console.error("Error sending complaint webhook:", error);
    return false;
  }
};
