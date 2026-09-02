'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { Loader2, Search, BookOpen, RotateCcw, AlertCircle, BookMarked, CheckCircle2 } from 'lucide-react';
import PracticeModal from '@/components/PracticeModal';
import { SCIENCE_CHAPTERS, MATHS_CHAPTERS } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';

type Mistake = {
  id: string;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  chapter: string;
  topic: string;
  mistake_category: string | null;
  mistake_summary: string;
  occurrence_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  last_reviewed_at: string | null;
};

export default function MistakeBookPage() {
  const [user, setUser] = useState<any>('loading');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [chapterFilter, setChapterFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sort, setSort] = useState('needs_review');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [practiceMistakeId, setPracticeMistakeId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (user && user !== 'loading') {
      fetchMistakes();
    }
  }, [user, search, chapterFilter, topicFilter, statusFilter, categoryFilter, sort]);

  const fetchMistakes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (subjectFilter !== 'All') params.append('subject', subjectFilter);
      if (chapterFilter !== 'All') params.append('chapter', chapterFilter);
      if (topicFilter !== 'All') params.append('topic', topicFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      params.append('sort', sort);

      const res = await fetch(`/api/mistake-book?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMistakes(data.mistakes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (id: string, currentStatus: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id && currentStatus === 'new') {
      try {
        await fetch('/api/mistake-book', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'reviewed' })
        });
        setMistakes(prev => prev.map(m => m.id === id ? { ...m, status: 'reviewed' } : m));
      } catch (e) {}
    }
  };
  
  const toReview = mistakes.filter(m => m.status === 'new' || m.status === 'reviewed').length;
  const practicing = mistakes.filter(m => m.status === 'practicing').length;
  const fixed = mistakes.filter(m => m.status === 'fixed').length;

  if (user === 'loading') return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  if (!user) return <AuthPrompt />;

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full font-sans mb-8">
      <div className="mb-10">
         <PageHeader title="My Mistake Book" backHref="/progress" />
         <p className="text-foreground/60 ml-[3.25rem] -mt-2">Turn your mistakes into your strongest topics.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10">
        <div className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold font-outfit text-foreground mb-1">{toReview}</div>
          <div className="text-xs sm:text-sm font-bold text-foreground/50 uppercase tracking-wider">To Review</div>
        </div>
        <div className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold font-outfit text-primary-500 mb-1">{practicing}</div>
          <div className="text-xs sm:text-sm font-bold text-foreground/50 uppercase tracking-wider">Practicing</div>
        </div>
        <div className="bg-card-bg border border-card-border rounded-3xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold font-outfit text-accent-emerald-500 mb-1">{fixed}</div>
          <div className="text-xs sm:text-sm font-bold text-foreground/50 uppercase tracking-wider">Fixed</div>
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-3xl p-4 sm:p-5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Search mistakes..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-background border border-card-border rounded-xl outline-none focus:ring-1 focus:ring-primary-500 text-sm transition-all text-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setChapterFilter('All'); }} className="bg-background border border-card-border rounded-xl px-4 py-3 text-sm outline-none font-medium text-foreground">
            <option value="All">All Subjects</option>
            <option value="Science">Science</option>
            <option value="Mathematics">Mathematics</option>
          </select>
          <select value={chapterFilter} onChange={e => setChapterFilter(e.target.value)} className="bg-background border border-card-border rounded-xl px-4 py-3 text-sm outline-none font-medium text-foreground max-w-[150px] truncate">
            <option value="All">All Chapters</option>
            {subjectFilter !== 'Mathematics' && SCIENCE_CHAPTERS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            {subjectFilter !== 'Science' && MATHS_CHAPTERS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-background border border-card-border rounded-xl px-4 py-3 text-sm outline-none font-medium text-foreground">
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Practicing">Practicing</option>
            <option value="Fixed">Fixed</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-background border border-card-border rounded-xl px-4 py-3 text-sm outline-none font-medium text-foreground">
            <option value="needs_review">Needs Review</option>
            <option value="recent">Most Recent</option>
            <option value="repeated">Most Repeated</option>
            <option value="recently_fixed">Recently Fixed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : mistakes.length === 0 ? (
           <div className="bg-card-bg/50 p-12 sm:p-16 rounded-3xl border border-dashed border-card-border text-center max-w-2xl mx-auto w-full flex flex-col items-center">
             {search || chapterFilter !== 'All' || statusFilter !== 'All' ? (
               <p className="text-foreground/50 font-medium">No mistakes found matching your filters.</p>
             ) : (
               <>
                 <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mb-6 border border-card-border">
                   <BookMarked className="w-8 h-8 text-foreground/40" />
                 </div>
                 <h3 className="text-xl font-bold font-outfit text-foreground mb-3">Your Mistake Book is empty.</h3>
                 <p className="text-foreground/50 mb-8 max-w-sm">That's a good thing—for now. Complete a test or check an answer to build your personal revision list.</p>
                 <a href="/custom-test" className="px-8 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm tap-scale">Take a Test</a>
               </>
             )}
           </div>
        ) : (
          mistakes.map(mistake => (
            <div key={mistake.id} className="bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-sm hover:border-primary-500/30 transition-colors group">
              <div 
                className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5"
                onClick={() => handleExpand(mistake.id, mistake.status)}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-background text-foreground/60 border border-card-border">
                      {mistake.chapter}
                    </span>
                    {mistake.mistake_category && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-accent-amber-500/10 text-accent-amber-500 border border-accent-amber-500/20">
                        {mistake.mistake_category}
                      </span>
                    )}
                    {mistake.occurrence_count > 1 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> {mistake.occurrence_count}x Repeated
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground leading-snug">{mistake.mistake_summary}</h3>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 md:pl-6 md:border-l border-card-border">
                  <span className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    mistake.status === 'fixed' ? 'bg-accent-emerald-500/10 text-accent-emerald-500 border-accent-emerald-500/20' :
                    mistake.status === 'practicing' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' :
                    mistake.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-accent-amber-500/10 text-accent-amber-500 border-accent-amber-500/20'
                  }`}>
                    {mistake.status === 'fixed' && <CheckCircle2 className="w-4 h-4" />}
                    {mistake.status === 'practicing' && <RotateCcw className="w-4 h-4" />}
                    {mistake.status === 'reviewed' && <BookOpen className="w-4 h-4" />}
                    {mistake.status === 'new' && <AlertCircle className="w-4 h-4" />}
                    {mistake.status.charAt(0).toUpperCase() + mistake.status.slice(1)}
                  </span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPracticeMistakeId(mistake.id); }}
                    className="px-5 py-2.5 bg-background text-foreground border border-card-border rounded-xl text-sm font-bold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 tap-scale"
                  >
                    Practice This
                  </button>
                </div>
              </div>
              
              {expandedId === mistake.id && (
                <div className="p-5 sm:p-6 border-t border-card-border bg-background space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">Original Question</span>
                    <p className="text-foreground font-medium">{mistake.question_text}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card-bg p-5 rounded-2xl border border-red-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 block">Your Answer</span>
                      <p className="text-foreground/80 whitespace-pre-wrap">{mistake.student_answer || '(Empty)'}</p>
                    </div>
                    <div className="bg-card-bg p-5 rounded-2xl border border-accent-emerald-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-accent-emerald-500"></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-accent-emerald-500 mb-2 block">Correct Answer</span>
                      <p className="text-foreground/80 whitespace-pre-wrap">{mistake.correct_answer}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPracticeMistakeId(mistake.id); }}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm md:hidden tap-scale"
                    >
                      Practice This
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {practiceMistakeId && (
         <PracticeModal 
           isOpen={!!practiceMistakeId} 
           mistakeId={practiceMistakeId} 
           onClose={() => setPracticeMistakeId(null)}
           onComplete={(newStatus) => {
             setMistakes(prev => prev.map(m => m.id === practiceMistakeId ? { ...m, status: newStatus } : m));
           }}
         />
      )}
    </div>
  );
}
