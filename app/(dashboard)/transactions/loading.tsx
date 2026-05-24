import { Skeleton } from "@components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="divide-y divide-border rounded-md border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="hidden h-5 w-20 sm:block" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
