export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-wrap" aria-busy="true" role="status">
      <span className="sr-only">Loading…</span>
      <div className="skeleton skeleton-title" />
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton skeleton-row" key={i} />
      ))}
    </div>
  );
}
