import Container from "@/components/common/Container";

export default function ProjectsLoading() {
  return (
    <Container className="py-12 sm:py-20">
      {/* Header Skeleton */}
      <div className="text-center mb-12 space-y-4">
        <div className="h-12 w-64 bg-muted animate-pulse mx-auto rounded-lg" />
        <div className="h-6 w-96 bg-muted animate-pulse mx-auto rounded-lg" />
      </div>

      {/* Search & Filters Skeleton */}
      <div className="space-y-8 mb-12">
        <div className="h-12 max-w-2xl bg-muted animate-pulse mx-auto rounded-full" />
        <div className="h-px bg-border/50" />
        <div className="space-y-10">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse mb-6 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-24 bg-muted animate-pulse rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg overflow-hidden h-[400px]"
          >
            <div className="h-48 sm:h-56 bg-muted animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-6 w-12 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2 pt-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-6 w-16 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
