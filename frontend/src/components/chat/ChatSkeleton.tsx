import { Skeleton } from '../ui/Skeleton';

export function ChatSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] space-y-4 px-4 py-4 animate-in fade-in duration-300">
      {/* Agent message skeleton */}
      <div className="flex gap-2.5">
        <Skeleton className="h-7 w-7 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* User message skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-2/5 rounded-2xl" />
      </div>

      {/* Agent message skeleton */}
      <div className="flex gap-2.5">
        <Skeleton className="h-7 w-7 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
}
