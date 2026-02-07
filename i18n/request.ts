import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // Ensure that a valid locale is used
  if (
    !locale ||
    !routing.locales.includes(
      locale as unknown as (typeof routing.locales)[number],
    )
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
