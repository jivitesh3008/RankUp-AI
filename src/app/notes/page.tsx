'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, ArrowLeft, Loader2, Zap, AlertCircle, PenTool, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MathRenderer } from '@/components/MathRenderer';
import { MobileBottomNav } from '@/components/MobileBottomNav';

interface ChapterNote {
  id: string;
  subject: string;
  chapter: string;
  title: string;
  overview: string;
  sections: Array<{ type: string; title: string; points: string[] }>;
  important_formulas: Array<{ formula: string; explanation: string }>;
  important_equations: Array<{ equation: string; explanation: string }>;
  common_mistakes: string[];
  exam_tips: string[];
  revision_points: string[];
  created_at: string;
}

export default function ShortNotesPage() {
  const [notes, setNotes] = useState<ChapterNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Science' | 'Mathematics'>('All');
  
  const [selectedNote, setSelectedNote] = useState<ChapterNote | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/chapter-notes');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (activeFilter !== 'All' && n.subject !== activeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.chapter.toLowerCase().includes(query) ||
          n.overview.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [notes, activeFilter, searchQuery]);

  if (selectedNote) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-card-border p-4 sm:p-6">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button 
              onClick={() => setSelectedNote(null)}
              className="p-2 -ml-2 text-foreground/50 hover:text-foreground hover:bg-card-border rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-outfit text-foreground line-clamp-1">{selectedNote.title}</h1>
              <p className="text-xs font-medium text-foreground/50">{selectedNote.subject} • Class 10</p>
            </div>
            <div className="ml-auto text-xs font-bold text-foreground/40 bg-card-border px-2.5 py-1 rounded-md hidden sm:block">
              ~5 min read
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <section>
            <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">Overview</h2>
            <p className="text-foreground/80 leading-relaxed text-lg">{selectedNote.overview}</p>
          </section>

          {selectedNote.sections && selectedNote.sections.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Key Concepts</h2>
              {selectedNote.sections.map((section, idx) => (
                <div key={idx} className="bg-card-bg border border-card-border rounded-2xl p-5 sm:p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 font-outfit">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.points.map((pt, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                        <div className="prose prose-base dark:prose-invert max-w-none text-foreground/80 leading-snug [&_.math-display]:overflow-x-auto">
                          <MathRenderer content={pt} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {selectedNote.important_formulas && selectedNote.important_formulas.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Important Formulas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedNote.important_formulas.map((f, i) => (
                  <div key={i} className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 text-center flex flex-col justify-center">
                    <div className="prose prose-lg dark:prose-invert max-w-none mb-2 overflow-x-auto text-teal-800 dark:text-teal-200 font-medium [&_.math-display]:overflow-x-auto [&_.math-display]:overflow-y-hidden [&_.math-display]:scrollbar-thin [&_.math-display]:pb-2">
                       <MathRenderer content={f.formula} isBlock={true} isPureMath={true} />
                    </div>
                    <p className="text-xs text-foreground/60">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {selectedNote.important_equations && selectedNote.important_equations.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Important Equations</h2>
              <div className="space-y-3">
                {selectedNote.important_equations.map((e, i) => (
                  <div key={i} className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="prose prose-base dark:prose-invert max-w-none flex-1 overflow-x-auto text-cyan-800 dark:text-cyan-200 font-medium whitespace-nowrap [&_.math-display]:overflow-x-auto [&_.math-display]:overflow-y-hidden [&_.math-display]:scrollbar-thin [&_.math-display]:pb-2 [&_.math-display]:my-0">
                       <MathRenderer content={e.equation} isBlock={true} isPureMath={true} />
                    </div>
                    <p className="text-sm text-foreground/60 sm:max-w-[50%]">{e.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {selectedNote.common_mistakes && selectedNote.common_mistakes.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Common Mistakes</h2>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 sm:p-6">
                <ul className="space-y-3">
                  {selectedNote.common_mistakes.map((mistake, i) => (
                    <li key={i} className="flex gap-3 text-red-900 dark:text-red-200/90">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-500/70" />
                      <div className="prose prose-base dark:prose-invert max-w-none text-sm leading-snug [&_.math-display]:overflow-x-auto">
                         <MathRenderer content={mistake} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {selectedNote.exam_tips && selectedNote.exam_tips.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Exam Tips</h2>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 sm:p-6">
                <ul className="space-y-3">
                  {selectedNote.exam_tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-amber-900 dark:text-amber-200/90">
                      <Zap className="w-5 h-5 shrink-0 text-amber-500/70" />
                      <div className="prose prose-base dark:prose-invert max-w-none text-sm leading-snug [&_.math-display]:overflow-x-auto">
                         <MathRenderer content={tip} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {selectedNote.revision_points && selectedNote.revision_points.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">Quick Revision</h2>
              <ul className="space-y-3 pl-2 border-l-2 border-primary-500/30">
                {selectedNote.revision_points.map((pt, i) => (
                  <li key={i} className="pl-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/70 font-medium [&_.math-display]:overflow-x-auto">
                       <MathRenderer content={pt} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="pt-8 pb-12 border-t border-card-border mt-12 space-y-3">
            <h3 className="text-sm font-bold text-foreground mb-4">Ready to test yourself?</h3>
            <Link href={`/custom-test`} className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold shadow-sm tap-scale transition-colors">
              <PenTool className="w-5 h-5" /> Take a Test on {selectedNote.chapter}
            </Link>
            <div className="flex gap-3">
               <Link href={`/tutor`} className="flex-1 bg-card-bg border border-card-border hover:bg-card-border text-foreground rounded-xl py-3.5 flex items-center justify-center font-bold tap-scale transition-colors">
                 Ask a Doubt
               </Link>
               <button onClick={() => setSelectedNote(null)} className="flex-1 bg-background text-foreground/60 hover:text-foreground rounded-xl py-3.5 flex items-center justify-center font-bold tap-scale transition-colors">
                 Back to Notes
               </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-card-border pt-6 pb-4 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-foreground">Short Notes</h1>
          </div>
          <p className="text-foreground/60 text-sm sm:text-base mb-6">Quick, NCERT-focused revision notes for Class 10.</p>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type="text"
              placeholder="Search notes by chapter, topic, or concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card-bg/50 border border-card-border rounded-xl pl-12 pr-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-foreground/40 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
            {['All', 'Science', 'Mathematics'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all tap-scale ${
                  activeFilter === filter
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-card-bg border border-card-border text-foreground/70 hover:text-foreground hover:bg-card-border'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
            <h3 className="text-xl font-bold mb-4">Couldn't load notes.</h3>
            <button 
              onClick={fetchNotes}
              className="bg-card-bg border border-card-border text-foreground font-bold py-2.5 px-6 rounded-xl transition-all tap-scale"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
            <p className="text-foreground/50 font-medium tracking-wider uppercase text-sm">Loading Library</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <BookOpen className="w-16 h-16 text-primary-500/20 mb-6" />
            <h3 className="text-xl font-bold mb-2">No notes found</h3>
            <p className="text-foreground/60">
              {searchQuery ? `Nothing matches "${searchQuery}"` : "The library is currently empty."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-500">
            {filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="group text-left bg-card-bg border border-card-border hover:border-primary-500/30 rounded-2xl p-5 sm:p-6 transition-all duration-300 tap-scale flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${note.subject === 'Science' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                    {note.subject}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-foreground font-outfit mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
                  {note.title}
                </h3>
                
                <p className="text-sm text-foreground/60 line-clamp-3 mb-6 flex-1 leading-relaxed">
                  {note.overview}
                </p>
                
                <div className="flex items-center justify-between text-xs font-bold text-foreground/40 mt-auto pt-4 border-t border-card-border/50">
                  <span>Class 10</span>
                  <div className="flex items-center gap-1 group-hover:text-primary-500 transition-colors">
                    Read Note <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <MobileBottomNav />
    </div>
  );
}
