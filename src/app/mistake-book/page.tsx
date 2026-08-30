'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { Loader2, Search, BookOpen, RotateCcw, AlertCircle, BookMarked, CheckCircle2 } from 'lucide-react';
import PracticeModal from '@/components/PracticeModal';
import { SCIENCE_CHAPTERS, MATHS_CHAPTERS } from '@/lib/constants';

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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 max-w-5xl mx-auto w-full font-sans">
      <div className="mb-10">
         <h1 className="text-3xl font-bold font-outfit text-stone-900 dark:text-stone-100 flex items-center gap-3 mb-3">
           <BookMarked className="w-8 h-8 text-amber-500" />
           My Mistake Book
         </h1>
         <p className="text-stone-500 dark:text-stone-400">Turn your mistakes into your strongest topics.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-1">{toReview}</div>
          <div className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">To Review</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold font-outfit text-teal-600 dark:text-teal-400 mb-1">{practicing}</div>
          <div className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Practicing</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold font-outfit text-emerald-600 dark:text-emerald-400 mb-1">{fixed}</div>
          <div className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Fixed</div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search mistakes..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setChapterFilter('All'); }} className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-stone-700 dark:text-stone-300">
            <option value="All">All Subjects</option>
            <option value="Science">Science</option>
            <option value="Mathematics">Mathematics</option>
          </select>
          <select value={chapterFilter} onChange={e => setChapterFilter(e.target.value)} className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-stone-700 dark:text-stone-300">
            <option value="All">All Chapters</option>
            {subjectFilter !== 'Mathematics' && SCIENCE_CHAPTERS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            {subjectFilter !== 'Science' && MATHS_CHAPTERS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-stone-700 dark:text-stone-300">
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Practicing">Practicing</option>
            <option value="Fixed">Fixed</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-stone-700 dark:text-stone-300">
            <option value="needs_review">Needs Review</option>
            <option value="recent">Most Recent</option>
            <option value="repeated">Most Repeated</option>
            <option value="recently_fixed">Recently Fixed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
        ) : mistakes.length === 0 ? (
           <div className="bg-stone-50 dark:bg-stone-800/30 p-12 sm:p-16 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 text-center max-w-2xl mx-auto w-full flex flex-col items-center">
             {search || chapterFilter !== 'All' || statusFilter !== 'All' ? (
               <p className="text-stone-500 font-medium">No mistakes found matching your filters.</p>
             ) : (
               <>
                 <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-6">
                   <BookMarked className="w-8 h-8 text-stone-400 dark:text-stone-500" />
                 </div>
                 <h3 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-3">Your Mistake Book is empty.</h3>
                 <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm">That's a good thing—for now. Complete a test or check an answer to build your personal revision list.</p>
                 <a href="/custom-test" className="px-8 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">Take a Test</a>
               </>
             )}
           </div>
        ) : (
          mistakes.map(mistake => (
            <div key={mistake.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm hover:border-teal-500/30 transition-colors group">
              <div 
                className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5"
                onClick={() => handleExpand(mistake.id, mistake.status)}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {mistake.chapter}
                    </span>
                    {mistake.mistake_category && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        {mistake.mistake_category}
                      </span>
                    )}
                    {mistake.occurrence_count > 1 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> {mistake.occurrence_count}x Repeated
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100 leading-snug">{mistake.mistake_summary}</h3>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 md:pl-6 md:border-l border-stone-100 dark:border-stone-800">
                  <span className={`text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    mistake.status === 'fixed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    mistake.status === 'practicing' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                    mistake.status === 'reviewed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {mistake.status === 'fixed' && <CheckCircle2 className="w-4 h-4" />}
                    {mistake.status === 'practicing' && <RotateCcw className="w-4 h-4" />}
                    {mistake.status === 'reviewed' && <BookOpen className="w-4 h-4" />}
                    {mistake.status === 'new' && <AlertCircle className="w-4 h-4" />}
                    {mistake.status.charAt(0).toUpperCase() + mistake.status.slice(1)}
                  </span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPracticeMistakeId(mistake.id); }}
                    className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-sm font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                  >
                    Practice This
                  </button>
                </div>
              </div>
              
              {expandedId === mistake.id && (
                <div className="p-5 sm:p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 block">Original Question</span>
                    <p className="text-stone-900 dark:text-stone-100 font-medium">{mistake.question_text}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-400 dark:bg-red-600"></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2 block">Your Answer</span>
                      <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{mistake.student_answer || '(Empty)'}</p>
                    </div>
                    <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 dark:bg-emerald-600"></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 block">Correct Answer</span>
                      <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{mistake.correct_answer}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPracticeMistakeId(mistake.id); }}
                      className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm md:hidden"
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
