import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="space-y-3 max-w-2xl">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-[36ch]" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="card-surface shadow-soft rounded-xl p-5 space-y-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-[24ch]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

