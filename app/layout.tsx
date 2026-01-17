import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import SeasonalEffects from "@/components/decorations/SeasonalEffects";
import { LanguageProvider } from "@/components/providers/LanguageContext";
import PageTransition from "@/components/providers/PageTransition";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google"; // Import pixel font
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configure pixel font
const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel", // Use the same variable name we expected
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Autumnnus Portfolio | Sonbahar & Kış Pixel Temalı Portfolyo",
  description:
    "Sonbahar ve Kış temalı, pixel art estetiği ile kişisel portfolyo. Projeler, iş deneyimleri ve blog yazıları.",
  keywords: [
    "portfolio",
    "developer",
    "autumn",
    "winter",
    "pixel art",
    "web development",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <SeasonalEffects />
            <SmoothScroll>
              <TooltipProvider delayDuration={0}>
                <Navbar />
                <main className="flex-1">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
              </TooltipProvider>
            </SmoothScroll>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
