export function RoutePending() {
  return (
    <phantom-ui loading={true} animation="shimmer" reveal={0.1} class="block">
      <div className="min-h-[60vh] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-card p-6 shadow-sm">
            <div className="space-y-3">
              <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-96 max-w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-10 w-3/4 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-10 w-2/3 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 md:col-span-2 xl:col-span-1">
                <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-10 w-40 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-56 w-full rounded-[2rem] bg-slate-100 dark:bg-slate-800" />
            <div className="h-56 w-full rounded-[2rem] bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </phantom-ui>
  )
}
