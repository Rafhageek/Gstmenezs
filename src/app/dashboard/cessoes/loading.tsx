import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-3 w-24" shimmer={false} />
        <Skeleton className="mt-3 h-9 w-80" />
      </div>
      <Skeleton className="mb-4 h-10 w-96" />
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" shimmer={false} />
        <Skeleton className="h-8 w-20 rounded-full" shimmer={false} />
        <Skeleton className="h-8 w-24 rounded-full" shimmer={false} />
        <Skeleton className="h-8 w-28 rounded-full" shimmer={false} />
      </div>
      <SkeletonTable cols={7} rows={8} />
    </div>
  );
}
