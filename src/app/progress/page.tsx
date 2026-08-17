import { createClient } from '@/utils/supabase/server';
import AuthPrompt from '@/components/AuthPrompt';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <AuthPrompt />;
  }

  // Fetch basic stats
  const { data: attempts } = await supabase
    .from('test_attempts')
    .select('id, test_type, title, subject, total_questions, correct_answers, score_percentage, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  const { data: activity } = await supabase
    .from('student_activity')
    .select('id, event_type, chapter, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const testsCompleted = attempts?.length || 0;
  const questionsPracticed = attempts?.reduce((acc, curr) => acc + curr.total_questions, 0) || 0;
  const correctQuestions = attempts?.reduce((acc, curr) => acc + curr.correct_answers, 0) || 0;
  const overallAccuracy = questionsPracticed > 0 ? Math.round((correctQuestions / questionsPracticed) * 100) : 0;

  // Chapter Performance (mocked aggregation for now, could be done via RPC)
  const chapterStats: Record<string, { total: number, correct: number }> = {};
  
  if (attempts) {
    for (const attempt of attempts) {
      if (attempt.title) {
        if (!chapterStats[attempt.title]) {
           chapterStats[attempt.title] = { total: 0, correct: 0 };
        }
        chapterStats[attempt.title].total += attempt.total_questions;
        chapterStats[attempt.title].correct += attempt.correct_answers;
      }
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Progress</h1>
         <p className="text-slate-600 dark:text-slate-400">Welcome back, let's see how you're doing.</p>
      </div>
      
      {testsCompleted === 0 && (!activity || activity.length === 0) ? (
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Your progress will appear here once you start learning. Try asking a doubt or creating a test!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tests completed</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{testsCompleted}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Questions attempted</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{questionsPracticed}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Questions correct</div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{correctQuestions}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overall accuracy</div>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{overallAccuracy}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Chapter Performance</h2>
               {Object.keys(chapterStats).length > 0 ? (
                 <div className="space-y-4">
                   {Object.entries(chapterStats).map(([ch, stats]) => {
                     const acc = Math.round((stats.correct / stats.total) * 100);
                     return (
                       <div key={ch} className="flex items-center justify-between">
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4">{ch}</span>
                         <span className="text-sm font-bold text-slate-900 dark:text-white">{acc}%</span>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <p className="text-sm text-slate-500">Take some tests to see your performance.</p>
               )}
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
               {activity && activity.length > 0 ? (
                 <div className="space-y-4">
                   {activity.map(act => (
                     <div key={act.id} className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                       <div>
                         <p className="text-sm font-medium text-slate-900 dark:text-white">
                           {act.event_type === 'tutor_question' && 'Asked a doubt'}
                           {act.event_type === 'image_question' && 'Uploaded an image'}
                           {act.event_type === 'custom_test_completed' && 'Completed a custom test'}
                           {act.event_type === 'youtube_test_completed' && 'Completed a YouTube test'}
                         </p>
                         <p className="text-xs text-slate-500">
                           {new Date(act.created_at).toLocaleDateString()}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-slate-500">No recent activity.</p>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
