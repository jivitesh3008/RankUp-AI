import { NextResponse } from 'next/server';
import { decryptAnswer, evaluateNumerical } from '@/lib/evaluate';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    
    // Safety limit check
    if (bodyText.length > 512 * 1024) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    }

    const { questions, userAnswers } = JSON.parse(bodyText);

    if (!questions || !Array.isArray(questions) || !userAnswers) {
      return NextResponse.json({ error: 'Invalid payload format.' }, { status: 400 });
    }

    let correctCount = 0;
    const incorrectTopics: Record<string, number> = {};
    const chapterStats: Record<string, { total: number, correct: number }> = {};
    const evaluatedQuestions: any[] = [];

    for (const q of questions) {
      const uAns = (userAnswers[q.id] || '').trim();
      
      const decrypted = decryptAnswer(q.answerToken);
      if (!decrypted) {
         // If token is invalid or missing, fail the question safely.
         evaluatedQuestions.push({
           ...q,
           isCorrect: false,
           correctAnswer: 'Error: Invalid Answer Token',
           explanation: 'The server could not verify the official answer due to a token error.'
         });
         continue;
      }

      const { answer: correctAns, explanation } = decrypted;
      
      let isCorrect = false;

      if (q.type === 'Numerical') {
        isCorrect = evaluateNumerical(uAns, correctAns);
        
        // Development-only diagnostic logging
        console.log(`[Numerical Eval Trace] Q: ${q.question}`);
        console.log(`[Numerical Eval Trace] raw student: '${uAns}', raw correct: '${correctAns}'`);
        console.log(`[Numerical Eval Trace] Final Result: ${isCorrect ? 'CORRECT' : 'WRONG'}`);
      } else {
        // Fallback for MCQ, Short Answer, Assertion-Reason
        isCorrect = uAns.toLowerCase() === correctAns.trim().toLowerCase();
        
        // Development-only diagnostic logging
        console.log(`[${q.type} Eval Trace] Q: ${q.question}`);
        console.log(`[${q.type} Eval Trace] student: '${uAns}', correct: '${correctAns}'`);
        console.log(`[${q.type} Eval Trace] Final Result: ${isCorrect ? 'CORRECT' : 'WRONG'}`);
      }

      if (isCorrect) correctCount++;
      else {
        incorrectTopics[q.topic] = (incorrectTopics[q.topic] || 0) + 1;
      }

      if (!chapterStats[q.chapter]) chapterStats[q.chapter] = { total: 0, correct: 0 };
      chapterStats[q.chapter].total++;
      if (isCorrect) chapterStats[q.chapter].correct++;

      evaluatedQuestions.push({
        ...q,
        isCorrect,
        correctAnswer: correctAns,
        explanation
      });
    }

    let maxMisses = 0;
    let weakest = 'None';
    for (const [topic, misses] of Object.entries(incorrectTopics)) {
      if (misses > maxMisses) {
        maxMisses = misses;
        weakest = topic;
      }
    }

    const chapterAccuracy: Record<string, number> = {};
    for (const [ch, stats] of Object.entries(chapterStats)) {
      chapterAccuracy[ch] = Math.round((stats.correct / stats.total) * 100);
    }

    return NextResponse.json({
      score: correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
      weakestTopic: weakest,
      chapterAccuracy,
      evaluatedQuestions
    });

  } catch (error) {
    console.error('Test Evaluation API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during evaluation.' }, { status: 500 });
  }
}
