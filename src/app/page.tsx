import Link from "next/link";
import { MessageSquare, PenTool, Camera, BarChart3, FlaskConical, BookOpen, ArrowRight, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <main className="max-w-5xl mx-auto w-full space-y-10">
        
        {/* Header Section */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Good afternoon 👋
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Ready to learn? Choose an action to get started.
          </p>
        </div>

        {/* Section 1 — Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/tutor" className="group bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
            <MessageSquare className="w-8 h-8 mb-4 text-indigo-200" />
            <h3 className="text-lg font-bold">Ask a Doubt</h3>
            <p className="text-indigo-200 text-sm mt-1">Chat with the AI Tutor</p>
          </Link>
          <Link href="/custom-test" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md p-6 rounded-2xl transition-all hover:scale-[1.02]">
            <PenTool className="w-8 h-8 mb-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Custom Test</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Generate a personalized test</p>
          </Link>
          <Link href="/tutor" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md p-6 rounded-2xl transition-all hover:scale-[1.02]">
            <Camera className="w-8 h-8 mb-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload a Question</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Image-based tutoring</p>
          </Link>
          <Link href="/progress" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md p-6 rounded-2xl transition-all hover:scale-[1.02]">
            <BarChart3 className="w-8 h-8 mb-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">View Progress</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your mastery</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section 2 — Continue Learning */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Continue Learning
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-600 dark:text-slate-400">No recent activity yet.</p>
                <p className="text-sm text-slate-500 mt-1">Ask your first doubt or create a test to get started.</p>
              </div>
            </div>

            {/* Section 3 — Subjects */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Subjects
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                    <FlaskConical className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Science</h3>
                    <p className="text-sm text-slate-500">Class 10 CBSE • 13 Chapters</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                  <Link href="/tutor" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center justify-center gap-1 transition-colors">
                    Access Chapters in Tutor <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Section 4 — Quick Test */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Test Yourself</h2>
              <div className="space-y-3">
                <Link href="/custom-test" className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl transition-colors font-medium text-sm">
                  Create 5-question test
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/custom-test" className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl transition-colors font-medium text-sm">
                  Create 10-question test
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Section 5 — Image Study */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <Camera className="w-6 h-6 mb-3 text-indigo-100" />
                <h2 className="text-lg font-bold mb-2">Have a question on paper?</h2>
                <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
                  Upload a textbook question, handwritten solution, or diagram.
                </p>
                <Link href="/tutor" className="inline-block px-4 py-2 bg-white text-indigo-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  Upload Question
                </Link>
              </div>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                <Camera className="w-48 h-48" />
              </div>
            </div>

            {/* Section 6 — Progress Snapshot */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Progress Snapshot</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Tests completed</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Questions practiced</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Topics reviewed</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">0</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
