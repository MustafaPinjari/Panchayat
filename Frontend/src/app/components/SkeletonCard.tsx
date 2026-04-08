export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
      <div className="h-6 bg-muted rounded-lg w-24" />
    </div>
  );
}
