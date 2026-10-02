import { Suspense } from "react";
import Link from "next/link";
import { MessageSquare, Camera, PenTool, FileCheck, BrainCircuit, Activity, BookMarked, AlertCircle, ArrowRight, Flame, CheckCircle, BookOpen } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { ActionCard } from "@/components/ui/ActionCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { getCachedProgressStats } from "@/lib/progress";
import { getRecentActivity } from "@/lib/activity";

// Skeletons for progressive streaming loading states
function ContinueLearningSkeleton() {
  return (
    <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="space-y-2 w-full sm:w-2/3">
        <div className="h-5 w-40 bg-foreground/10 rounded-md" />
        <div className="h-4 w-full bg-foreground/5 rounded-md" />
      </div>
      <div className="h-10 w-36 bg-foreground/10 rounded-xl shrink-0" />
    </div>
  );
}

function ProgressMetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card-bg border border-card-border p-4 rounded-2xl animate-pulse flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-foreground/10 rounded" />
            <div className="h-4 w-4 bg-foreground/10 rounded-full" />
          </div>
          <div className="h-7 w-16 bg-foreground/15 rounded" />
        </div>
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden animate-pulse p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground/10" />
            <div className="h-4 w-32 bg-foreground/10 rounded" />
          </div>
          <div className="h-3 w-16 bg-foreground/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function MistakeSummarySkeleton() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-5 animate-pulse min-h-[220px] flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-foreground/10 mb-2" />
      <div className="h-6 w-16 bg-foreground/10 rounded" />
      <div className="h-3 w-28 bg-foreground/5 rounded" />
    </div>
  );
}

// Progressive Server Components
async function StreakBadge({ userId }: { userId?: string }) {
  if (!userId) return null;
  const stats = await getCachedProgressStats(userId);
  if (stats.streak <= 0) return null;
  return (
    <div className="flex items-center gap-4 mt-2 pt-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-accent-amber-500">
        <Flame className="w-4 h-4 fill-accent-amber-500" />
        {stats.streak} day streak
      </div>
    </div>
  );
}

async function ContinueLearningSection({ userId }: { userId?: string }) {
  if (!userId) return null;
  const stats = await getCachedProgressStats(userId);
  if (stats.weakTopics.length === 0) return null;

  return (
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
  );
}

async function ProgressMetricsSection({ userId }: { userId?: string }) {
  if (!userId) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Day Streak" value="—" icon={<Flame className="w-4 h-4 text-accent-amber-500" />} />
        <MetricCard label="Accuracy" value="—%" icon={<BrainCircuit className="w-4 h-4 text-primary-500" />} />
        <MetricCard label="Questions" value="—" icon={<Activity className="w-4 h-4 text-accent-teal-500" />} />
        <MetricCard label="Mistakes Fixed" value="—" icon={<BookMarked className="w-4 h-4 text-accent-emerald-500" />} />
      </div>
    );
  }
  const stats = await getCachedProgressStats(userId);
  return (
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
  );
}

async function RecentActivitySection({ userId }: { userId?: string }) {
  const recentActivity = userId ? await getRecentActivity(userId) : [];

  return (
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
            );
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
  );
}

async function MistakeSummarySection({ userId }: { userId?: string }) {
  if (!userId) return null;
  const stats = await getCachedProgressStats(userId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground font-outfit">Mistake Book</h2>
      </div>
      
      <div className="bg-card-bg border border-card-border rounded-2xl p-5 flex flex-col min-h-[200px]">
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
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

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
        
        <Suspense fallback={null}>
          <StreakBadge userId={user?.id} />
        </Suspense>
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
      <Suspense fallback={<ContinueLearningSkeleton />}>
        <ContinueLearningSection userId={user?.id} />
      </Suspense>

      {/* Quick Progress Section */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 font-outfit">Your Progress</h2>
        <Suspense fallback={<ProgressMetricsSkeleton />}>
          <ProgressMetricsSection userId={user?.id} />
        </Suspense>
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
          
          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivitySection userId={user?.id} />
          </Suspense>
        </div>

        {/* Right Column: Mistake Book & Short Notes */}
        {user && (
          <div className="space-y-8">
            {/* Mistake Book Summary */}
            <Suspense fallback={<MistakeSummarySkeleton />}>
              <MistakeSummarySection userId={user.id} />
            </Suspense>

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
