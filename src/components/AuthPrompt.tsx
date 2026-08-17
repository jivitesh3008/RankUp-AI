import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AuthPrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-md w-full">
        <div className="flex justify-center mb-6">
           <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
           </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Create your free RankUp account to save your progress.</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You need to be logged in to access tests, the tutor, and view your progress dashboard.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/signup"
            className="flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="flex w-full justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
