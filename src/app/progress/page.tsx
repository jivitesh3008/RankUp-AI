export default function ProgressPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Progress</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          No progress data available yet.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">0</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Tests completed</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">0</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Questions practiced</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">0</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Topics reviewed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
