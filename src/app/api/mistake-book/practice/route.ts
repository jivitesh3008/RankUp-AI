import { NextResponse } from 'next/server';
import { createClient as createServerClientLocal } from '@/utils/supabase/server';
import { generateQueryEmbedding } from '@/lib/embeddings';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClientLocal();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mistake_id } = await req.json();

    if (!mistake_id) {
      return NextResponse.json({ error: 'Missing mistake_id' }, { status: 400 });
    }

    const { data: mistake, error: fetchError } = await supabase
      .from('mistake_book')
      .select('*')
      .eq('id', mistake_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !mistake) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 });
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not currently configured.' }, { status: 503 });
    }
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    // RAG Context
    let ncertContext = '';
    try {
      const queryEmbedding = await generateQueryEmbedding(mistake.question_text);
      
      const { data: chunks } = await supabase.rpc('match_knowledge_chunks_global', {
        query_embedding: queryEmbedding,
        match_threshold: 0.65,
        match_count: 5,
        p_class: '10',
        p_subject: 'Science'
      });
      
      if (chunks && chunks.length > 0) {
        ncertContext = chunks.map((c: any) => c.content).join('\n\n---\n\n');
      }
    } catch (err) {
      console.error('Failed to generate embedding or query supabase:', err);
    }

    // Gemini Prompt
    const prompt = `You are a Class 10 Science tutor. The student made a mistake on a question. 
    
Original Question: ${mistake.question_text}
Student's Answer: ${mistake.student_answer}
Correct Answer: ${mistake.correct_answer}
Mistake Summary: ${mistake.mistake_summary || 'N/A'}
Chapter: ${mistake.chapter}
Topic: ${mistake.topic}

NCERT Context (if available):
${ncertContext || 'No context available'}

Your task:
Generate a small, focused practice set of 3 to 5 questions that test the SAME underlying concept.
Do not use the exact original wording.
Vary the question formats (e.g. MCQ, short answer, numerical).
Include the correct answers and a brief explanation for each.

Respond ONLY with a valid JSON object matching this exact schema (no markdown, no backticks):
{
  "questions": [
    {
      "id": "1",
      "type": "MCQ" | "ShortAnswer" | "Numerical",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct answer (exact string for matching)",
      "explanation": "Brief explanation of the answer"
    }
  ]
}
Note for MCQ: The options array must be populated.
Note for Numerical: Only include the number or number with unit (e.g. '5' or '5 J').`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    };

    let response;
    let retries = 3;
    let delay = 1000;
    
    for (let i = 0; i <= retries; i++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
      );
      
      if (response.status === 429 || response.status === 503) {
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
       console.error("Failed to generate practice.");
       const statusCode = response?.status || 500;
       if (statusCode === 429 || statusCode === 503) {
         return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
       }
       return NextResponse.json({ error: 'Failed to generate practice questions.' }, { status: statusCode });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      return NextResponse.json({ error: 'Empty AI response.' }, { status: 500 });
    }

    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    let practiceSet;
    try {
      practiceSet = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse JSON:", cleanedText);
      return NextResponse.json({ error: 'Invalid JSON from AI.' }, { status: 500 });
    }
    
    // Log activity
    await supabase.from('student_activity').insert({
       user_id: user.id,
       event_type: 'practice_generated',
       chapter: mistake.chapter,
       topic: mistake.topic,
       metadata_json: { mistake_id: mistake.id, question_count: practiceSet.questions?.length }
    });

    return NextResponse.json({ practice: practiceSet.questions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
