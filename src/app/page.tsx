import Link from "next/link";
import { MessageSquare, Camera, PenTool, FileCheck, BrainCircuit, Activity, BookMarked, AlertCircle, ArrowRight, Flame, CheckCircle, Zap, BookOpen } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { ActionCard } from "@/components/ui/ActionCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { getProgressStats } from "@/lib/progress";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  // Fetch recent activity
  let recentActivity: any[] = [];
  let stats = {
    streak: 0,
    accuracy: 0,
    totalQuestions: 0,
    weakTopics: [] as any[],
    mistakesNeedsReview: 0,
    mistakesFixed: 0
  };
  let notesCount = 0;

  if (user) {
    stats = await getProgressStats(user.id);

    const { data: activity } = await supabase
      .from('student_activity')
      .select('event_type, chapter, topic, created_at, metadata_json')
      .eq('user_id', user.id)
      .in('event_type', ['tutor_question', 'image_question', 'quick_revision'])
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('id, title, total_questions, correct_answers, subject, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(3);

    const { data: evaluations } = await supabase
      .from('answer_evaluations')
      .select('id, estimated_marks, total_marks, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    let mergedHistory: any[] = [];
    if (activity) {
      activity.forEach(a => {
        let title = 'Asked a doubt';
        if (a.event_type === 'image_question') title = 'Uploaded Question';
        if (a.event_type === 'quick_revision') title = 'Quick Revision';
        
        mergedHistory.push({
          type: a.event_type === 'image_question' ? 'upload' : 'doubt',
          title,
          date: a.created_at,
          score: null,
        });
      });
    }
    if (attempts) {
      attempts.forEach(a => mergedHistory.push({
        type: 'test',
        title: a.title || 'Test',
        date: a.completed_at,
        score: `${a.correct_answers}/${a.total_questions}`,
      }));
    }
    if (evaluations) {
      evaluations.forEach(e => mergedHistory.push({
        type: 'evaluation',
        title: 'Answer evaluation',
        date: e.created_at,
        score: `${e.estimated_marks}/${e.total_marks}`,
      }));
    }
    
    mergedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    recentActivity = mergedHistory.slice(0, 3);

    const { count: nCount } = await supabase
      .from('short_notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    notesCount = nCount || 0;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8 mt-2 sm:mt-8 mb-8">
      
      {/* Header Section */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl sm:text-4xl font-outfit font-bold text-foreground">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-foreground/60 text-lg">
          What are you working on today?
        </p>
        
        {stats.streak > 0 && (
          <div className="flex items-center gap-4 mt-2 pt-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-accent-amber-500">
              <Flame className="w-4 h-4 fill-accent-amber-500" />
              {stats.streak} day streak
            </div>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <ActionCard 
          href="/tutor"
          icon={<MessageSquare className="w-6 h-6" />}
          title="Ask Doubt"
          description="Chat with AI"
          accent="blue"
        />
        <ActionCard 
          href="/upload-question"
          icon={<Camera className="w-6 h-6" />}
          title="Upload"
          description="Get step-by-step"
          accent="blue"
        />
        <ActionCard 
          href="/custom-test"
          icon={<PenTool className="w-6 h-6" />}
          title="Test"
          description="Practice chapters"
          accent="amber"
        />
        <ActionCard 
          href="/answer-evaluation"
          icon={<FileCheck className="w-6 h-6" />}
          title="Evaluate"
          description="Check answers"
          accent="emerald"
        />
        <ActionCard 
          href="/notes"
          icon={<BookOpen className="w-6 h-6" />}
          title="Short Notes"
          description="Quick summaries"
          accent="teal"
        />
      </div>

      {/* Continue Learning */}
      {stats.weakTopics.length > 0 && (
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold font-outfit text-foreground">Continue Learning</h3>
            </div>
            <p className="text-sm text-foreground/70">
              We noticed you've been struggling with <strong className="text-foreground">{stats.weakTopics[0].topic}</strong>. Do a quick revision to strengthen it!
            </p>
          </div>
          <Link href="/notes" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors tap-scale shrink-0 whitespace-nowrap shadow-sm">
            Read Short Notes
          </Link>
        </div>
      )}

      {/* Quick Progress Section */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 font-outfit">Your Progress</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Day Streak" 
            value={stats.streak} 
            icon={<Flame className="w-4 h-4 text-accent-amber-500" />} 
          />
          <MetricCard 
            label="Accuracy" 
            value={`${stats.accuracy}%`} 
            icon={<BrainCircuit className="w-4 h-4 text-primary-500" />} 
          />
          <MetricCard 
            label="Questions" 
            value={stats.totalQuestions} 
            icon={<Activity className="w-4 h-4 text-accent-teal-500" />} 
          />
          <MetricCard 
            label="Mistakes Fixed" 
            value={stats.mistakesFixed} 
            icon={<BookMarked className="w-4 h-4 text-accent-emerald-500" />} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground font-outfit">Recent Activity</h2>
            <Link href="/history" className="text-sm font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-card-border">
                {recentActivity.map((item, i) => {
                  const isToday = new Date(item.date).toDateString() === new Date().toDateString();
                  let Icon = MessageSquare;
                  let color = "text-blue-500";
                  let bg = "bg-blue-500/10";
                  
                  if (item.type === 'test') { Icon = PenTool; color = "text-orange-500"; bg = "bg-orange-500/10"; }
                  else if (item.type === 'evaluation') { Icon = CheckCircle; color = "text-teal-500"; bg = "bg-teal-500/10"; }
                  else if (item.type === 'upload') { Icon = Camera; color = "text-cyan-500"; bg = "bg-cyan-500/10"; }
                  
                  return (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-foreground/5 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${bg} ${color}`}>
                           <Icon className="w-4 h-4" />
                         </div>
                         <div className="font-medium text-sm text-foreground">{item.title}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-foreground/60">
                         {item.score && <span className="bg-foreground/5 px-2 py-1 rounded text-foreground">{item.score}</span>}
                         <span>{isToday ? 'Today' : new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-foreground/60 mb-4">No recent activity.</p>
                <Link href="/tutor" className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors tap-scale">
                  Start Learning
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mistake Book & Short Notes */}
        {user && (
          <div className="space-y-8">
            {/* Mistake Book Summary */}
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground font-outfit">Mistake Book</h2>
            </div>
            
            <div className="bg-card-bg border border-card-border rounded-2xl p-5 h-[calc(100%-2rem)] flex flex-col">
              {stats.mistakesNeedsReview > 0 ? (
                <>
                  <div className="flex-1 flex flex-col items-center justify-center text-center mb-6">
                    <div className="w-16 h-16 bg-accent-amber-500/10 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-accent-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1 font-outfit">{stats.mistakesNeedsReview}</div>
                    <div className="text-sm text-foreground/60">Concepts to review</div>
                  </div>
                  
                  {stats.weakTopics.length > 0 && (
                     <div className="p-4 bg-background rounded-xl border border-card-border mb-4">
                       <div className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">Needs Practice</div>
                       <div className="text-sm font-semibold text-foreground truncate">{stats.weakTopics[0].topic}</div>
                     </div>
                  )}
                  
                  <Link href="/mistake-book" className="block w-full text-center py-2.5 bg-background border border-card-border hover:bg-card-border/50 text-foreground rounded-xl text-sm font-medium transition-colors tap-scale">
                    Review Mistakes
                  </Link>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 bg-accent-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                    <FileCheck className="w-8 h-8 text-accent-emerald-500" />
                  </div>
                  <p className="text-foreground/80 font-medium mb-1">Nothing to fix yet 🎉</p>
                  <p className="text-sm text-foreground/50">Keep up the great work!</p>
                </div>
              )}
            </div>
            </div>

            {/* Short Notes Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground font-outfit">Short Notes</h2>
              </div>
              <div className="bg-card-bg border border-card-border rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">📖</span>
                </div>
                <div className="text-sm text-foreground/60 mb-4">Quick revision before your next test.</div>
                <Link href="/notes" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                  Explore Short Notes →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
