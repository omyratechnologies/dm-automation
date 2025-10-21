import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

// Skeleton Card for Dashboard
function SkeletonCard() {
  return (
    <div className="p-6 rounded-xl bg-muted border border-border animate-pulse">
      <div className="h-4 bg-muted-foreground/20 rounded w-24 mb-3" />
      <div className="h-8 bg-muted-foreground/20 rounded w-16 mb-2" />
      <div className="h-3 bg-muted-foreground/20 rounded w-32" />
    </div>
  );
}

// Skeleton Table Row
function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-3 w-[200px]" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

// Skeleton Automation Card
function SkeletonAutomationCard() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border animate-pulse">
      <div className="flex gap-6">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Skeleton Chart
function SkeletonChart() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Skeleton Grid (for dashboards)
function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Skeleton List
function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAutomationCard key={i} />
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTableRow, 
  SkeletonAutomationCard, 
  SkeletonChart, 
  SkeletonGrid, 
  SkeletonList 
}
