import Link from "next/link";
import { MessageSquare, PenTool, Camera, PlayCircle, Clock, ArrowRight, FileCheck, BrainCircuit, Activity } from "lucide-react";
import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  // Fetch recent activity for "Continue Learning"
  let recentActivity: any[] = [];
  let testStats = { completed: 0, accuracy: 0 };
  let evalStats = { completed: 0 };

  if (user) {
    const { data: activity } = await supabase
      .from('student_activity')
      .select('event_type, chapter, topic, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    recentActivity = activity || [];

    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('total_questions, correct_answers')
      .eq('user_id', user.id);

    if (attempts && attempts.length > 0) {
      testStats.completed = attempts.length;
      const totalQ = attempts.reduce((acc, curr) => acc + curr.total_questions, 0);
      const correctQ = attempts.reduce((acc, curr) => acc + curr.correct_answers, 0);
      testStats.accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
    }

    const { count: evalCount } = await supabase
      .from('answer_evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    evalStats.completed = evalCount || 0;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <main className="max-w-5xl mx-auto w-full space-y-12 mt-4 sm:mt-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-outfit font-bold text-stone-900 dark:text-stone-100">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-2 text-lg text-stone-600 dark:text-stone-400">
              What are you working on today?
            </p>
          </div>
        </div>

        {/* Section 1 — Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/tutor" className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
              <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Ask a Doubt</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Chat with the AI Tutor</p>
          </Link>
          
          <Link href="/tutor" className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Upload a Question</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Get step-by-step help</p>
          </Link>
          
          <Link href="/custom-test" className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
              <PenTool className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Create a Test</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Generate a custom quiz</p>
          </Link>

          <Link href="/answer-evaluation" className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Check My Answer</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Get feedback on your handwritten answer</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section 2 — Continue Learning */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 font-outfit">
                  <Clock className="w-5 h-5 text-stone-400" />
                  Continue Learning
                </h2>
                <Link href="/progress" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {act.chapter || 'Science Practice'}
                          </p>
                          <p className="text-sm text-stone-500 mt-0.5">
                            {act.event_type === 'answer_evaluation' ? 'Answer Evaluation' : 
                             act.event_type === 'custom_test_completed' ? 'Custom Test' : 
                             act.event_type === 'youtube_test_completed' ? 'YouTube Test' : 
                             'Tutor Session'} 
                            {act.topic && ` • ${act.topic}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-stone-500 dark:text-stone-400">No recent activity yet.</p>
                  <p className="text-sm text-stone-400 mt-1">Jump into a quick action above to start learning.</p>
                </div>
              )}
            </div>
            
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            
            {/* Section 3 — Progress Snapshot */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2 font-outfit">
                <Activity className="w-5 h-5 text-stone-400" />
                Snapshot
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Overall Accuracy</span>
                    <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{testStats.accuracy}%</span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${testStats.accuracy}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div>
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                      <BrainCircuit className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Tests</span>
                    </div>
                    <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{testStats.completed}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                      <FileCheck className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Evals</span>
                    </div>
                    <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{evalStats.completed}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
