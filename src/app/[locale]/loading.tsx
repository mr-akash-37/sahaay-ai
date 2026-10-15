/** Skeleton shown while a page loads. Text-free so it works in every language. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" className="mx-auto w-full max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-2/3 max-w-md rounded-xl bg-muted" />
      <div className="mt-4 h-4 w-full max-w-xl rounded-lg bg-muted" />
      <div className="mt-2 h-4 w-5/6 max-w-lg rounded-lg bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
