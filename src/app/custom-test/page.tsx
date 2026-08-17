'use client';
import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, XCircle, AlertCircle, Loader2, Play, Bot } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { useEffect } from 'react';

const ALL_CHAPTERS = [
  'Chemical Reactions and Equations',
  'Acids, Bases and Salts',
  'Metals and Non-metals',
  'Carbon and its Compounds',
  'Life Processes',
  'Control and Coordination',
  'How do Organisms Reproduce?',
  'Heredity',
  'Light - Reflection and Refraction',
  'The Human Eye and the Colourful World',
  'Electricity',
  'Magnetic Effects of Electric Current',
  'Our Environment'
];

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
          subject: 'Science',
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

  if (user === 'loading') {
     return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }
  
  if (!user) {
     return <AuthPrompt />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 w-full font-sans">
      <div className="max-w-4xl mx-auto w-full">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Create a Test
            </h1>
          </div>
          {view !== 'SETUP' && (
             <button onClick={() => {
               if (window.confirm("Are you sure you want to quit this test? Progress will be lost.")) setView('SETUP');
             }} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
               Quit Test
             </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
          
          {view === 'SETUP' && (
            <div className="space-y-8">
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">1. Select Chapters</h3>
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={() => setSelectedChapters(ALL_CHAPTERS)}
                    className="text-sm px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg transition-colors"
                  >Select All Science</button>
                  <button 
                    onClick={() => setSelectedChapters([])}
                    className="text-sm px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors"
                  >Clear All</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ALL_CHAPTERS.map(ch => {
                    const isSelected = selectedChapters.includes(ch);
                    const btnClass = isSelected 
                      ? "text-left px-4 py-3 rounded-xl border transition-all border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                      : "text-left px-4 py-3 rounded-xl border transition-all border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600";
                    
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Number of Questions</h3>
                  <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500">
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions (Max)</option>
                  </select>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Difficulty</h3>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Mixed</option>
                  </select>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Question Type</h3>
                  <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500">
                    <option>MCQ</option>
                    <option>Short Answer</option>
                    <option>Numerical</option>
                    <option>Assertion-Reason</option>
                    <option>Mixed</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-lg shadow-sm"
                >
                  <Play className="w-5 h-5 fill-current" /> Generate NCERT Test
                </button>
              </div>
            </div>
          )}

          {view === 'GENERATING' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Crafting your test...</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                RankUp AI is retrieving verified NCERT knowledge chunks and formulating grounded questions. This may take a few moments.
              </p>
            </div>
          )}

          {view === 'TAKING' && currentQ && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Question {currentQuestionIdx + 1} of {questions.length}</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">{currentQ.type}</span>
              </div>

              <div className="text-xl text-slate-900 dark:text-white font-medium leading-relaxed">
                {currentQ.question}
              </div>

              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = userAnswers[currentQ.id] === opt;
                    const optClass = isSelected
                      ? "w-full text-left px-5 py-4 rounded-xl border transition-all border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-600"
                      : "w-full text-left px-5 py-4 rounded-xl border transition-all border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600";
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(opt)}
                        className={optClass}
                      >
                        <span className="font-medium mr-3 text-slate-400">{String.fromCharCode(65 + i)}.</span> {opt}
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
                    className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="flex items-center gap-2 px-5 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>

                {currentQuestionIdx === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors"
                  >
                    Submit Test <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-medium transition-colors"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {view === 'EVALUATING' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Evaluating your answers...</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Securely computing your results on the server.
              </p>
            </div>
          )}

          {view === 'RESULTS' && (
            <div className="space-y-8 text-center max-w-2xl mx-auto py-8">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Test Complete!</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                You scored <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span> out of {questions.length}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 mb-1">Percentage</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{percentage}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 mb-1">Weakest Topic</p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 line-clamp-1">{weakestTopic || 'None'}</p>
                </div>
              </div>

              <div className="mt-8 text-left">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Chapter Accuracy</h3>
                <div className="space-y-3">
                  {Object.entries(chapterAccuracy).map(([ch, acc]) => {
                    const accClass = acc >= 80 ? 'text-emerald-600' : acc >= 50 ? 'text-amber-600' : 'text-rose-600';
                    return (
                      <div key={ch} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ch}</span>
                        <span className={"font-bold " + accClass}>{acc}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4">
                <button
                  onClick={() => setView('SETUP')}
                  className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                >
                  Create New Test
                </button>
                <button
                  onClick={() => setView('REVIEW')}
                  className="px-8 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors"
                >
                  Review Answers
                </button>
              </div>
            </div>
          )}

          {view === 'REVIEW' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Answer Review</h2>
                <button onClick={() => setView('RESULTS')} className="text-indigo-600 hover:text-indigo-700 font-medium">Back to Results</button>
              </div>

              <div className="space-y-6">
                {evaluatedQuestions.map((q, idx) => {
                  const uAns = userAnswers[q.id] || '';
                  const helpText = 'I got a test question wrong. The question was: "' + q.question + '". I answered "' + (uAns || 'nothing') + '", but the correct answer is "' + q.correctAnswer + '". Can you help me understand why?';

                  return (
                    <div key={q.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 mt-1">
                          {q.isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-rose-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Question {idx + 1} &bull; {q.chapter} ({q.topic})</p>
                          <p className="text-lg font-medium text-slate-900 dark:text-white mb-4">{q.question}</p>
                          
                          <div className="space-y-3 mb-6">
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                              <p className="text-xs text-slate-400 mb-1">Your Answer:</p>
                              <p className={"font-medium " + (q.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                {uAns || <span className="italic opacity-50">Not answered</span>}
                              </p>
                            </div>
                            
                            {!q.isCorrect && (
                              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                <p className="text-xs text-indigo-400 mb-1">Correct Answer:</p>
                                <p className="font-medium text-indigo-700 dark:text-indigo-300">{q.correctAnswer}</p>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                            <span className="font-semibold block mb-2 text-slate-900 dark:text-white">Explanation:</span>
                            {q.explanation}
                          </div>

                          {!q.isCorrect && (
                            <div className="flex justify-end">
                              <Link 
                                href={"/tutor?prefill=" + encodeURIComponent(helpText)}
                                target="_blank"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/70 rounded-lg text-sm font-medium transition-colors"
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
