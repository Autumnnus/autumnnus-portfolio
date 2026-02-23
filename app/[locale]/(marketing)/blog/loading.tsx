import Container from "@/components/common/Container";

export default function BlogLoading() {
  return (
    <Container className="py-12 sm:py-20">
      <div className="text-center mb-12 space-y-4">
        <div className="h-12 w-48 bg-muted animate-pulse mx-auto rounded-lg" />
        <div className="h-6 w-80 bg-muted animate-pulse mx-auto rounded-lg" />
      </div>

      <div className="h-px bg-border/50 mb-12" />

      <div className="mb-12">
        <div className="h-8 w-48 bg-muted animate-pulse mb-6 rounded" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-muted animate-pulse rounded-full"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg overflow-hidden h-[450px]"
          >
            <div className="h-48 sm:h-56 bg-muted animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                {[1, 2].map((j) => (
                  <div
                    key={j}
                    className="h-6 w-16 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
              <div className="pt-6 border-t border-border flex justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
