import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQueryEmbedding } from '@/lib/embeddings';

const SYSTEM_PROMPT_BASE = `You are the RankUp AI Tutor, a Class 10 CBSE tutor.
Your teaching philosophy is: "Don't just give the answer. Help the student understand it."
Use a Socratic teaching style.
- Break difficult concepts into smaller steps.
- Ask useful follow-up questions.
- Encourage the student to think.
- Give hints before revealing a complete solution when appropriate.
- Explain mistakes clearly.
- Use Class 10-level language.
- For simple factual questions, you may give a direct explanation, but for problem-solving, prefer guided reasoning.
- Do not quote large portions of NCERT unnecessarily.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'AI is not currently configured. Please add GEMINI_API_KEY to environment variables.' 
      }, { status: 503 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Server-side rate limit using Supabase RPC
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
        return NextResponse.json({ error: "RankUp AI is temporarily busy. Please try again in a moment." }, { status: 429 });
      }
    } catch (err) {
      console.error('Rate limit check failed:', err);
    }

    // Safely get the user's latest query
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    let groundingData = { used: false, source: '', chapter: '', chunks: 0, scores: [] as number[], topics: [] as string[] };
    let ncertContext = '';
    let embeddingGenerated = false;

    if (lastUserMessage) {
      const userQuery = lastUserMessage.content;
      
      try {
        const queryEmbedding = await generateQueryEmbedding(userQuery);
        embeddingGenerated = true;

        const CHAPTERS = [
          'Chemical Reactions and Equations',
          'Acids, Bases and Salts',
          'Metals and Non-metals',
          'Carbon and its Compounds',
          'Life Processes',
          'Control and Coordination',
          'How do Organisms Reproduce?',
          'Heredity',
          'Light - Reflection and Refraction',
          'The Human Eye and the Colourful World',
          'Electricity',
          'Magnetic Effects of Electric Current',
          'Our Environment'
        ];

        const matchThreshold = 0.65;
        const topK = 5;
        
        let allChunks: any[] = [];
        const results = await Promise.all(CHAPTERS.map(ch => 
          supabase.rpc('match_knowledge_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: topK,
            p_class: '10',
            p_subject: 'Science',
            p_chapter: ch
          }).then(res => ({ ...res, chapter: ch }))
        ));
        
        for (const result of results) {
          if (result.error) {
            console.error('Vector search error for chapter', result.chapter, ':', result.error);
          } else if (result.data) {
            allChunks = allChunks.concat(result.data.map((c: any) => ({ ...c, chapter: result.chapter })));
          }
        }
        
        allChunks.sort((a, b) => b.similarity - a.similarity);
        const chunks = allChunks.slice(0, topK);

        console.log('CHUNKS RETRIEVED (top):', chunks.length);

        if (chunks && chunks.length > 0) {
          ncertContext = chunks.map((c: any) => c.content).join('\n\n---\n\n');
          groundingData = {
            used: true,
            source: 'NCERT Class 10 Science',
            chapter: chunks[0].chapter,
            chunks: chunks.length,
            scores: chunks.map((c: any) => c.similarity),
            topics: chunks.map((c: any) => c.topic)
          };
        }
      } catch (err) {
        console.error('Failed to generate embedding or query supabase:', err);
      }
    }

    let finalSystemPrompt = SYSTEM_PROMPT_BASE;
    if (ncertContext) {
      finalSystemPrompt += `\n\nAUTHORITATIVE NCERT CONTEXT:\n${ncertContext}\n\nINSTRUCTIONS:
- Use the supplied NCERT context as the primary source for factual claims.
- Do not invent information that is not supported by the supplied context when answering an NCERT-grounded question.
- Do not blindly dump the answer; preserve the existing Socratic tutoring behaviour by guiding the student step-by-step.`;
    } else {
      finalSystemPrompt += `\n\nAUTHORITATIVE NCERT CONTEXT:
None available or the available NCERT context is insufficient.

INSTRUCTIONS:
- If the student asks a factual NCERT question (e.g. from Class 10 Science Chapter 1) and no context is provided, say that the available NCERT context is insufficient instead of pretending it does.
- You may still help them with general Socratic tutoring if it's a general question not requiring specific textbook text.`;
    }

    // Format messages for Gemini API (Bound history to save tokens)
    const MAX_HISTORY = 5;
    const recentMessages = messages.slice(-MAX_HISTORY);
    const formattedMessages = recentMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: finalSystemPrompt }]
      },
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.7,
      }
    };

    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    let response;
    let retries = 3;
    let delay = 1000;
    let retriesUsed = 0;
    
    for (let i = 0; i <= retries; i++) {
      retriesUsed = i;
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      if ((response.status === 429 || response.status === 503) && i < retries) {
        const errorText = await response.clone().text().catch(() => '');
        
        // Break early if we detect persistent quota exhaustion to prevent spamming
        if (errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('exhausted')) {
          console.warn('Persistent Quota Exhaustion detected. Aborting retries.');
          break;
        }

        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2; // Exponential backoff
        continue;
      }
      break;
    }
    
    // Usage Observability Logging
    console.log(JSON.stringify({
      event: 'chat_request',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      ip: ip,
      embeddingGenerated: embeddingGenerated,
      chunksRetrieved: groundingData.chunks,
      topSimilarity: groundingData.scores[0] || null,
      httpStatus: response ? response.status : null,
      retriesUsed: retriesUsed
    }));

    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error('Gemini API Error:', errorData);
      
      const statusCode = response?.status || 500;
      if (statusCode === 429 || statusCode === 503) {
        return NextResponse.json({ error: "RankUp AI is temporarily busy. Please try again in a moment." }, { status: 429 });
      }
      
      const apiErrorMessage = errorData?.error?.message || JSON.stringify(errorData) || 'Unknown error';
      const safeErrorMsg = `Gemini returned HTTP ${statusCode}: ${apiErrorMessage}`;
      return NextResponse.json({ error: safeErrorMsg }, { status: statusCode });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return NextResponse.json({ error: 'Received empty response from AI.' }, { status: 500 });
    }

    return NextResponse.json({ 
      response: replyText,
      grounding: groundingData
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
