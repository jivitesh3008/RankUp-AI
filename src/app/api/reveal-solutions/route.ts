import { NextResponse } from 'next/server';
import { decryptAnswer } from '@/lib/evaluate';
import { createClient as createServerClientLocal } from '@/utils/supabase/server';
import { MATHS_CHAPTERS } from '@/lib/constants';

/**
 * POST /api/reveal-solutions
 *
 * Decrypts and returns the model solutions for Short Answer practice questions.
 * This endpoint is called ONLY after the student finishes the test (clicks "Finish Test").
 * It never exposes solutions during the test.
 *
 * Body: { questions: Array<{ id: string; answerToken: string; type?: string; chapter?: string; topic?: string; question?: string }> }
 * Response: { solutions: Array<{ id: string; modelAnswer: string; explanation: string }> }
 *
 * IMPORTANT:
 * - This endpoint NEVER creates Mistake Book entries.
 * - This endpoint NEVER scores student answers.
 * - It only decrypts solution tokens and logs the practice session in history.
 */
export async function POST(req: Request) {
  try {
    // Require authentication — solutions should only be visible to logged-in students
    const serverSupabase = await createServerClientLocal();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const bodyText = await req.text();
    if (bodyText.length > 256 * 1024) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    }

    const { questions } = JSON.parse(bodyText);

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: questions array is required.' }, { status: 400 });
    }

    // Decrypt solutions from answerTokens.
    const solutions: Array<{ id: string; modelAnswer: string; explanation: string }> = [];

    for (const q of questions) {
      if (!q.id || !q.answerToken) {
        solutions.push({ id: q.id || '', modelAnswer: '', explanation: '' });
        continue;
      }

      const decrypted = decryptAnswer(q.answerToken);
      if (!decrypted) {
        solutions.push({
          id: q.id,
          modelAnswer: 'Solution unavailable (token error).',
          explanation: ''
        });
        continue;
      }

      solutions.push({
        id: q.id,
        modelAnswer: decrypted.answer,
        explanation: decrypted.explanation
      });
    }

    // Log the practice session in history.
    // No scoring, no Mistake Book entries — this is purely for activity tracking.
    let attemptId: string | null = null;
    try {
      const testTitle = questions[0]?.chapter || 'Short Answer Practice';
      const testSubject = questions[0]?.subject || (
        questions[0]?.chapter && MATHS_CHAPTERS.includes(questions[0]?.chapter) ? 'Mathematics' : 'Science'
      );

      await serverSupabase.from('student_activity').insert({
        user_id: user.id,
        event_type: 'short_answer_practice_completed',
        metadata_json: { questions: questions.length, mode: 'practice' }
      });

      const { data: attempt } = await serverSupabase.from('test_attempts').insert({
        user_id: user.id,
        test_type: 'short_answer_practice',
        title: testTitle,
        subject: testSubject,
        total_questions: questions.length,
        // Score fields are 0 for practice — test_type = 'short_answer_practice' signals this
        correct_answers: 0,
        score_percentage: 0
      }).select().single();

      if (attempt) {
        attemptId = attempt.id;
        // Persist questions (with model solutions) so the result page can display them.
        // For unscored practice questions, is_correct is null (representing unscored answers).
        // Resilient fallback: If DB migration 010 (DROP NOT NULL) has not yet been executed in Supabase,
        // retry with is_correct: false so questions and solutions are never lost.
        const questionsToInsert = questions.map((q: any, idx: number) => {
          const sol = solutions[idx];
          return {
            attempt_id: attempt.id,
            question_id: q?.id || null,
            chapter: q?.chapter || null,
            topic: q?.topic || null,
            is_correct: null,
            question_text: q?.question || null,
            options: null,
            student_answer: null, // Students never submitted answers in practice mode
            correct_answer: sol?.modelAnswer || null,
            explanation: sol?.explanation || null
          };
        });

        const { error: insertErr } = await serverSupabase.from('test_attempt_questions').insert(questionsToInsert);
        if (insertErr && (insertErr.code === '23502' || insertErr.message?.includes('not-null'))) {
          console.warn('Migration 010 not yet applied on Supabase. Falling back to is_correct: false.');
          const fallbackQuestions = questionsToInsert.map(q => ({ ...q, is_correct: false }));
          await serverSupabase.from('test_attempt_questions').insert(fallbackQuestions);
        }
      }
    } catch (logErr) {
      // Non-fatal: log error but still return solutions to the student
      console.error('Failed to log practice session:', logErr);
    }

    return NextResponse.json({ solutions, attemptId });

  } catch (error) {
    console.error('Reveal Solutions API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
