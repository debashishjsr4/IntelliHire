const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />
);

const InsightSkeleton = () => {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-4 h-7 w-72 max-w-full" />
        <div className="mt-6 space-y-3">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="h-4 w-3/4" />
        </div>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="mt-4 h-7 w-48" />
        <div className="mt-6 space-y-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item}>
              <div className="mb-2 flex justify-between">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-10" />
              </div>
              <SkeletonBlock className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="mt-4 h-7 w-56" />
        <div className="mt-6 space-y-6">
          {[1, 2, 3].map((item) => (
            <div className="flex gap-4" key={item}>
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              <div className="flex-1">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="mt-3 h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

export default InsightSkeleton;

