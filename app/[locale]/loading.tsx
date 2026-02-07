export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-4">
        {/* Premium Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-r-2 border-orange-500 animate-spin-slow" />
          <div className="absolute inset-4 rounded-full border-b-2 border-primary opacity-50 animate-spin" />
        </div>
        <div className="text-sm font-medium tracking-widest uppercase animate-pulse text-muted-foreground">
          Loading
        </div>
      </div>
    </div>
  );
}
