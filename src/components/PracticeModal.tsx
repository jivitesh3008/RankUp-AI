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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-background rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-card-border">
        <div className="flex items-center justify-between p-5 border-b border-card-border bg-card-bg">
          <h2 className="text-xl font-bold font-outfit text-foreground">Practice My Mistake</h2>
          <button onClick={onClose} className="p-2 hover:bg-card-border rounded-full transition-colors text-foreground/50 tap-scale">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-foreground/60 font-bold">Generating focused practice questions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4 bg-red-500/10 p-4 rounded-xl inline-block border border-red-500/20">{error}</p>
              <div>
                <button onClick={loadPractice} className="mt-4 px-6 py-2.5 bg-background border border-card-border rounded-xl text-sm font-bold hover:bg-card-bg text-foreground transition-colors tap-scale">
                  Try Again
                </button>
              </div>
            </div>
          ) : showResults ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 bg-card-bg border-4 border-card-border shadow-sm">
                <span className="text-4xl font-bold font-outfit text-foreground">{score}<span className="text-2xl text-foreground/40">/{questions.length}</span></span>
              </div>
              <h3 className="text-2xl font-bold font-outfit text-foreground mb-2">
                {score === questions.length ? "Great job! ✨" : "Keep practicing."}
              </h3>
              <p className="text-foreground/60 mb-8 max-w-sm mx-auto">
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
                    <div key={q.id} className="p-5 rounded-2xl border border-card-border bg-card-bg">
                      <p className="font-bold text-foreground mb-4">{i+1}. {q.question}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm bg-background p-4 rounded-xl border border-card-border">
                         <div className="flex items-center gap-2">
                           {isCorrect ? <CheckCircle2 className="w-5 h-5 text-accent-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                           <span className={`font-bold ${isCorrect ? 'text-accent-emerald-500' : 'text-red-400'}`}>Your answer: {uAns || '(skipped)'}</span>
                         </div>
                         {!isCorrect && (
                           <div className="flex items-center gap-2 sm:ml-4 sm:pl-4 sm:border-l border-card-border">
                             <CheckCircle2 className="w-5 h-5 text-foreground/40" />
                             <span className="font-bold text-foreground/80">Correct: {q.correctAnswer}</span>
                           </div>
                         )}
                      </div>
                      <p className="text-sm text-foreground/70 mt-4 pt-4 border-t border-card-border leading-relaxed">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
              
              <button onClick={onClose} className="mt-8 px-10 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-sm tap-scale w-full sm:w-auto">
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-[300px]">
              <div className="flex justify-between items-center text-sm font-bold text-foreground/50 mb-8">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="px-3 py-1 bg-card-bg border border-card-border rounded-lg text-xs uppercase tracking-wider">{questions[currentIndex].type}</span>
              </div>
              
              <div className="flex-1">
                <p className="text-xl font-medium text-foreground mb-8 leading-relaxed">
                  {questions[currentIndex].question}
                </p>
                
                {questions[currentIndex].type === 'MCQ' && questions[currentIndex].options ? (
                  <div className="space-y-3">
                    {questions[currentIndex].options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: opt }))}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 tap-scale ${
                          answers[questions[currentIndex].id] === opt 
                            ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-sm'
                            : 'bg-background border-card-border text-foreground/80 hover:border-foreground/20 hover:bg-card-bg'
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
                    className="w-full bg-background border border-card-border rounded-2xl px-4 py-4 outline-none focus:ring-1 focus:ring-primary-500 text-foreground shadow-sm transition-shadow"
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
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 tap-scale"
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
