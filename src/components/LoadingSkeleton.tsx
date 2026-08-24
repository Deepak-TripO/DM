import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-xl neu-pressed opacity-70', className)}
    />
  );
}

export function FileCardSkeleton() {
  return (
    <div className="rounded-3xl neu-card p-4">
      <Skeleton className="mb-3 h-32 w-full rounded-2xl" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function FileListSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3.5 neu-pressed rounded-2xl">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-3xl neu-card p-6">
      <Skeleton className="mb-3 h-4 w-20" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}

export { Skeleton };
