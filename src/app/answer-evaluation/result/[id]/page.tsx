'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, FileText, Loader2, ArrowLeft, Target, Award, Lightbulb, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import AuthPrompt from '@/components/AuthPrompt';
import ReactMarkdown from 'react-markdown';

export default function EvaluationResultPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>('loading');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      try {
        const { data: evalData, error: evalError } = await supabase
          .from('answer_evaluations')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (evalError || !evalData) {
          throw new Error('Evaluation not found or access denied.');
        }

        setEvaluation(evalData);
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

  if (error || !evaluation) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Result Not Found</h2>
        <p className="text-foreground/60 mb-8">{error || 'This evaluation no longer exists.'}</p>
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

      <div className="bg-card-bg border border-card-border rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-accent-emerald-400" />
        <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
          <span className="text-3xl font-bold text-primary-500">{evaluation.estimated_marks}</span>
          <span className="text-lg text-primary-500/50 mt-2">/{evaluation.total_marks}</span>
        </div>
        <h1 className="text-3xl font-bold font-outfit text-foreground mb-2">Answer Evaluated</h1>
        <p className="text-foreground/60 max-w-lg mx-auto">
          Based on the transcription of your historical answer.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-card-bg rounded-2xl border border-card-border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" /> Question
          </h3>
          <p className="text-lg font-medium">{evaluation.question_text}</p>
        </div>

        <div className="bg-card-bg rounded-2xl border border-card-border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Transcribed Answer
          </h3>
          <div className="p-4 bg-background border border-card-border rounded-xl text-foreground/80 font-medium whitespace-pre-wrap">
            {evaluation.answer_text}
          </div>
          <p className="text-xs text-foreground/40 mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> For privacy, images are discarded after evaluation. This is the extracted text.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card-bg rounded-2xl border border-card-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-accent-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Strengths
            </h3>
            <ul className="space-y-3">
              {(evaluation.strengths || []).map((s: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/80">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent-emerald-500 mt-1.5" />
                  <span className="inline prose-sm prose-p:inline"><ReactMarkdown>{s}</ReactMarkdown></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card-bg rounded-2xl border border-card-border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-accent-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Mistakes
            </h3>
            <ul className="space-y-3">
              {(evaluation.mistakes || []).map((m: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/80">
                   <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent-amber-500 mt-1.5" />
                   <span className="inline prose-sm prose-p:inline"><ReactMarkdown>{m}</ReactMarkdown></span>
                </li>
              ))}
              {(!evaluation.mistakes || evaluation.mistakes.length === 0) && (
                <p className="text-sm text-foreground/50 italic">No major mistakes found.</p>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-primary-500/5 rounded-2xl border border-primary-500/20 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Improvement Tips
          </h3>
          <ul className="space-y-3">
            {(evaluation.improvement_tips || []).map((t: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/80">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5" />
                <span className="inline prose-sm prose-p:inline"><ReactMarkdown>{t}</ReactMarkdown></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
