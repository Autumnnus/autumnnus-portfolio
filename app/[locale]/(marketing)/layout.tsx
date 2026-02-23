import LiveChat from "@/components/chat/LiveChat";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import SeasonalEffects from "@/components/decorations/SeasonalEffects";
import PageTransition from "@/components/providers/PageTransition";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <TooltipProvider delayDuration={0}>
        <SeasonalEffects />
        <Navbar />
        <main className="flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
        <LiveChat />
        <Footer />
      </TooltipProvider>
    </SmoothScroll>
  );
}
