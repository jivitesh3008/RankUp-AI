interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-card-border/50 rounded-md ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card-bg border border-card-border p-5 rounded-2xl">
      <Skeleton className="w-10 h-10 rounded-xl mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
