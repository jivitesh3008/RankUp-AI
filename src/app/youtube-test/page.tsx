'use client';
import { useState } from 'react';
import { PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, XCircle, AlertCircle, Loader2, Play, Bot, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AuthPrompt from '@/components/AuthPrompt';
import { useEffect } from 'react';

type Question = {
  id: string;
  type: 'MCQ' | 'Short Answer' | 'Numerical' | 'Assertion-Reason';
  question: string;
  options?: string[];
  answerToken: string;
  sourceSection?: string;
};

type EvaluatedQuestion = Question & {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

type TestState = 'SETUP' | 'GENERATING' | 'TAKING' | 'EVALUATING' | 'RESULTS' | 'REVIEW';

export default function YouTubeTestPage() {
  const [user, setUser] = useState<any>('loading');
  const [view, setView] = useState<TestState>('SETUP');
  
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [questionType, setQuestionType] = useState<string>('MCQ');
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [testTitle, setTestTitle] = useState<string>('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  
  const [evaluatedQuestions, setEvaluatedQuestions] = useState<EvaluatedQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  const handleGenerate = async () => {
    if (!videoUrl.trim()) {
      setError('Please paste a YouTube URL.');
      return;
    }
    setError(null);
    setView('GENERATING');

    try {
      const res = await fetch('/api/generate-youtube-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
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
        throw new Error('No questions could be generated from the video transcript.');
      }

      setQuestions(data.questions);
      setTestTitle(data.title || 'Video Assessment');
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
      // Reuse the existing evaluation endpoint securely
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
              <PlayCircle className="w-6 h-6 text-red-600" />
              Test Yourself on a Video
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Paste a lecture you've watched and see how well you understood it.</p>
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
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">1. YouTube URL</h3>
                <input 
                  type="text" 
                  value={videoUrl} 
                  onChange={(e) => setVideoUrl(e.target.value)} 
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">2. Number of Questions</h3>
                  <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500">
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">3. Difficulty</h3>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Mixed</option>
                  </select>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">4. Question Type</h3>
                  <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500">
                    <option>MCQ</option>
                    <option>Short Answer</option>
                    <option>Mixed</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-lg shadow-sm"
                  disabled={!videoUrl.trim()}
                >
                  <Play className="w-5 h-5 fill-current" /> Create Test
                </button>
              </div>
            </div>
          )}

          {view === 'GENERATING' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-8 h-8 text-red-600 dark:text-red-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analyzing video...</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                RankUp AI is extracting the transcript and generating a test strictly based on the video content. This may take a few moments.
              </p>
            </div>
          )}

          {view === 'TAKING' && currentQ && (
            <div className="space-y-8">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-indigo-500" /> Test based on: {testTitle}</span>
              </div>
              
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                  className="flex items-center gap-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                
                {currentQuestionIdx === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Grading your test...</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Securely evaluating your answers.
              </p>
            </div>
          )}

          {view === 'RESULTS' && (
            <div className="space-y-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 mb-6 border-8 border-slate-100 dark:border-slate-700 shadow-inner">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{percentage}%</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Test Complete</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">You scored {score} out of {questions.length}</p>
              </div>

              <div className="flex justify-center gap-4">
                 <button onClick={() => setView('REVIEW')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium">
                   Review Answers
                 </button>
                 <button onClick={() => { setView('SETUP'); setVideoUrl(''); }} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium">
                   Take Another Test
                 </button>
              </div>
            </div>
          )}

          {view === 'REVIEW' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Answers</h2>
                <button onClick={() => setView('RESULTS')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Back to Results</button>
              </div>

              <div className="space-y-6">
                {evaluatedQuestions.map((q, idx) => (
                  <div key={q.id} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="mt-1 shrink-0">
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Question {idx + 1}</span>
                        <h4 className="text-lg font-medium text-slate-900 dark:text-white">{q.question}</h4>
                      </div>
                    </div>
                    
                    <div className="ml-10 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Your Answer</span>
                          <span className={`font-medium ${q.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                            {userAnswers[q.id] || '(Skipped)'}
                          </span>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Correct Answer</span>
                          <span className="font-medium text-slate-900 dark:text-white">{q.correctAnswer}</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <span className="flex items-center gap-2 text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                          <BookOpen className="w-4 h-4" /> Explanation
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
                      </div>

                      {q.sourceSection && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Review this part of the video: <span className="font-bold">{q.sourceSection}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
