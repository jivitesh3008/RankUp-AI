'use client';
import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, XCircle, AlertCircle, Loader2, Play, Bot, FileText, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { useEffect } from 'react';

import { SCIENCE_CHAPTERS, MATHS_CHAPTERS } from '@/lib/constants';

type Question = {
  id: string;
  type: 'MCQ' | 'Short Answer' | 'Numerical' | 'Assertion-Reason';
  question: string;
  options?: string[];
  answerToken: string;
  chapter: string;
  topic: string;
};

type EvaluatedQuestion = Question & {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

type TestState = 'SETUP' | 'GENERATING' | 'TAKING' | 'EVALUATING' | 'RESULTS' | 'REVIEW';

export default function CustomTestPage() {
  const [user, setUser] = useState<any>('loading');
  const [view, setView] = useState<TestState>('SETUP');
  
  const [subject, setSubject] = useState<'Science' | 'Mathematics'>('Science');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [questionType, setQuestionType] = useState<string>('MCQ');
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  const [evaluatedQuestions, setEvaluatedQuestions] = useState<EvaluatedQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [weakestTopic, setWeakestTopic] = useState<string>('');
  const [chapterAccuracy, setChapterAccuracy] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  const toggleChapter = (ch: string) => {
    if (selectedChapters.includes(ch)) {
      setSelectedChapters(prev => prev.filter(c => c !== ch));
    } else {
      setSelectedChapters(prev => [...prev, ch]);
    }
  };

  const handleGenerate = async () => {
    if (selectedChapters.length === 0) {
      setError('Please select at least one chapter.');
      return;
    }
    setError(null);
    setView('GENERATING');

    try {
      const res = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          chapters: selectedChapters,
          count: questionCount,
          difficulty,
          questionType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate test.');
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions could be generated from the selected NCERT context.');
      }

      setQuestions(data.questions);
      setUserAnswers({});
      setCurrentQuestionIdx(0);
      setView('TAKING');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
      setView('SETUP');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questions[currentQuestionIdx].id]: answer }));
  };

  const handleSubmitTest = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      const confirmSubmit = window.confirm("You have unanswered questions. Are you sure you want to submit?");
      if (!confirmSubmit) return;
    }

    setView('EVALUATING');
    
    try {
      const res = await fetch('/api/evaluate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          userAnswers
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate test.');
      }

      setScore(data.score);
      setPercentage(data.percentage);
      setWeakestTopic(data.weakestTopic);
      setChapterAccuracy(data.chapterAccuracy);
      setEvaluatedQuestions(data.evaluatedQuestions);

      setView('RESULTS');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An unexpected error occurred during evaluation.');
      setView('TAKING');
    }
  };

  const currentQ = questions[currentQuestionIdx];
  const AVAILABLE_CHAPTERS = subject === 'Science' ? SCIENCE_CHAPTERS : MATHS_CHAPTERS;

  if (user === 'loading') {
     return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }
  
  if (!user) {
     return <AuthPrompt />;
  }

  const SelectionButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button 
      onClick={onClick} 
      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${active ? 'bg-teal-50 border-teal-600 text-teal-800 dark:bg-teal-900/30 dark:border-teal-500/50 dark:text-teal-300' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 dark:bg-stone-800/50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto p-4 sm:p-6 w-full mb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground">
            Create a Test
          </h1>
          <p className="text-foreground/60 mt-1">Configure your personalized quiz.</p>
        </div>
        {view !== 'SETUP' && (
           <button onClick={() => {
             if (window.confirm("Are you sure you want to quit this test? Progress will be lost.")) setView('SETUP');
           }} className="px-4 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-card-border/50 rounded-lg transition-colors border border-card-border shadow-sm tap-scale">
             Quit Test
           </button>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8">
        
        {view === 'SETUP' && (
          <div className="space-y-8">
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl text-sm border border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-4">
                <h3 className="text-lg font-semibold font-outfit text-foreground">1. Select Subject & Chapters</h3>
                
                <div className="flex bg-background border border-card-border p-1 rounded-xl w-full sm:w-auto self-start">
                  <button 
                    onClick={() => { setSubject('Science'); setSelectedChapters([]); }}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${subject === 'Science' ? 'bg-card-bg text-primary-500 shadow-sm' : 'text-foreground/50 hover:text-foreground/80'}`}
                  >
                    Science
                  </button>
                  <button 
                    onClick={() => { setSubject('Mathematics'); setSelectedChapters([]); }}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${subject === 'Mathematics' ? 'bg-card-bg text-primary-500 shadow-sm' : 'text-foreground/50 hover:text-foreground/80'}`}
                  >
                    Mathematics
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => setSelectedChapters(AVAILABLE_CHAPTERS)}
                  className="text-sm px-4 py-2 font-medium bg-primary-500/10 text-primary-500 border border-primary-500/20 hover:bg-primary-500/20 rounded-lg transition-colors tap-scale"
                >Select All</button>
                <button 
                  onClick={() => setSelectedChapters([])}
                  className="text-sm px-4 py-2 font-medium bg-background text-foreground/60 border border-card-border hover:bg-card-border rounded-lg transition-colors tap-scale"
                >Clear</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_CHAPTERS.map(ch => {
                  const isSelected = selectedChapters.includes(ch);
                  const btnClass = isSelected 
                    ? "text-left px-4 py-3 rounded-xl border transition-all border-primary-500 bg-primary-500/10 text-primary-500 shadow-sm"
                    : "text-left px-4 py-3 rounded-xl border transition-all border-card-border bg-background text-foreground/60 hover:border-foreground/30";
                  
                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChapter(ch)}
                      className={btnClass}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-card-border space-y-6">
              <h3 className="text-lg font-semibold font-outfit text-foreground mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-foreground/40" />
                2. Configure Test
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-xs font-bold text-foreground/50 mb-3 uppercase tracking-wider">Questions</p>
                  <div className="flex bg-background border border-card-border p-1 rounded-xl">
                    {[5, 10, 15, 20].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuestionCount(n)}
                        className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                          questionCount === n
                            ? 'bg-card-bg shadow-sm text-foreground' 
                            : 'text-foreground/60 hover:text-foreground'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-foreground/50 mb-3 uppercase tracking-wider">Difficulty</p>
                  <div className="flex bg-background border border-card-border p-1 rounded-xl">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                          difficulty === d
                            ? 'bg-card-bg shadow-sm text-foreground' 
                            : 'text-foreground/60 hover:text-foreground'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-foreground/50 mb-3 uppercase tracking-wider">Type</p>
                  <div className="flex bg-background border border-card-border p-1 rounded-xl">
                    {['MCQ', 'Short Answer', 'Mixed'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setQuestionType(t)}
                        className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                          questionType === t
                            ? 'bg-card-bg shadow-sm text-foreground' 
                            : 'text-foreground/60 hover:text-foreground'
                        }`}
                      >
                        {t === 'Short Answer' ? 'Short' : t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <button
                onClick={handleGenerate}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-lg shadow-primary-500/20 font-bold text-lg w-full sm:w-auto tap-scale"
              >
                Generate Test ✨
              </button>
            </div>
          </div>
        )}

        {view === 'GENERATING' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse border border-primary-500/20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold font-outfit text-foreground mb-2">Crafting your test...</h2>
            <p className="text-foreground/50 max-w-md">
              Reviewing NCERT knowledge and formulating grounded questions. This may take a moment.
            </p>
          </div>
        )}

        {view === 'TAKING' && currentQ && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground/50 uppercase tracking-wider">Question {currentQuestionIdx + 1} of {questions.length}</span>
                <div className="w-32 h-1.5 bg-background rounded-full overflow-hidden hidden sm:block">
                   <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`}}></div>
                </div>
              </div>
              <span className="px-3 py-1 bg-background text-foreground/80 text-xs font-bold rounded-full border border-card-border">{currentQ.type}</span>
            </div>

            <div className="text-xl text-foreground font-medium leading-relaxed">
              {currentQ.question}
            </div>

            {currentQ.options && currentQ.options.length > 0 ? (
              <div className="space-y-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = userAnswers[currentQ.id] === opt;
                  const optClass = isSelected
                    ? "w-full text-left px-5 py-4 rounded-xl border transition-all border-primary-500 bg-primary-500/10 text-primary-500 shadow-sm"
                    : "w-full text-left px-5 py-4 rounded-xl border transition-all border-card-border bg-background text-foreground/80 hover:border-primary-500/50";
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswerSelect(opt)}
                      className={optClass}
                    >
                      <span className="font-bold mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea
                  value={userAnswers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-40 bg-background border border-card-border rounded-xl px-5 py-4 text-foreground outline-none focus:border-primary-500 resize-none shadow-sm transition-shadow"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-8 border-t border-card-border">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className="flex items-center gap-2 px-5 py-3 text-foreground/60 hover:bg-card-border hover:text-foreground rounded-xl disabled:opacity-30 transition-colors font-medium tap-scale"
              >
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>

              {currentQuestionIdx === questions.length - 1 ? (
                <button
                  onClick={handleSubmitTest}
                  className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl font-bold transition-colors shadow-sm tap-scale"
                >
                  Submit Test <CheckCircle2 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-stone-200 rounded-xl font-bold transition-colors shadow-sm tap-scale"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'EVALUATING' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-accent-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse border border-accent-emerald-500/20">
              <Loader2 className="w-8 h-8 text-accent-emerald-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold font-outfit text-foreground mb-2">Evaluating your answers...</h2>
            <p className="text-foreground/50 max-w-md">
              Securely computing your results.
            </p>
          </div>
        )}

        {view === 'RESULTS' && (
          <div className="space-y-8 text-center max-w-2xl mx-auto py-8">
            <div className="w-20 h-20 bg-accent-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-accent-emerald-500" />
            </div>
            <div>
              <h2 className="text-4xl font-bold font-outfit text-foreground mb-2">Test Complete</h2>
              <p className="text-lg text-foreground/60">
                You scored <span className="font-bold text-primary-500">{score}</span> out of {questions.length}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-background p-6 rounded-2xl border border-card-border">
                <p className="text-xs font-bold text-foreground/50 mb-1 uppercase tracking-wider">Accuracy</p>
                <p className="text-3xl font-bold text-foreground">{percentage}%</p>
              </div>
              <div className="bg-background p-6 rounded-2xl border border-card-border">
                <p className="text-xs font-bold text-foreground/50 mb-1 uppercase tracking-wider">Needs Practice</p>
                <p className="text-lg font-bold text-accent-amber-500 line-clamp-1 mt-1">{weakestTopic || 'None'}</p>
              </div>
            </div>

            <div className="mt-8 text-left">
              <h3 className="text-lg font-semibold font-outfit text-foreground mb-4">Chapter Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(chapterAccuracy).map(([ch, acc]) => {
                  const accClass = acc >= 80 ? 'text-accent-emerald-500 bg-accent-emerald-500/10 border-accent-emerald-500/20' : 
                                   acc >= 50 ? 'text-accent-amber-500 bg-accent-amber-500/10 border-accent-amber-500/20' : 
                                   'text-red-400 bg-red-500/10 border-red-500/20';
                  return (
                    <div key={ch} className={`flex items-center justify-between p-4 rounded-xl border ${accClass}`}>
                      <span className="font-medium text-foreground">{ch}</span>
                      <span className="font-bold">{acc}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setView('SETUP')}
                className="px-6 py-3 text-foreground bg-background hover:bg-card-border border border-card-border rounded-xl font-medium transition-colors tap-scale"
              >
                Create New Test
              </button>
              <button
                onClick={() => setView('REVIEW')}
                className="px-8 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl font-medium transition-colors shadow-sm tap-scale"
              >
                Review Answers
              </button>
            </div>
          </div>
        )}

        {view === 'REVIEW' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-card-border pb-4">
              <h2 className="text-2xl font-bold font-outfit text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-foreground/40" />
                Answer Review
              </h2>
              <button onClick={() => setView('RESULTS')} className="text-sm font-medium text-foreground/50 hover:text-foreground transition-colors">Back to Results</button>
            </div>

            <div className="space-y-6">
              {evaluatedQuestions.map((q, idx) => {
                const uAns = userAnswers[q.id] || '';
                const helpText = 'I got a test question wrong. The question was: "' + q.question + '". I answered "' + (uAns || 'nothing') + '", but the correct answer is "' + q.correctAnswer + '". Can you help me understand why?';

                return (
                  <div key={q.id} className="p-6 bg-background rounded-2xl border border-card-border">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-1">
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-accent-emerald-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-accent-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wider">Question {idx + 1} &bull; {q.chapter}</p>
                        <p className="text-lg font-medium text-foreground mb-4">{q.question}</p>
                        
                        <div className="space-y-3 mb-6">
                          <div className="p-4 bg-card-bg rounded-xl border border-card-border shadow-sm">
                            <p className="text-xs text-foreground/40 mb-1 font-bold uppercase tracking-wider">Your Answer</p>
                            <p className={"font-medium " + (q.isCorrect ? 'text-accent-emerald-500' : 'text-accent-amber-500')}>
                              {uAns || <span className="italic opacity-50">Not answered</span>}
                            </p>
                          </div>
                          
                          {!q.isCorrect && (
                            <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20 shadow-sm">
                              <p className="text-xs text-primary-500 mb-1 font-bold uppercase tracking-wider">Correct Answer</p>
                              <p className="font-medium text-primary-400">{q.correctAnswer}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-card-bg p-5 rounded-xl text-foreground/80 text-sm leading-relaxed mb-4 border border-card-border">
                          <span className="font-bold block mb-1 text-foreground">Explanation</span>
                          {q.explanation}
                        </div>

                        {!q.isCorrect && (
                          <div className="flex justify-end">
                            <Link 
                              href={"/tutor?prefill=" + encodeURIComponent(helpText)}
                              target="_blank"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-card-border text-foreground rounded-lg text-sm font-medium transition-colors border border-card-border shadow-sm tap-scale"
                            >
                              <Bot className="w-4 h-4" /> Help me understand
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
