import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptAnswer } from '@/lib/evaluate';
import { YoutubeTranscript } from 'youtube-transcript';

// 45 minutes limit in milliseconds
const MAX_VIDEO_DURATION_MS = 45 * 60 * 1000; 

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    
    // Safety payload limit
    if (bodyText.length > 512 * 1024) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    }

    const { videoUrl, count, difficulty, questionType } = JSON.parse(bodyText);

    if (!videoUrl) {
       return NextResponse.json({ error: 'YouTube URL is required.' }, { status: 400 });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
       return NextResponse.json({ error: 'Invalid YouTube URL. Please provide a valid link.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured.' }, { status: 503 });
    }

    // Rate Limiter
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
      // Stricter rate limit for YouTube tests (e.g., 5 requests per minute)
      const { data: isAllowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        client_ip: ip + '_youtube',
        max_requests: 5,
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

    // 1. Fetch Transcript
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err: any) {
      console.error("Transcript fetch error:", err);
      return NextResponse.json({ error: 'Transcript unavailable for this video. Please ensure the video has closed captions enabled.' }, { status: 400 });
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json({ error: 'No transcript found for this video.' }, { status: 400 });
    }

    // 2. Validate Duration
    const lastItem = transcriptItems[transcriptItems.length - 1];
    // offset is in ms
    if (lastItem.offset > MAX_VIDEO_DURATION_MS) {
       return NextResponse.json({ error: 'Video is too long. Please select a video that is 45 minutes or less.' }, { status: 400 });
    }

    // 3. Clean and format transcript
    // Map to string with rough timestamps for the AI to reference
    let fullTranscript = '';
    for (const item of transcriptItems) {
      // Decode basic HTML entities that might appear
      let text = item.text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      if (text) {
         // rough minutes:seconds
         const totalSeconds = Math.floor(item.offset / 1000);
         const minutes = Math.floor(totalSeconds / 60);
         const seconds = totalSeconds % 60;
         const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
         fullTranscript += `[${timeString}] ${text}\n`;
      }
    }

    // Safety fallback truncate just in case to protect Gemini quota
    // Gemini 1.5 Flash supports 1M+ tokens, but to be extremely safe, limit characters
    // 45 mins of speech is roughly 6000-7000 words. ~40,000 chars. We allow up to 150,000 chars.
    if (fullTranscript.length > 150000) {
       fullTranscript = fullTranscript.substring(0, 150000) + '... (truncated)';
    }

    // 4. Generate Test
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const systemPrompt = `You are an expert educational examiner. Your task is to generate a custom test strictly based ONLY on the provided YouTube video transcript.

CRITICAL RULES:
1. Do NOT introduce external knowledge. Base every question and explanation entirely on the provided transcript.
2. If the transcript does not contain enough educational content to generate ${count} good questions, generate as many as you safely can. Do NOT invent facts or hallucinate.
3. For Numerical questions: Label them as "type": "Numerical". Make sure the answer is solvable from the transcript.
4. For MCQs: Ensure exactly ONE correct answer.
5. Provide the 'sourceSection' for each question (e.g., the timestamp like "12:35").

Return the output in EXACTLY this JSON schema:
{
  "title": "A descriptive title based on the transcript",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ" | "Short Answer" | "Numerical" | "Assertion-Reason",
      "question": "The question text",
      "options": ["A", "B", "C", "D"], // Only for MCQ and Assertion-Reason
      "correctAnswer": "The exact correct answer (must match one option exactly for MCQ)",
      "explanation": "Detailed explanation based strictly on the transcript.",
      "sourceSection": "Timestamp or rough section (e.g. 05:20)"
    }
  ]
}
`;

    const userPrompt = `Generate a ${difficulty} difficulty test with ${count} questions. Preferred question types: ${questionType}.
    
VIDEO TRANSCRIPT:
${fullTranscript}
`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
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
      
      if ((response.status === 429 || response.status === 503) && i < retries) {
        const errorText = await response.clone().text().catch(() => '');
        if (errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('exhausted')) {
          break;
        }
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
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
        const token = encryptAnswer(q.correctAnswer, q.explanation);
        return {
          id: `yq${idx}-${Date.now()}`,
          type: q.type,
          question: q.question,
          options: q.options,
          answerToken: token,
          sourceSection: q.sourceSection
        };
      });
    } else {
       throw new Error("Invalid format received from AI.");
    }

    return NextResponse.json({
      title: testObject.title || "YouTube Video Assessment",
      videoId,
      questions: testObject.questions || []
    });

  } catch (error: any) {
    console.error('YouTube Test Generation API Error:', error);
    
    // Handle specific errors
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
       return NextResponse.json({ error: 'RankUp AI is temporarily busy. Please wait a moment and try again.' }, { status: 429 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred during test generation.' }, { status: 500 });
  }
}
