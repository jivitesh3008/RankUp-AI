'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { evaluateNumerical } from '@/lib/evaluate';

type Question = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

export default function PracticeModal({ 
  mistakeId, 
  isOpen, 
  onClose,
  onComplete 
}: { 
  mistakeId: string, 
  isOpen: boolean, 
  onClose: () => void,
  onComplete: (newStatus: string) => void
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && mistakeId) {
      loadPractice();
    }
  }, [isOpen, mistakeId]);

  const loadPractice = async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    setCurrentIndex(0);
    setAnswers({});
    
    try {
      const res = await fetch('/api/mistake-book/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mistake_id: mistakeId })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to load practice questions');
      if (!data.practice || data.practice.length === 0) throw new Error('No practice questions generated');
      
      setQuestions(data.practice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      finishPractice();
    }
  };

  const finishPractice = async () => {
    let correct = 0;
    questions.forEach(q => {
      const uAns = (answers[q.id] || '').trim();
      const cAns = q.correctAnswer;
      
      let isCorrect = false;
      if (q.type === 'Numerical') {
         isCorrect = evaluateNumerical(uAns, cAns);
      } else {
         isCorrect = uAns.toLowerCase() === cAns.trim().toLowerCase();
      }
      if (isCorrect) correct++;
    });
    
    setScore(correct);
    setShowResults(true);
    setUpdating(true);
    
    const newStatus = correct === questions.length ? 'fixed' : 'practicing';
    
    try {
      await fetch('/api/mistake-book', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mistakeId, status: newStatus })
      });
      onComplete(newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <h2 className="text-xl font-bold font-outfit text-stone-900 dark:text-stone-100">Practice My Mistake</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-stone-500 dark:text-stone-400 font-medium">Generating focused practice questions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl inline-block border border-red-100 dark:border-red-900/50">{error}</p>
              <div>
                <button onClick={loadPractice} className="mt-4 px-6 py-2.5 bg-stone-900 dark:bg-white rounded-xl text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 transition-colors">
                  Try Again
                </button>
              </div>
            </div>
          ) : showResults ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 bg-stone-50 dark:bg-stone-800 border-4 border-stone-100 dark:border-stone-700">
                <span className="text-4xl font-bold font-outfit text-stone-900 dark:text-stone-100">{score}<span className="text-2xl text-stone-400">/{questions.length}</span></span>
              </div>
              <h3 className="text-2xl font-bold font-outfit text-stone-900 dark:text-stone-100 mb-2">
                {score === questions.length ? "Great job!" : "Keep practicing."}
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-sm mx-auto">
                {score === questions.length ? "You have successfully demonstrated the concept." : "Review the correct answers below and try again later."}
              </p>
              
              <div className="space-y-6 text-left">
                {questions.map((q, i) => {
                  const uAns = (answers[q.id] || '').trim();
                  let isCorrect = false;
                  if (q.type === 'Numerical') {
                     isCorrect = evaluateNumerical(uAns, q.correctAnswer);
                  } else {
                     isCorrect = uAns.toLowerCase() === q.correctAnswer.trim().toLowerCase();
                  }
                  
                  return (
                    <div key={q.id} className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/30">
                      <p className="font-medium text-stone-900 dark:text-stone-100 mb-4">{i+1}. {q.question}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                         <div className="flex items-center gap-2">
                           {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                           <span className={`font-medium ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>Your answer: {uAns || '(skipped)'}</span>
                         </div>
                         {!isCorrect && (
                           <div className="flex items-center gap-2 sm:ml-4 sm:pl-4 sm:border-l border-stone-200 dark:border-stone-700">
                             <CheckCircle2 className="w-5 h-5 text-stone-400" />
                             <span className="font-medium text-stone-700 dark:text-stone-300">Correct: {q.correctAnswer}</span>
                           </div>
                         )}
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 leading-relaxed">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
              
              <button onClick={onClose} className="mt-8 px-10 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-sm">
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-[300px]">
              <div className="flex justify-between items-center text-sm font-medium text-stone-500 mb-8">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs uppercase tracking-wider font-semibold">{questions[currentIndex].type}</span>
              </div>
              
              <div className="flex-1">
                <p className="text-xl font-medium text-stone-900 dark:text-stone-100 mb-8 leading-relaxed">
                  {questions[currentIndex].question}
                </p>
                
                {questions[currentIndex].type === 'MCQ' && questions[currentIndex].options ? (
                  <div className="space-y-3">
                    {questions[currentIndex].options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: opt }))}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                          answers[questions[currentIndex].id] === opt 
                            ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-900 dark:text-teal-100 shadow-sm scale-[1.01]'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Type your answer here..."
                    value={answers[questions[currentIndex].id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: e.target.value }))}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-stone-900 dark:text-stone-100 shadow-sm transition-shadow"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNext();
                    }}
                  />
                )}
              </div>
              
              <div className="mt-12 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={updating}
                  className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-sm font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : updating ? 'Grading...' : 'Finish Practice'}
                  {currentIndex < questions.length - 1 && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
