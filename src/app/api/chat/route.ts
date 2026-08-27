import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQueryEmbedding } from '@/lib/embeddings';
import { createClient as createServerClientLocal } from '@/utils/supabase/server';

const embeddingCache = new Map<string, { vector: number[], timestamp: number }>();
const responseCache = new Map<string, { data: any, timestamp: number }>();

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function cleanupCache(cache: Map<string, { timestamp: number }>) {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

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
    const serverSupabase = await createServerClientLocal();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const bodyText = await req.text();
    
    // Safety limit: ~5MB (5 * 1024 * 1024 bytes)
    // We check the stringified payload length.
    if (bodyText.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large. Max allowed size is 5MB.' }, { status: 413 });
    }

    const { messages } = JSON.parse(bodyText);

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
        return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
      }
    } catch (err) {
      console.error('Rate limit check failed:', err);
    }

    // Safely get the user's latest query
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    let groundingData = { used: false, source: '', chapter: '', chunks: 0, scores: [] as number[], topics: [] as string[] };
    let ncertContext = '';
    let embeddingGenerated = false;
    let newlyExtractedImageContext = null;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    cleanupCache(responseCache);
    const cacheKey = messages.length === 1 && lastUserMessage && (!lastUserMessage.images || lastUserMessage.images.length === 0) && !lastUserMessage.imageContext ? lastUserMessage.content.trim() : null;
    if (cacheKey && responseCache.has(cacheKey)) {
        console.log("Response cache hit for:", cacheKey);
        return NextResponse.json(responseCache.get(cacheKey)!.data);
    }

    if (lastUserMessage) {
      // STAGE 1: Image Understanding
      if (lastUserMessage.images && lastUserMessage.images.length > 0 && !lastUserMessage.imageContext) {
        console.log(`Running Stage 1: Multimodal Image Understanding for ${lastUserMessage.images.length} images`);
        try {
          const imageParts = lastUserMessage.images.map((img: any) => ({
            inline_data: {
              mime_type: img.mimeType || 'image/jpeg',
              data: img.base64
            }
          }));
          const promptPart = {
            text: `Analyze these images for a Class 10 science tutor. They may be parts of a single multi-page submission. Respond ONLY with a valid JSON object matching this schema (do not include markdown formatting or backticks):
{
  "imageType": "handwritten_solution" | "textbook_question" | "diagram" | "other",
  "questionText": "Any explicit question asked or printed in the images. Leave blank if none.",
  "studentWork": "Transcribe any handwritten steps, reasoning, or calculations across all images in order.",
  "diagramDescription": "Describe any diagrams, labels, or relationships present.",
  "equations": ["Equation 1", "Equation 2"],
  "likelySubject": "Science" | "Mathematics" | "English",
  "likelyTopic": "Guessed chapter or topic"
}`
          };

          const stage1Body = {
            contents: [{ role: 'user', parts: [promptPart, ...imageParts] }],
            generationConfig: { temperature: 0.1 }
          };

          const stg1Res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stage1Body) }
          );

          if (stg1Res.ok) {
            const stg1Data = await stg1Res.json();
            const rawJsonText = stg1Data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawJsonText) {
              const cleanedText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
              newlyExtractedImageContext = JSON.parse(cleanedText);
              lastUserMessage.imageContext = newlyExtractedImageContext;
            }
          } else {
             console.error("Stage 1 Image Understanding failed:", await stg1Res.text());
             if (stg1Res.status === 429 || stg1Res.status === 503) {
               return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
             }
          }
        } catch (err) {
          console.error("Stage 1 execution error:", err);
        }
      }

      let userQuery = lastUserMessage.content || '';
      if (lastUserMessage.imageContext?.questionText) {
         userQuery += ' ' + lastUserMessage.imageContext.questionText;
      }
      userQuery = userQuery.trim();
      
      if (userQuery) {
      
      try {
        cleanupCache(embeddingCache);
        let queryEmbedding;
        if (embeddingCache.has(userQuery)) {
           queryEmbedding = embeddingCache.get(userQuery)!.vector;
        } else {
           queryEmbedding = await generateQueryEmbedding(userQuery);
           embeddingCache.set(userQuery, { vector: queryEmbedding, timestamp: Date.now() });
           if (embeddingCache.size > 1000) embeddingCache.clear();
        }
        embeddingGenerated = true;

        const matchThreshold = 0.65;
        const topK = 5;
        
        let allChunks: any[] = [];
        
        const result = await supabase.rpc('match_knowledge_chunks_global', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: topK,
          p_class: '10',
          p_subject: 'Science'
        });
        
        if (result.error) {
          console.error('Global vector search error:', result.error);
        } else if (result.data) {
          allChunks = result.data;
        }
        
        const chunks = allChunks; // already sorted and limited to topK by the global RPC

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
    const formattedMessages = recentMessages.map((msg: any) => {
      let textContent = msg.content || '';
      
      if (msg.role === 'user' && msg.imageContext) {
         textContent += `\n\n[ATTACHED IMAGE CONTENT (Structured Analysis): ${JSON.stringify(msg.imageContext)}]`;
      }
      
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: textContent }]
      };
    });

    const requestBody = {
      system_instruction: {
        parts: [{ text: finalSystemPrompt }]
      },
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.7,
      }
    };

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
      
      if (response.status === 429 || response.status === 503) {
        break; // Fail fast on quota/rate limit
      }
      
      if (!response.ok && i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
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
      retriesUsed: retriesUsed,
      imageCount: lastUserMessage?.images?.length || 0
    }));

    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error('Gemini API Error:', errorData);
      
      const statusCode = response?.status || 500;
      if (statusCode === 429 || statusCode === 503) {
        return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
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

    const finalResponseData = { 
      response: replyText,
      grounding: groundingData,
      ...(newlyExtractedImageContext ? { imageContext: newlyExtractedImageContext } : {})
    };
    
    if (user && lastUserMessage) {
      try {
        await supabase.from('student_activity').insert({
          user_id: user.id,
          event_type: (lastUserMessage.images && lastUserMessage.images.length > 0) ? 'image_question' : 'tutor_question',
          chapter: groundingData.chapter || null,
          metadata_json: { query: (lastUserMessage.content || '').substring(0, 100) }
        });
      } catch (err) {
        console.error('Failed to log activity', err);
      }
    }

    if (cacheKey && finalResponseData.response) {
       responseCache.set(cacheKey, { data: finalResponseData, timestamp: Date.now() });
       if (responseCache.size > 1000) responseCache.clear();
    }

    return NextResponse.json(finalResponseData);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
