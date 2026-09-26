/**
 * Sends a message (optionally with a public photo) to the owner's Telegram
 * chat. Silently no-ops in development or when the bot is not configured.
 */
export async function sendTelegramNotification(
  message: string,
  photo?: string,
): Promise<boolean> {
  if (process.env.NODE_ENV === "development") return false;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error("Telegram bot token or chat ID is missing");
    return false;
  }

  try {
    const isPublicPhoto =
      photo &&
      photo.startsWith("http") &&
      !photo.includes("localhost") &&
      !photo.includes("127.0.0.1");
    const endpoint = isPublicPhoto ? "sendPhoto" : "sendMessage";

    const body: Record<string, unknown> = {
      chat_id: chatId,
      parse_mode: "HTML",
    };

    if (isPublicPhoto) {
      body.photo = photo;
      body.caption = message;
    } else {
      body.text = message;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API Error:", errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
}
