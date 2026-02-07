import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import SeasonalEffects from "@/components/decorations/SeasonalEffects";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/components/providers/LanguageContext";
import PageTransition from "@/components/providers/PageTransition";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { Language } from "@prisma/client";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

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
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <LanguageProvider locale={locale as Language}>
                <SeasonalEffects />
                <SmoothScroll>
                  <TooltipProvider delayDuration={0}>
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                      <PageTransition>{children}</PageTransition>
                    </main>
                    <Footer />
                  </TooltipProvider>
                </SmoothScroll>
              </LanguageProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
