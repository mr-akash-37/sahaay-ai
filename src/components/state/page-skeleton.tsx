/** Placeholder shown while saved answers load from this device. */
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className="animate-pulse space-y-4">
      <span className="sr-only">{label}</span>
      <div className="h-24 rounded-2xl bg-muted" />
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="h-40 rounded-2xl bg-muted" />
    </div>
  );
}
