import { createClient } from '@/utils/supabase/server';
import {
  CheckCircle2,
  XCircle,
  FileText,
  ArrowLeft,
  BookMarked,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import AuthPrompt from '@/components/AuthPrompt';

// ─── Types ──────────────────────────────────────────────────────────────────
interface TestAttempt {
  id: string;
  user_id: string;
  test_type: string;
  title: string | null;
  subject: string | null;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  completed_at: string;
}

interface AttemptQuestion {
  id: string;
  attempt_id: string;
  question_id: string | null;
  chapter: string | null;
  topic: string | null;
  is_correct: boolean | null;
  question_text: string | null;
  options: string[] | null;
  student_answer: string | null;
  correct_answer: string | null;
  explanation: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Server Component ────────────────────────────────────────────────────────
export default async function TestResultPage({ params }: PageProps) {
  const { id } = await params;

  // Validate UUID format
  const isValidUuid =
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );

  if (!id || !isValidUuid) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invalid Test ID</h2>
        <p className="text-foreground/60 mb-8 max-w-md mx-auto">
          The test ID provided in the URL is invalid or malformed.
        </p>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
      </div>
    );
  }

  // Server-side auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AuthPrompt />;
  }

  // Fetch the test attempt — ownership enforced on the server via user.id and RLS
  const { data: attemptData, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (attemptError) {
    // Supabase PGRST116 = "Row not found" from .single()
    if (
      attemptError.code === 'PGRST116' ||
      attemptError.message?.toLowerCase().includes('not found')
    ) {
      return (
        <div className="max-w-3xl mx-auto p-6 text-center py-20">
          <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
          <p className="text-foreground/60 mb-8 max-w-md mx-auto">
            This test attempt does not exist, was deleted, or belongs to a different account.
          </p>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
        </div>
      );
    }

    // Real database / connection error
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <WifiOff className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Couldn&apos;t Load Test</h2>
        <p className="text-foreground/60 mb-8 max-w-md mx-auto">
          A database error occurred while loading the test. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/custom-test/result/${id}`}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/history"
            className="bg-card-bg border border-card-border hover:bg-card-border text-foreground font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (!attemptData) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <AlertCircle className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
        <p className="text-foreground/60 mb-8 max-w-md mx-auto">
          This test attempt does not exist, was deleted, or belongs to a different account.
        </p>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
      </div>
    );
  }

  const attempt = attemptData as TestAttempt;

  // Fetch associated questions (RLS on test_attempt_questions ensures user can only read their own attempt's questions)
  const { data: qData, error: qError } = await supabase
    .from('test_attempt_questions')
    .select('*')
    .eq('attempt_id', id)
    .order('created_at', { ascending: true });

  if (qError) {
    console.error('[TestResult] Failed to load questions:', qError);
  }

  const questions: AttemptQuestion[] = (qData ?? []) as AttemptQuestion[];

  // ── Derive test mode flags ───────────────────────────────────────────────
  const isPractice = attempt.test_type === 'short_answer_practice';
  const completedDate = attempt.completed_at
    ? new Date(attempt.completed_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const completedTime = attempt.completed_at
    ? new Date(attempt.completed_at).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      {/* Back link */}
      <Link
        href="/history"
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to History
      </Link>

      {/* ── Result Header Card ── */}
      <div className="bg-card-bg border border-card-border rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 mb-8 text-center">
        {isPractice ? (
          // Practice / Solutions Review mode (unscored)
          <>
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
              <BookMarked className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-foreground mb-2">
              Practice Test
            </h1>
            <p className="text-foreground/60 mb-2">
              {attempt.title && attempt.title !== 'Short Answer Practice'
                ? attempt.title
                : 'Short Answer Practice'}
              {attempt.subject ? ` • ${attempt.subject}` : ''}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-500 text-sm font-semibold rounded-full border border-primary-500/20 mt-2">
              <BookMarked className="w-4 h-4" />
              Practice / Solutions Review — Not Scored
            </div>
            {completedDate && (
              <p className="text-xs text-foreground/40 mt-3">
                Completed {completedDate} at {completedTime}
              </p>
            )}
          </>
        ) : (
          // Scored test mode (MCQ, Numerical, etc.)
          <>
            <div className="w-16 h-16 bg-accent-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-accent-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-foreground mb-2">
              Test Result
            </h1>
            <p className="text-foreground/60 mb-2">
              {attempt.title || 'Practice Test'}
              {attempt.subject ? ` • ${attempt.subject}` : ''}
            </p>
            {completedDate && (
              <p className="text-xs text-foreground/40 mb-6">
                Completed {completedDate} at {completedTime}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mt-4">
              <div className="bg-background p-6 rounded-2xl border border-card-border">
                <p className="text-xs font-bold text-foreground/50 mb-1 uppercase tracking-wider">
                  Score
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {attempt.correct_answers}{' '}
                  <span className="text-lg text-foreground/40">
                    / {attempt.total_questions}
                  </span>
                </p>
              </div>
              <div className="bg-background p-6 rounded-2xl border border-card-border">
                <p className="text-xs font-bold text-foreground/50 mb-1 uppercase tracking-wider">
                  Accuracy
                </p>
                <p className="text-3xl font-bold text-primary-500">
                  {attempt.score_percentage}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Questions Section ── */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-outfit flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-foreground/40" />
          {isPractice ? 'Questions & Model Solutions' : 'Review Answers'}
        </h2>

        {questions.length === 0 ? (
          <div className="text-center p-8 bg-card-bg border border-card-border rounded-2xl">
            <p className="text-foreground/60">
              Detailed question data is not available for this test record.
            </p>
          </div>
        ) : isPractice ? (
          // ── Practice mode: show questions + model solutions ──────────────
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-6 bg-card-bg rounded-2xl border border-card-border shadow-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="shrink-0 w-7 h-7 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-500">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wider">
                      {[q.chapter, q.topic].filter(Boolean).join(' · ') || attempt.subject || 'Question'}
                    </p>
                    <p className="text-lg font-medium text-foreground leading-relaxed">
                      {q.question_text || (
                        <span className="italic text-foreground/50">
                          Detailed question text was not recorded for this historical attempt.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {q.correct_answer ? (
                  <div className="space-y-4 ml-10">
                    <div className="p-5 bg-primary-500/5 border border-primary-500/20 rounded-xl">
                      <p className="text-xs font-bold text-primary-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Model Answer
                      </p>
                      <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                        {q.correct_answer}
                      </p>
                    </div>

                    {q.explanation && q.explanation.trim() && (
                      <div className="p-5 bg-card-bg border border-card-border rounded-xl">
                        <p className="text-xs font-bold text-foreground/50 mb-2 uppercase tracking-wider">
                          Detailed Explanation
                        </p>
                        <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-10 p-4 bg-card-bg rounded-xl border border-card-border">
                    <p className="text-foreground/50 text-sm italic">
                      Model solution was not recorded for this historical attempt.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // ── Scored mode: show answers with correct/incorrect ─────────────
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-6 bg-card-bg rounded-2xl border border-card-border shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {q.is_correct === true ? (
                      <CheckCircle2 className="w-6 h-6 text-accent-emerald-500" />
                    ) : q.is_correct === false ? (
                      <XCircle className="w-6 h-6 text-accent-amber-500" />
                    ) : (
                      /* null = not scored */
                      <div className="w-6 h-6 rounded-full border-2 border-foreground/20" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wider">
                      Question {idx + 1}
                      {q.chapter ? ` • ${q.chapter}` : ''}
                      {q.topic ? ` • ${q.topic}` : ''}
                    </p>
                    <p className="text-lg font-medium text-foreground mb-4">
                      {q.question_text || (
                        <span className="italic text-foreground/50">
                          Detailed question text was not recorded for this historical attempt.
                        </span>
                      )}
                    </p>

                    {/* MCQ options — display only, read-only */}
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {q.options.map((opt: string, i: number) => {
                          const isStudentAnswer = q.student_answer === opt;
                          const isCorrectAnswer = q.correct_answer === opt;
                          let optClass =
                            'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ';
                          if (isCorrectAnswer) {
                            optClass +=
                              'border-accent-emerald-500/50 bg-accent-emerald-500/10 text-foreground font-medium';
                          } else if (isStudentAnswer && q.is_correct === false) {
                            optClass +=
                              'border-accent-amber-500/50 bg-accent-amber-500/10 text-foreground';
                          } else {
                            optClass +=
                              'border-card-border bg-background text-foreground/60';
                          }
                          return (
                            <div key={i} className={optClass}>
                              <span className="font-bold mr-2 opacity-50">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                              {isCorrectAnswer && (
                                <span className="ml-2 text-xs font-bold text-accent-emerald-500">
                                  ✓ Correct
                                </span>
                              )}
                              {isStudentAnswer && !isCorrectAnswer && (
                                <span className="ml-2 text-xs font-bold text-accent-amber-500">
                                  ✗ Your answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Non-MCQ answer display (Numerical, Written) */}
                    {(!Array.isArray(q.options) || q.options.length === 0) &&
                      (q.student_answer || q.correct_answer) && (
                        <div className="space-y-3 mb-6">
                          <div className="p-4 bg-background rounded-xl border border-card-border shadow-sm">
                            <p className="text-xs text-foreground/40 mb-1 font-bold uppercase tracking-wider">
                              Your Answer
                            </p>
                            <p
                              className={
                                'font-medium ' +
                                (q.is_correct === true
                                  ? 'text-accent-emerald-500'
                                  : q.is_correct === false
                                  ? 'text-accent-amber-500'
                                  : 'text-foreground/70')
                              }
                            >
                              {q.student_answer || (
                                <span className="italic opacity-50">Not answered</span>
                              )}
                            </p>
                          </div>

                          {q.is_correct === false && q.correct_answer && (
                            <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20 shadow-sm">
                              <p className="text-xs text-primary-500 mb-1 font-bold uppercase tracking-wider">
                                Correct Answer
                              </p>
                              <p className="font-medium text-primary-400">
                                {q.correct_answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-background p-5 rounded-xl text-foreground/80 text-sm leading-relaxed border border-card-border">
                        <span className="font-bold block mb-1 text-foreground">
                          Explanation
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
