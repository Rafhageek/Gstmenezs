import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-3 w-24" shimmer={false} />
        <Skeleton className="mt-3 h-9 w-80" />
      </div>
      <Skeleton className="mb-4 h-10 w-80" />
      <SkeletonTable cols={6} rows={8} />
    </div>
  );
}
