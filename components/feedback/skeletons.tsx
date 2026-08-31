import { Skeleton } from "@/components/ui/skeleton";

function RowSkeleton() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-border">
      <Skeleton className="size-9 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-[5.75rem]" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-8 divide-y border-y">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between py-3.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-10 h-4 w-40" />
      <Skeleton className="mt-5 h-14 w-24" />
      <Skeleton className="mt-3 h-4 w-44" />
    </div>
  );
}

export function FollowingSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="mt-2 h-4 w-48" />
      <div className="mt-5 flex gap-4 border-b pb-2">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="mt-4 h-9 w-full" />
      <div className="mt-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function FollowersSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="mt-2 h-4 w-52" />
      <div className="mt-5 flex gap-4 border-b pb-2">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="mt-4 h-9 w-full" />
      <div className="mt-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function NonFollowersSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="mt-2 h-4 w-52" />
      <Skeleton className="mt-5 h-9 w-full" />
      <div className="mt-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-6 flex gap-6">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-16" />
      </div>
      <div className="mt-8 divide-y border-y">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="my-3.5 h-5 w-40" />
        ))}
      </div>
    </div>
  );
}

export function UserListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, index) => (
        <RowSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return <ProfilePageSkeleton />;
}
