import "@/lib/server-error-logger";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "../globals.css";
import { ThemeFavicon } from "@/components/common/ThemeFavicon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin", "latin-ext"],
});

// Marks the homepage intro as already played for this tab session before
// first paint, so reloads don't replay it.
const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem("autumnnus:intro-seen"))document.documentElement.dataset.introSeen="1"}catch(e){}`;

interface Messages {
  Metadata?: {
    title?: string;
    description?: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await getMessages({ locale })) as unknown as Messages;

  return {
    title: messages.Metadata?.title || "Kadir | Full Stack Developer Portfolio",
    description:
      messages.Metadata?.description ||
      "Pixel art estetiği ile hazırlanmış kişisel portfolyo. Projeler, iş deneyimleri ve blog yazıları.",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_UMAMI_ID && (
          <Script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/x.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID}
          />
        )}
        <link rel="icon" href="/images/autumn.png" />
        <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelify.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <ThemeFavicon />
              <div className="flex-1 flex flex-col">{children}</div>
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
