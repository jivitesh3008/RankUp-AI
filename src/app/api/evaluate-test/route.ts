import { NextResponse } from 'next/server';
import { decryptAnswer, evaluateNumerical } from '@/lib/evaluate';
import { createClient as createServerClientLocal } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerClientLocal();
    const { data: { user } } = await serverSupabase.auth.getUser();

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
        studentAnswer: uAns,
        correctAnswer: correctAns,
        explanation
      });
    }

    // Mistake Book Integration
    const wrongAnswersToAnalyze = evaluatedQuestions.filter(eq => !eq.isCorrect && eq.studentAnswer && eq.studentAnswer.trim() !== '');
    
    if (wrongAnswersToAnalyze.length > 0 && user) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
        
        if (apiKey) {
          const prompt = `Analyze these incorrect answers from a Class 10 Science test. 
Determine if each wrong answer represents a meaningful learning gap (e.g. conceptual misunderstanding, calculation error, formula mistake, unit mistake) or just a trivial typo.

Respond ONLY with a JSON array in exactly this format (no markdown, no backticks):
[
  {
    "id": "question_id_here",
    "isMeaningful": true,
    "category": "Conceptual mistake", // Use standard categories: Conceptual mistake, Calculation mistake, Formula mistake, Unit mistake, Reasoning mistake, etc. Or null.
    "summary": "Brief summary of what went wrong"
  }
]

Input data:
${JSON.stringify(wrongAnswersToAnalyze.map(q => ({ id: q.id, question: q.question, studentAnswer: q.studentAnswer, correctAnswer: q.correctAnswer })))}
`;

          const requestBody = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          };

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              const analysisResult = JSON.parse(cleanedText);

              // Prepare inserts
              for (const analysis of analysisResult) {
                if (analysis.isMeaningful) {
                  const eq = wrongAnswersToAnalyze.find(q => q.id === analysis.id);
                  if (eq) {
                     // Check if mistake already exists
                     const { data: existing } = await serverSupabase
                       .from('mistake_book')
                       .select('*')
                       .eq('user_id', user.id)
                       .eq('chapter', eq.chapter)
                       .eq('topic', eq.topic)
                       .eq('question_text', eq.question)
                       .single();

                     if (existing) {
                        await serverSupabase
                          .from('mistake_book')
                          .update({
                            occurrence_count: existing.occurrence_count + 1,
                            status: existing.status === 'fixed' ? 'practicing' : existing.status,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', existing.id);
                     } else {
                        await serverSupabase.from('mistake_book').insert({
                          user_id: user.id,
                          question_text: eq.question,
                          student_answer: eq.studentAnswer,
                          correct_answer: eq.correctAnswer,
                          chapter: eq.chapter,
                          topic: eq.topic,
                          mistake_category: analysis.category || null,
                          mistake_summary: analysis.summary || 'Needs review',
                          source_type: 'custom_test',
                          source_id: eq.id || null,
                          status: 'new'
                        });
                     }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to process mistakes:', err);
      }
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

    if (user) {
      try {
        const testType = questions[0]?.sourceSection ? 'youtube_test' : 'custom_test';
        const testTitle = questions[0]?.chapter || 'Mixed Science Test';
        
        await serverSupabase.from('student_activity').insert({
          user_id: user.id,
          event_type: testType + '_completed',
          metadata_json: { score: correctCount, total: questions.length }
        });
        
        const { data: attempt } = await serverSupabase.from('test_attempts').insert({
          user_id: user.id,
          test_type: testType,
          title: testTitle,
          subject: 'Science',
          total_questions: questions.length,
          correct_answers: correctCount,
          score_percentage: Math.round((correctCount / questions.length) * 100)
        }).select().single();
        
        if (attempt && evaluatedQuestions.length > 0) {
           const questionsToInsert = evaluatedQuestions.map(eq => ({
             attempt_id: attempt.id,
             question_id: eq.id || null,
             chapter: eq.chapter,
             topic: eq.topic,
             is_correct: eq.isCorrect,
             question_text: eq.question,
             options: eq.options || null,
             student_answer: eq.studentAnswer,
             correct_answer: eq.correctAnswer,
             explanation: eq.explanation
           }));
           await serverSupabase.from('test_attempt_questions').insert(questionsToInsert);
        }
      } catch (err) {
        console.error('Failed to log test attempt', err);
      }
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
