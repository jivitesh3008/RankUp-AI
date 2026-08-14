export default function ProgressPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Progress</h1>
        <div className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium mb-6">
          Coming Soon
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          We are currently building the mastery tracking system to help you identify and improve your weak topics.
        </p>
      </div>
    </div>
  );
}
