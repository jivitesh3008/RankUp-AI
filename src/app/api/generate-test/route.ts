import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptAnswer } from '@/lib/evaluate';
import staticTestEmbedding from '@/lib/static-test-embedding.json';

import { SCIENCE_CHAPTERS, MATHS_CHAPTERS } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    
    if (bodyText.length > 1 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    }

    const { subject, chapters, count, difficulty, questionType } = JSON.parse(bodyText);

    if (subject !== 'Science' && subject !== 'Mathematics') {
      return NextResponse.json({ error: 'Only Science and Mathematics are currently supported.' }, { status: 400 });
    }

    const allChaptersList = subject === 'Mathematics' ? MATHS_CHAPTERS : SCIENCE_CHAPTERS;
    const targetChapters = chapters.includes(`All ${subject}`) ? allChaptersList : chapters;

    if (!targetChapters || targetChapters.length === 0) {
       return NextResponse.json({ error: 'At least one chapter must be selected.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured.' }, { status: 503 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
      const { data: isAllowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        client_ip: ip,
        max_requests: 10,
        window_seconds: 60
      });
      if (rateLimitError) {
        console.error('Rate limit RPC error:', rateLimitError);
      } else if (isAllowed === false) {
        return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
      }
    } catch (err) {
      console.error('Rate limit check failed:', err);
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    let allChunks: any[] = [];
    const topKPerChapter = targetChapters.length > 5 ? 3 : 5;
    const matchThreshold = 0.65;

    const queryEmbedding = staticTestEmbedding;

    const results = await Promise.all(targetChapters.map((ch: string) => 
      supabase.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: topKPerChapter,
        p_class: '10',
        p_subject: subject,
        p_chapter: ch
      }).then((res: any) => ({ ...res, chapter: ch }))
    ));

    for (const result of results) {
      if (result.data) {
        allChunks = allChunks.concat(result.data.map((c: any) => ({ ...c, chapter: result.chapter })));
      }
    }

    if (allChunks.length === 0) {
       return NextResponse.json({ error: 'No NCERT context found to generate the test. Please try a different selection.' }, { status: 400 });
    }

    const ncertContext = allChunks.map((c: any) => `[Chapter: ${c.chapter} | Topic: ${c.topic}]\n${c.content}`).join('\n\n---\n\n');

const systemPrompt = `You are an expert Class 10 CBSE ${subject} examiner. Your task is to generate a custom test.
    
AUTHORITATIVE NCERT CONTEXT:
${ncertContext}

INSTRUCTIONS:
1. Generate EXACTLY ${count} questions.
2. Difficulty: ${difficulty}. 
3. Question Types allowed: ${questionType}. If "Mixed", include a variety of supported types (MCQ, Short Answer, Numerical, Assertion-Reason).
4. ALL questions MUST be strictly grounded in the provided NCERT context. Do NOT invent concepts outside the provided text. If you lack enough context, generate fewer questions rather than making things up.
5. For MCQs: Ensure exactly ONE correct answer. Provide plausible distractors.
6. For Numericals: Provide all necessary values from the context and ensure the answer is solvable.
   CRITICAL RULE: Any question that requires a calculated mathematical number or physical unit as the answer MUST be labeled with "type": "Numerical". Do NOT label calculations as "Short Answer".
7. For Assertion-Reason: Assertion (A) and Reason (R) must be meaningful. Provide standard 4 options.
8. Output the test in STRICT JSON format matching the schema below.
${subject === 'Mathematics' ? '\nSPECIAL MATHS RULE: You must use valid LaTeX formatting for all mathematical equations, symbols, and expressions inside the questions, options, and explanations. For example: \\(x^2 + y^2 = r^2\\) or $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$. Do not use raw text like x^2.' : ''}
7. For Assertion-Reason: Assertion (A) and Reason (R) must be meaningful. Provide standard 4 options.
8. Output the test in STRICT JSON format matching the schema below.

EXPECTED JSON SCHEMA:
{
  "title": "Custom Test",
  "questions": [
    {
      "id": "unique-id-1",
      "type": "MCQ" | "Short Answer" | "Numerical" | "Assertion-Reason",
      "question": "Question text...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // only for MCQ and Assertion-Reason
      "correctAnswer": "Exact text of the correct option, or the short answer/numerical answer",
      "explanation": "Detailed explanation using NCERT context...",
      "chapter": "Name of the chapter",
      "topic": "Name of the topic"
    }
  ]
}`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: "Generate the JSON test." }] }],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: "application/json",
      }
    };

    let response;
    let retries = 2;
    let delay = 1000;
    
    for (let i = 0; i <= retries; i++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
      
      if (response.status === 429 || response.status === 503) {
        // Fail fast on any 429/503 for Gemini API quota safety
        break;
      }
      
      if (!response.ok && i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const statusCode = response?.status || 500;
      if (statusCode === 429 || statusCode === 503) {
        return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
      }
      return NextResponse.json({ error: `Gemini API Error (HTTP ${statusCode})` }, { status: statusCode });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return NextResponse.json({ error: 'Received empty response from AI.' }, { status: 500 });
    }

    const testObject = JSON.parse(replyText);
    
    if (testObject.questions) {
      testObject.questions = testObject.questions.map((q: any, idx: number) => {
        const id = q.id || `q-${Date.now()}-${idx}`;
        const answerToken = encryptAnswer(q.correctAnswer, q.explanation);
        
        delete q.correctAnswer;
        delete q.explanation;

        return {
          ...q,
          id,
          answerToken
        };
      });
    }

    return NextResponse.json(testObject);

  } catch (error) {
    console.error('Test Generation API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during test generation.' }, { status: 500 });
  }
}
