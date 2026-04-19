import { Skeleton, SkeletonKpi } from "@/components/ui/skeleton";

export default function LoadingDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-3 w-24" shimmer={false} />
        <Skeleton className="mt-3 h-9 w-80" />
        <Skeleton className="mt-3 h-4 w-96" shimmer={false} />
      </div>

      {/* KPIs linha 1 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
      </section>

      {/* KPIs linha 2 */}
      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
      </section>

      {/* Gráficos */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </section>
    </div>
  );
}
