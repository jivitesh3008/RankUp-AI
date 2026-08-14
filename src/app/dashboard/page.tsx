'use client';
import Link from "next/link";
import { MessageSquare, Calculator, FlaskConical, BookType, Sparkles } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Ready to learn?</h1>
        <p className="text-slate-600 dark:text-slate-400">Select a subject or jump right into your doubts.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">What are you stuck on?</h2>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
          <Link 
            href="/tutor"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-medium transition-all shadow-sm"
          >
            <MessageSquare className="w-5 h-5" />
            Ask RankUp Tutor
          </Link>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Choose a Subject</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link href="/tutor" className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calculator className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Mathematics</h4>
          </Link>
          <Link href="/tutor" className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all text-center">
            <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Science</h4>
          </Link>
          <Link href="/tutor" className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all text-center">
            <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookType className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">English</h4>
          </Link>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Coming Soon
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 opacity-70">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Previous Year Questions</h4>
            <p className="text-sm text-slate-500 mt-1">Practice with 10 years of CBSE board papers.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 opacity-70">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Performance Tracking</h4>
            <p className="text-sm text-slate-500 mt-1">See your weak topics and improve steadily.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
