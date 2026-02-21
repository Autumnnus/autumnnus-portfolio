import AdminHeader from "@/components/admin/AdminHeader";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "../../globals.css";

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

export const metadata: Metadata = {
  title: "Admin Dashboard | Kadir",
  description: "Admin dashboard for portfolio management.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased min-h-screen flex flex-col`}
    >
      <TooltipProvider delayDuration={0}>
        <AdminHeader />
        <main className="flex-1 bg-secondary/5">{children}</main>
      </TooltipProvider>
    </div>
  );
}
