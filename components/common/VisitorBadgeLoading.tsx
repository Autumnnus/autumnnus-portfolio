export default function VisitorBadgeLoading() {
  return (
    <div className="p-1">
      <div className="pixel-panel flex items-center gap-4 px-4 py-3" aria-hidden="true">
        <div className="h-12 w-12 animate-pulse pixel-slot" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 animate-pulse bg-muted" />
          <div className="h-3 w-16 animate-pulse bg-muted" />
          <div className="h-3.5 w-[9.5rem] animate-pulse bg-muted" />
        </div>
      </div>
    </div>
  );
}
