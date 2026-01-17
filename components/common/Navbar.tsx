import { navbarConfig } from "@/config/navbar";
import Link from "next/link";
import Container from "./Container";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-4 border-border">
      <Container className="py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-pixel text-primary hover:text-accent transition-colors flex items-center gap-2"
          >
            <span className="text-2xl">🍂</span>
            <span className="hidden sm:inline">{navbarConfig.siteName}</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-4">
            {navbarConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pixel-btn-nav px-2 py-1 sm:px-3 sm:py-2 text-xs font-pixel uppercase tracking-wide text-foreground hover:text-primary hover:bg-secondary/20 transition-all border-2 border-transparent hover:border-border"
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </nav>
  );
}
