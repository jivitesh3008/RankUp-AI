import { createClient } from '@/utils/supabase/server';
import AuthPrompt from '@/components/AuthPrompt';
import { Activity, BookOpen, BrainCircuit, CheckCircle2, Clock, FileCheck, Target, TrendingUp, BookMarked } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

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

  const { data: evaluations } = await supabase
    .from('answer_evaluations')
    .select('id, question_text, chapter, topic, total_marks, estimated_marks, confidence, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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
  const evaluationsCompleted = evaluations?.length || 0;

  const { data: mistakesData } = await supabase
    .from('mistake_book')
    .select('status, mistake_category, topic, occurrence_count')
    .eq('user_id', user.id);

  let mistakesRecorded = 0;
  let mistakesFixed = 0;
  let mostCommonCategory = 'None';
  let weakestTopic = 'None';
  
  if (mistakesData) {
     mistakesRecorded = mistakesData.length;
     mistakesFixed = mistakesData.filter((m: any) => m.status === 'fixed').length;
     
     const categoryCounts = mistakesData.reduce((acc: any, m: any) => {
       if (m.mistake_category) acc[m.mistake_category] = (acc[m.mistake_category] || 0) + m.occurrence_count;
       return acc;
     }, {});
     mostCommonCategory = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a])[0] || 'None';

     const repeated = mistakesData.filter((m: any) => m.occurrence_count > 1);
     if (repeated.length > 0) {
       const topicCounts = repeated.reduce((acc: any, m: any) => {
         acc[m.topic] = (acc[m.topic] || 0) + m.occurrence_count;
         return acc;
       }, {});
       weakestTopic = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a])[0] || 'None';
     }
  }

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
    <div className="flex flex-col flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full font-sans mb-8">
      <div className="mb-8">
         <PageHeader title="My Progress" backHref="/" />
         <p className="text-foreground/60 -mt-2 ml-[3.25rem]">Welcome back. Here's a snapshot of your learning journey.</p>
      </div>
      
      {testsCompleted === 0 && evaluationsCompleted === 0 && (!activity || activity.length === 0) ? (
        <div className="bg-stone-50 dark:bg-stone-800/30 p-8 md:p-12 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Activity className="w-12 h-12 text-stone-300 dark:text-stone-600 mb-4" />
          <h3 className="text-lg font-medium font-outfit text-stone-700 dark:text-stone-300 mb-2">Want feedback on your written answers?</h3>
          <p className="text-stone-500 dark:text-stone-400 max-w-sm mb-6">
            Upload a handwritten answer and see where you can improve.
          </p>
          <Link href="/answer-evaluation" className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            Check My Answer
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
              </div>
              <div className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100">{overallAccuracy}%</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
                <BrainCircuit className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Tests</span>
              </div>
              <div className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100">{testsCompleted}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Questions</span>
              </div>
              <div className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100">{questionsPracticed}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
                <FileCheck className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Evals</span>
              </div>
              <div className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100">{evaluationsCompleted}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 flex items-center gap-2">
                 <BookMarked className="w-5 h-5 text-amber-500" />
                 Mistake Book Stats
               </h2>
               <Link href="/mistake-book" className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700">View Mistakes →</Link>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Mistakes Recorded</div>
                 <div className="text-3xl font-bold font-outfit text-stone-900 dark:text-stone-100">{mistakesRecorded}</div>
               </div>
               <div>
                 <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Mistakes Fixed</div>
                 <div className="text-3xl font-bold font-outfit text-emerald-600 dark:text-emerald-400">{mistakesFixed}</div>
               </div>
               <div>
                 <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Most Common</div>
                 <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-2 truncate">{mostCommonCategory}</div>
               </div>
               <div>
                 <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Weakest Topic</div>
                 <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-2 truncate">{weakestTopic}</div>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div>
               <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-6">Chapter Performance</h2>
               {Object.keys(chapterStats).length > 0 ? (
                 <div className="space-y-4">
                   {Object.entries(chapterStats).map(([ch, stats]) => {
                     const acc = Math.round((stats.correct / stats.total) * 100);
                     return (
                       <div key={ch} className="group">
                         <div className="flex items-center justify-between mb-1.5">
                           <span className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate pr-4">{ch}</span>
                           <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{acc}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                           <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${acc}%`}}></div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <p className="text-sm text-stone-500 bg-stone-50 dark:bg-stone-800/50 p-6 rounded-xl border border-stone-200 dark:border-stone-800">Take some tests to see your performance.</p>
               )}
             </div>

             <div>
               <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
                 <Clock className="w-5 h-5 text-stone-400" />
                 Recent Activity
               </h2>
               {activity && activity.length > 0 ? (
                 <div className="space-y-1">
                   {activity.map((act, i) => (
                     <div key={act.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                       <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                       <div>
                         <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                           {act.event_type === 'tutor_question' && 'Asked a doubt in Tutor'}
                           {act.event_type === 'image_question' && 'Uploaded an image to Tutor'}
                           {act.event_type === 'custom_test_completed' && 'Completed a Custom Test'}
                           {act.event_type === 'youtube_test_completed' && 'Completed a YouTube Test'}
                           {act.event_type === 'answer_evaluation' && 'Evaluated a handwritten answer'}
                         </p>
                         <p className="text-xs text-stone-500 mt-1">
                           {new Date(act.created_at).toLocaleDateString()} {act.chapter ? `• ${act.chapter}` : ''}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-stone-500 bg-stone-50 dark:bg-stone-800/50 p-6 rounded-xl border border-stone-200 dark:border-stone-800">No recent activity.</p>
               )}
              </div>
           </div>

          {evaluations && evaluations.length > 0 ? (
            <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100">Answer Evaluations</h2>
                 <Link href="/answer-evaluation" className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                   Check a new answer
                 </Link>
               </div>
               <div className="space-y-3">
                 {evaluations.map((ev: any) => (
                   <div key={ev.id} className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-stone-300 dark:hover:border-stone-700 transition-colors">
                     <div>
                       <p className="text-base font-medium text-stone-900 dark:text-stone-100 line-clamp-1 mb-1">{ev.question_text || 'Handwritten Question'}</p>
                       <p className="text-sm text-stone-500">{new Date(ev.created_at).toLocaleDateString()} • {ev.topic || ev.chapter || 'Unknown Topic'}</p>
                     </div>
                     <div className="flex items-center gap-6 shrink-0">
                       <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                         ev.confidence === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' : 
                         ev.confidence === 'Low' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400' : 
                         'bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400'
                       }`}>
                         {ev.confidence || 'Unknown'} Conf
                       </span>
                       <div className="text-right border-l border-stone-200 dark:border-stone-700 pl-6">
                         <div className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-0.5">Score</div>
                         <div className="text-xl font-bold font-outfit text-teal-700 dark:text-teal-400">
                           {ev.estimated_marks !== null ? ev.estimated_marks : '-'} <span className="text-sm font-normal text-stone-400">/ {ev.total_marks || '?'}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          ) : (
            <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
               <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-6">Answer Evaluations</h2>
               <div className="bg-stone-50 dark:bg-stone-800/30 p-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-center flex flex-col items-center justify-center">
                 <FileCheck className="w-10 h-10 text-stone-300 dark:text-stone-600 mb-4" />
                 <h3 className="text-lg font-medium font-outfit text-stone-700 dark:text-stone-300 mb-2">Want feedback on your written answers?</h3>
                 <p className="text-stone-500 dark:text-stone-400 max-w-sm mb-6">
                   Upload a handwritten answer and see where you can improve.
                 </p>
                 <Link href="/answer-evaluation" className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
                   Check My Answer
                 </Link>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
