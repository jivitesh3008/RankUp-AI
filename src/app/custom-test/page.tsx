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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 w-full font-sans">
      <div className="max-w-4xl mx-auto w-full">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-stone-900 dark:text-stone-100">
              Create a Test
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">Configure your personalized quiz.</p>
          </div>
          {view !== 'SETUP' && (
             <button onClick={() => {
               if (window.confirm("Are you sure you want to quit this test? Progress will be lost.")) setView('SETUP');
             }} className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition-colors border border-stone-200 dark:border-stone-800 shadow-sm">
               Quit Test
             </button>
          )}
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
          
          {view === 'SETUP' && (
            <div className="space-y-8">
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-4">
                  <h3 className="text-lg font-semibold font-outfit text-stone-900 dark:text-stone-100">1. Select Subject & Chapters</h3>
                  
                  <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-full sm:w-auto self-start">
                    <button 
                      onClick={() => { setSubject('Science'); setSelectedChapters([]); }}
                      className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${subject === 'Science' ? 'bg-white dark:bg-stone-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                    >
                      Science
                    </button>
                    <button 
                      onClick={() => { setSubject('Mathematics'); setSelectedChapters([]); }}
                      className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${subject === 'Mathematics' ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                    >
                      Mathematics
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setSelectedChapters(AVAILABLE_CHAPTERS)}
                    className="text-sm px-4 py-2 font-medium bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300 rounded-lg transition-colors"
                  >Select All</button>
                  <button 
                    onClick={() => setSelectedChapters([])}
                    className="text-sm px-4 py-2 font-medium bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 rounded-lg transition-colors"
                  >Clear</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_CHAPTERS.map(ch => {
                    const isSelected = selectedChapters.includes(ch);
                    const btnClass = isSelected 
                      ? (subject === 'Science' 
                          ? "text-left px-4 py-3 rounded-xl border transition-all border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 shadow-sm"
                          : "text-left px-4 py-3 rounded-xl border transition-all border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 shadow-sm")
                      : "text-left px-4 py-3 rounded-xl border transition-all border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700";
                    
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

              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 space-y-6">
                <h3 className="text-lg font-semibold font-outfit text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-stone-400" />
                  2. Configure Test
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3 uppercase tracking-wider">Questions</p>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 20].map(n => (
                        <SelectionButton key={n} active={questionCount === n} onClick={() => setQuestionCount(n)}>
                          {n}
                        </SelectionButton>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3 uppercase tracking-wider">Difficulty</p>
                    <div className="flex flex-wrap gap-2">
                      {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => (
                        <SelectionButton key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                          {d}
                        </SelectionButton>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3 uppercase tracking-wider">Type</p>
                    <div className="flex flex-wrap gap-2">
                      {['MCQ', 'Short Answer', 'Mixed'].map(t => (
                        <SelectionButton key={t} active={questionType === t} onClick={() => setQuestionType(t)}>
                          {t}
                        </SelectionButton>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium shadow-sm"
                >
                  <Play className="w-5 h-5 fill-current" /> Generate Test
                </button>
              </div>
            </div>
          )}

          {view === 'GENERATING' && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-2">Crafting your test...</h2>
              <p className="text-stone-500 dark:text-stone-400 max-w-md">
                Reviewing NCERT knowledge and formulating grounded questions. This may take a moment.
              </p>
            </div>
          )}

          {view === 'TAKING' && currentQ && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Question {currentQuestionIdx + 1} of {questions.length}</span>
                  <div className="w-32 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden hidden sm:block">
                     <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`}}></div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold rounded-full">{currentQ.type}</span>
              </div>

              <div className="text-xl text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                {currentQ.question}
              </div>

              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = userAnswers[currentQ.id] === opt;
                    const optClass = isSelected
                      ? "w-full text-left px-5 py-4 rounded-xl border transition-all border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 shadow-sm"
                      : "w-full text-left px-5 py-4 rounded-xl border transition-all border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600";
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(opt)}
                        className={optClass}
                      >
                        <span className="font-medium mr-3 text-stone-400">{String.fromCharCode(65 + i)}.</span> {opt}
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
                    className="w-full h-40 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-5 py-4 text-stone-900 dark:text-stone-100 outline-none focus:border-teal-500 resize-none shadow-sm transition-shadow"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-8 border-t border-stone-100 dark:border-stone-800">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="flex items-center gap-2 px-5 py-3 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 rounded-xl disabled:opacity-50 transition-colors font-medium"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>

                {currentQuestionIdx === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium transition-colors shadow-sm"
                  >
                    Submit Test <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-xl font-medium transition-colors shadow-sm"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {view === 'EVALUATING' && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-2">Evaluating your answers...</h2>
              <p className="text-stone-500 dark:text-stone-400 max-w-md">
                Securely computing your results.
              </p>
            </div>
          )}

          {view === 'RESULTS' && (
            <div className="space-y-8 text-center max-w-2xl mx-auto py-8">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-2">Test Complete</h2>
                <p className="text-lg text-stone-600 dark:text-stone-400">
                  You scored <span className="font-bold text-teal-600 dark:text-teal-400">{score}</span> out of {questions.length}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Accuracy</p>
                  <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">{percentage}%</p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Needs Practice</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 line-clamp-1 mt-1">{weakestTopic || 'None'}</p>
                </div>
              </div>

              <div className="mt-8 text-left">
                <h3 className="text-lg font-semibold font-outfit text-stone-900 dark:text-stone-100 mb-4">Chapter Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(chapterAccuracy).map(([ch, acc]) => {
                    const accClass = acc >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 
                                     acc >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30' : 
                                     'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30';
                    return (
                      <div key={ch} className={`flex items-center justify-between p-4 rounded-xl border ${accClass}`}>
                        <span className="font-medium">{ch}</span>
                        <span className="font-bold">{acc}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setView('SETUP')}
                  className="px-6 py-3 text-stone-700 bg-stone-100 hover:bg-stone-200 dark:text-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl font-medium transition-colors"
                >
                  Create New Test
                </button>
                <button
                  onClick={() => setView('REVIEW')}
                  className="px-8 py-3 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium transition-colors shadow-sm"
                >
                  Review Answers
                </button>
              </div>
            </div>
          )}

          {view === 'REVIEW' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
                <h2 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-stone-400" />
                  Answer Review
                </h2>
                <button onClick={() => setView('RESULTS')} className="text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Back to Results</button>
              </div>

              <div className="space-y-6">
                {evaluatedQuestions.map((q, idx) => {
                  const uAns = userAnswers[q.id] || '';
                  const helpText = 'I got a test question wrong. The question was: "' + q.question + '". I answered "' + (uAns || 'nothing') + '", but the correct answer is "' + q.correctAnswer + '". Can you help me understand why?';

                  return (
                    <div key={q.id} className="p-6 bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-stone-200 dark:border-stone-800">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-1">
                          {q.isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wider">Question {idx + 1} &bull; {q.chapter}</p>
                          <p className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-4">{q.question}</p>
                          
                          <div className="space-y-3 mb-6">
                            <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium uppercase tracking-wider">Your Answer</p>
                              <p className={"font-medium " + (q.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
                                {uAns || <span className="italic opacity-50">Not answered</span>}
                              </p>
                            </div>
                            
                            {!q.isCorrect && (
                              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30 shadow-sm">
                                <p className="text-xs text-teal-600 dark:text-teal-400 mb-1 font-medium uppercase tracking-wider">Correct Answer</p>
                                <p className="font-medium text-teal-800 dark:text-teal-300">{q.correctAnswer}</p>
                              </div>
                            )}
                          </div>

                          <div className="bg-stone-100 dark:bg-stone-900/80 p-5 rounded-xl text-stone-700 dark:text-stone-300 text-sm leading-relaxed mb-4 border border-stone-200 dark:border-stone-800">
                            <span className="font-semibold block mb-1 text-stone-900 dark:text-stone-100">Explanation</span>
                            {q.explanation}
                          </div>

                          {!q.isCorrect && (
                            <div className="flex justify-end">
                              <Link 
                                href={"/tutor?prefill=" + encodeURIComponent(helpText)}
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 rounded-lg text-sm font-medium transition-colors border border-stone-300 dark:border-stone-700 shadow-sm"
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
    </div>
  );
}
