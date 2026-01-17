import Container from "./Container";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-border bg-card mt-20">
      <Container className="py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="font-pixel text-xs text-muted-foreground text-center">
            © {currentYear} Kadir | Portfolio
          </p>

          <p className="text-sm text-muted-foreground uppercase tracking-wider font-pixel opacity-70">
            Full Stack Developer
          </p>
        </div>
      </Container>
    </footer>
  );
}
