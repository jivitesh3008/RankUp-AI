import Link from "next/link";
import { BrainCircuit, BookOpen, PenTool, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 sm:px-6 lg:px-8 py-12">
      <main className="max-w-4xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <span className="block">Don't just get the answer.</span>
            <span className="block text-indigo-600 dark:text-indigo-400">Master the question.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300">
            RankUp AI is your personal Class 10 CBSE tutor that guides you step-by-step instead of simply giving away the answer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link 
              href="/dashboard"
              className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:scale-105"
            >
              Start Learning
            </Link>
            <Link 
              href="/tutor"
              className="inline-flex justify-center items-center px-8 py-3 border-2 border-indigo-600 dark:border-indigo-400 text-base font-medium rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all hover:scale-105"
            >
              Try a Doubt
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 text-left">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Tutor</h3>
            <p className="text-slate-600 dark:text-slate-400">Learn through guided questions instead of answer dumping.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">NCERT Grounded</h3>
            <p className="text-slate-600 dark:text-slate-400">Answers will eventually be grounded directly in NCERT content.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <PenTool className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Handwritten Solutions</h3>
            <p className="text-slate-600 dark:text-slate-400">Eventually students will be able to upload their handwritten work.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Know Your Weakness</h3>
            <p className="text-slate-600 dark:text-slate-400">Eventually RankUp will identify weak topics and help students improve.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
