'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, XCircle, FileText, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AuthPrompt from '@/components/AuthPrompt';

export default function TestResultPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>('loading');
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      try {
        const { data: attemptData, error: attemptError } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (attemptError || !attemptData) {
          throw new Error('Test result not found or access denied.');
        }

        const { data: qData, error: qError } = await supabase
          .from('test_attempt_questions')
          .select('*')
          .eq('attempt_id', params.id);

        if (qError) {
          throw new Error('Failed to load test questions.');
        }

        setAttempt(attemptData);
        setQuestions(qData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (user === 'loading' || loading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  if (!user) {
    return <AuthPrompt />;
  }

  if (error || !attempt) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Result Not Found</h2>
        <p className="text-foreground/60 mb-8">{error || 'This test attempt no longer exists.'}</p>
        <Link href="/history" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl">
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <Link href="/history" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      <div className="bg-card-bg border border-card-border rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 mb-8 text-center">
        <div className="w-16 h-16 bg-accent-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 text-accent-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold font-outfit text-foreground mb-2">Test Result</h1>
        <p className="text-foreground/60 mb-8">{attempt.title} • {attempt.subject}</p>
        
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          <div className="bg-background p-6 rounded-2xl border border-card-border">
            <p className="text-xs font-bold text-foreground/50 mb-1 uppercase tracking-wider">Score</p>
            <p className="text-3xl font-bold text-foreground">{attempt.correct_answers} <span className="text-lg text-foreground/40">/ {attempt.total_questions}</span></p>
          </div>
          <div className="bg-background p-6 rounded-2xl border border-card-border">
            <p className="text-xs font-bold text-foreground/50 mb-1 uppercase tracking-wider">Accuracy</p>
            <p className="text-3xl font-bold text-primary-500">{attempt.score_percentage}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold font-outfit flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-foreground/40" /> Review Answers
        </h2>
        
        {questions.length === 0 ? (
          <div className="text-center p-8 bg-card-bg border border-card-border rounded-2xl">
            <p className="text-foreground/60">Detailed question data is not available for this legacy test.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="p-6 bg-card-bg rounded-2xl border border-card-border shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {q.is_correct ? (
                    <CheckCircle2 className="w-6 h-6 text-accent-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-accent-amber-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wider">Question {idx + 1} &bull; {q.chapter}</p>
                  <p className="text-lg font-medium text-foreground mb-4">{q.question_text || 'Question text unavailable'}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="p-4 bg-background rounded-xl border border-card-border shadow-sm">
                      <p className="text-xs text-foreground/40 mb-1 font-bold uppercase tracking-wider">Your Answer</p>
                      <p className={"font-medium " + (q.is_correct ? 'text-accent-emerald-500' : 'text-accent-amber-500')}>
                        {q.student_answer || <span className="italic opacity-50">Not answered</span>}
                      </p>
                    </div>
                    
                    {!q.is_correct && (
                      <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20 shadow-sm">
                        <p className="text-xs text-primary-500 mb-1 font-bold uppercase tracking-wider">Correct Answer</p>
                        <p className="font-medium text-primary-400">{q.correct_answer || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="bg-background p-5 rounded-xl text-foreground/80 text-sm leading-relaxed border border-card-border">
                      <span className="font-bold block mb-1 text-foreground">Explanation</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
