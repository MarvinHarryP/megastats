import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>

      <div className="rounded-xl border p-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
