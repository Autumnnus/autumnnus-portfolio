import { auth } from "@/auth";
import { getOwnerIdentity } from "@/lib/ai/agent/data";
import { getAssistantSettings } from "@/lib/ai/chat/settings";
import { toAssistantLocale } from "@/lib/ai/config";
import AssistantWidget from "./AssistantWidget";

/**
 * Server entry point for the widget: decides visibility (enabled + API key,
 * admins always see it) and passes the owner's name down.
 */
export default async function Assistant({ locale }: { locale: string }) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

  try {
    const [settings, session, owner] = await Promise.all([
      getAssistantSettings(),
      auth(),
      getOwnerIdentity(toAssistantLocale(locale)),
    ]);
    const isAdmin =
      !!session?.user?.email && session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!settings.enabled && !isAdmin) return null;

    return (
      <AssistantWidget
        ownerName={owner.name.split(" ")[0] || owner.name}
        retentionDays={settings.retentionDays}
      />
    );
  } catch (error) {
    console.error("[assistant] widget unavailable:", error);
    return null;
  }
}
