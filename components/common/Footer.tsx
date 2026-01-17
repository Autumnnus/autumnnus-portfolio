import Container from "./Container";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-border bg-card mt-20">
      <Container className="py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-2xl">
            <span>🍁</span>
            <span>🍂</span>
            <span>🍃</span>
          </div>

          <p className="font-pixel text-xs text-muted-foreground text-center">
            © {currentYear} Autumnnus Portfolio
          </p>

          <p className="text-sm text-muted-foreground">
            Sonbahar teması ile yapıldı 🧡
          </p>
        </div>
      </Container>
    </footer>
  );
}
