export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
        <div className="h-8 w-32 mb-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </main>
  );
}
