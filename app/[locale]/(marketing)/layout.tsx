import LiveChat from "@/components/chat/LiveChat";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <SmoothScroll>
      <TooltipProvider delayDuration={0}>
        <div className="marketing-gradient-surface relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <LiveChat />
          <Footer locale={locale} />
        </div>
      </TooltipProvider>
    </SmoothScroll>
  );
}
