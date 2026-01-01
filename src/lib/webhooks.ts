const PURCHASE_WEBHOOK = "https://discord.com/api/webhooks/1455151545695080459/Yh79KZFAKIGdJ9xf0sZG5ssFpnPidW8Dh5JMnQYQ957TVDSPZHmcIGNpoTMkJ6L6xY_Z";
const COMPLAINT_WEBHOOK = "https://discord.com/api/webhooks/1455640996955291698/h3593UQNNnG4_syGS3YFSfOXjnTIfYFn3WB4gy9aZ998hTpMYcNIjAfBT4D4zn_gpuD9";

interface PurchaseData {
  accountName: string;
  characterName: string;
  discordUsername: string;
  oderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

interface ComplaintData {
  characterName: string;
  accountName: string;
  discordUsername: string;
  complaint: string;
}

export const sendPurchaseWebhook = async (data: PurchaseData) => {
  const itemsList = data.items
    .map((item) => `• ${item.name} - الكمية: ${item.quantity} - السعر: ${item.price.toLocaleString()}`)
    .join("\n");

  const embed = {
    title: "🛒 طلب شراء جديد",
    color: 0xdc2626,
    fields: [
      { name: "👤 اسم الحساب", value: data.accountName, inline: true },
      { name: "🎮 اسم الشخصية", value: data.characterName, inline: true },
      { name: "💬 يوزر الديسكورد", value: data.discordUsername, inline: true },
      { name: "🆔 الايدي", value: data.oderId, inline: true },
      { name: "📦 المنتجات", value: itemsList, inline: false },
      { name: "💰 المجموع الكلي", value: `${data.total.toLocaleString()}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Walker Family Shop",
    },
  };

  try {
    const response = await fetch(PURCHASE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log("Purchase webhook response:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Error sending purchase webhook:", error);
    return false;
  }
};

export const sendComplaintWebhook = async (data: ComplaintData) => {
  const embed = {
    title: "📝 شكوى جديدة",
    color: 0xfbbf24,
    fields: [
      { name: "🎮 اسم الشخصية", value: data.characterName, inline: true },
      { name: "👤 اسم الحساب", value: data.accountName, inline: true },
      { name: "💬 يوزر الديسكورد", value: data.discordUsername, inline: true },
      { name: "📋 الشكوى", value: data.complaint, inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Walker Family Shop",
    },
  };

  try {
    const response = await fetch(COMPLAINT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log("Complaint webhook response:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Error sending complaint webhook:", error);
    return false;
  }
};
