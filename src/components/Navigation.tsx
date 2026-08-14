import Link from 'next/link';
import { BookOpen, Home, MessageSquare, LayoutDashboard } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">RankUp AI</span>
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/tutor" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ask a Doubt
            </Link>
            <Link href="/progress" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium">
              Progress
            </Link>
            <Link href="/pyqs" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 text-sm font-medium">
              PYQs
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
