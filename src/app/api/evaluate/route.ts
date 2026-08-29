import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateQueryEmbedding } from '@/lib/embeddings';
import { createClient as createServerClientLocal } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerClientLocal();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyText = await req.text();
    if (bodyText.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large. Max allowed size is 5MB.' }, { status: 413 });
    }

    const { questionText, maxMarks, image, mimeType } = JSON.parse(bodyText);

    if (!image && !questionText) {
      return NextResponse.json({ error: 'Please provide an image or a question.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'AI is not currently configured. Please add GEMINI_API_KEY to environment variables.' 
      }, { status: 503 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // Server-side rate limit using Supabase RPC
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
      const { data: isAllowed, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
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
    
    let extractedQuestion = questionText?.trim() || '';
    let extractedAnswer = '';
    let extractedDiagram = '';

    // STAGE 1: Image Understanding
    if (image) {
      console.log("Evaluation Stage 1: Multimodal Image Understanding");
      try {
        const imagePart = {
          inline_data: {
            mime_type: mimeType || 'image/jpeg',
            data: image
          }
        };
        const promptPart = {
          text: `Analyze this handwritten student answer image. Respond ONLY with a valid JSON object matching this schema (do not include markdown formatting or backticks):
{
  "questionText": "Any explicit question asked or printed in the image. Leave blank if none.",
  "studentWork": "Transcribe any handwritten steps, reasoning, calculations, or final answers.",
  "diagramDescription": "Describe any diagrams, labels, or relationships present."
}`
        };

        const stage1Body = {
          contents: [{ role: 'user', parts: [promptPart, imagePart] }],
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
            const parsed = JSON.parse(cleanedText);
            
            if (!extractedQuestion && parsed.questionText) {
               extractedQuestion = parsed.questionText;
            }
            extractedAnswer = parsed.studentWork || '';
            extractedDiagram = parsed.diagramDescription || '';
          }
        } else {
           console.error("Stage 1 Image Understanding failed:", await stg1Res.text());
           if (stg1Res.status === 429 || stg1Res.status === 503) {
             return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
           }
           return NextResponse.json({ error: 'Failed to process image.' }, { status: 500 });
        }
      } catch (err) {
        console.error("Stage 1 execution error:", err);
        return NextResponse.json({ error: 'Error analyzing image.' }, { status: 500 });
      }
    }

    if (!extractedQuestion) {
       return NextResponse.json({ 
          error: 'Could not determine the question from the image. Please enter the question manually.' 
       }, { status: 400 });
    }

    // STAGE 2: RAG Grounding
    console.log("Evaluation Stage 2: RAG Grounding for question:", extractedQuestion);
    let ncertContext = '';
    let chapter = 'Unknown';
    let topic = 'Unknown';
    try {
      const queryEmbedding = await generateQueryEmbedding(extractedQuestion);
      
      const matchThreshold = 0.65;
      const topK = 5;
      
      const result = await supabaseAdmin.rpc('match_knowledge_chunks_global', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: topK,
        p_class: '10',
        p_subject: 'Science'
      });
      
      if (result.error) {
        console.error('Global vector search error:', result.error);
      } else if (result.data && result.data.length > 0) {
        const chunks = result.data;
        ncertContext = chunks.map((c: any) => c.content).join('\n\n---\n\n');
        chapter = chunks[0].chapter || chapter;
        topic = chunks[0].topic || topic;
      }
    } catch (err) {
      console.error('Failed to generate embedding or query supabase:', err);
    }

    // STAGE 3: Final Evaluation
    console.log("Evaluation Stage 3: Generating evaluation");
    const evaluationPrompt = `You are an AI assistant evaluating a Class 10 Science handwritten answer.
    
QUESTION:
${extractedQuestion}

MAX MARKS: ${maxMarks || 'Not specified'}

STUDENT ANSWER TRANSCRIBED:
${extractedAnswer}
${extractedDiagram ? `DIAGRAM DESCRIPTION: ${extractedDiagram}` : ''}

AUTHORITATIVE NCERT CONTEXT:
${ncertContext ? ncertContext : 'None available. Evaluate based on general scientific knowledge if appropriate, but note the lack of NCERT context if it affects certainty.'}

INSTRUCTIONS:
Evaluate the student's answer based on the question and NCERT context.
Do NOT invent an official CBSE score. Give an "AI-estimated score".
Do NOT expose internal chain-of-thought.
Return ONLY a JSON object with this exact schema (no markdown, no backticks):
{
  "estimatedMarks": 2.5,
  "confidence": "High" | "Low" | "Insufficient Context",
  "strengths": ["string"],
  "missingSteps": ["string"],
  "mistakes": ["string"],
  "improvementTips": ["string"]
}
Note: 
- Confidence is 'High' if the image transcription is clear and question is grounded.
- 'Low' if handwriting is unclear.
- 'Insufficient Context' if you cannot grade it accurately.
- Handle formatting differences flexibly (e.g. 6J vs 6 J).
- Give credit for equivalent subjective wording.`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: evaluationPrompt }] }],
      generationConfig: {
        temperature: 0.1,
      }
    };

    let response;
    let retries = 3;
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
       console.error("Evaluation failed.");
       const statusCode = response?.status || 500;
       if (statusCode === 429 || statusCode === 503) {
         return NextResponse.json({ error: "RankUp AI is temporarily busy. Please wait a moment and try again." }, { status: 429 });
       }
       return NextResponse.json({ error: 'Failed to generate evaluation.' }, { status: statusCode });
    }

    const evalData = await response.json();
    const rawEvalText = evalData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawEvalText) {
      return NextResponse.json({ error: 'Received empty evaluation response from AI.' }, { status: 500 });
    }

    const cleanedEvalText = rawEvalText.replace(/```json/g, '').replace(/```/g, '').trim();
    let evaluationResult;
    try {
       evaluationResult = JSON.parse(cleanedEvalText);
    } catch(e) {
       console.error("Failed to parse eval JSON:", cleanedEvalText);
       return NextResponse.json({ error: 'Failed to parse AI evaluation.' }, { status: 500 });
    }

    // Calculate percentage if maxMarks is provided
    let percentage = null;
    if (maxMarks && evaluationResult.estimatedMarks !== null) {
       percentage = (evaluationResult.estimatedMarks / maxMarks) * 100;
    }

    // Save to database
    let savedEvalId = null;
    try {
       const { data: insertedData, error: insertError } = await supabaseAdmin
         .from('answer_evaluations')
         .insert({
            user_id: user.id,
            question_text: extractedQuestion,
            answer_text: extractedAnswer + (extractedDiagram ? `\nDiagram: ${extractedDiagram}` : ''),
            chapter: chapter,
            topic: topic,
            total_marks: maxMarks ? parseInt(maxMarks) : null,
            estimated_marks: evaluationResult.estimatedMarks,
            percentage: percentage,
            confidence: evaluationResult.confidence,
            strengths: evaluationResult.strengths || [],
            missing_steps: evaluationResult.missingSteps || [],
            mistakes: evaluationResult.mistakes || [],
            improvement_tips: evaluationResult.improvementTips || []
         })
         .select()
         .single();
         
       if (insertError) {
         console.error('Failed to save evaluation to DB:', insertError);
       } else if (insertedData) {
         savedEvalId = insertedData.id;
       }

       // Log Activity
       await supabaseAdmin.from('student_activity').insert({
         user_id: user.id,
         event_type: 'answer_evaluation',
         chapter: chapter,
         topic: topic,
         metadata_json: { question: extractedQuestion.substring(0, 100) }
       });

       // Mistake Book Integration
       const reportedMistakes = evaluationResult.mistakes || [];
       if (reportedMistakes.length > 0) {
         try {
            const prompt = `Analyze these mistakes identified in a student's answer to the question: "${extractedQuestion}".
Mistakes: ${JSON.stringify(reportedMistakes)}

Determine if each mistake represents a meaningful learning gap (e.g., conceptual misunderstanding, calculation error, formula mistake, unit mistake) or just a trivial wording/presentation issue.
Return ONLY a JSON array in exactly this format:
[
  {
    "original_mistake": "The exact string from the input array",
    "isMeaningful": true,
    "category": "Conceptual mistake", // or Calculation mistake, Formula mistake, Unit mistake, etc. Or null.
    "summary": "Brief summary of what went wrong"
  }
]`;
            const mbRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
            });

            if (mbRes.ok) {
              const mbData = await mbRes.json();
              const rawText = mbData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysisResult = JSON.parse(cleanedText);
                
                for (const analysis of analysisResult) {
                  if (analysis.isMeaningful) {
                     const { data: existing } = await supabaseAdmin
                       .from('mistake_book')
                       .select('*')
                       .eq('user_id', user.id)
                       .eq('chapter', chapter)
                       .eq('topic', topic)
                       .eq('question_text', extractedQuestion)
                       .single();

                     if (existing) {
                        await supabaseAdmin
                          .from('mistake_book')
                          .update({
                            occurrence_count: existing.occurrence_count + 1,
                            status: existing.status === 'fixed' ? 'practicing' : existing.status,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', existing.id);
                     } else {
                        await supabaseAdmin.from('mistake_book').insert({
                          user_id: user.id,
                          question_text: extractedQuestion,
                          student_answer: extractedAnswer + (extractedDiagram ? `\nDiagram: ${extractedDiagram}` : ''),
                          correct_answer: 'See explanation or NCERT', // In answer eval we don't always have a single correct answer string
                          chapter: chapter,
                          topic: topic,
                          mistake_category: analysis.category || null,
                          mistake_summary: analysis.summary || analysis.original_mistake,
                          source_type: 'answer_evaluation',
                          source_id: savedEvalId,
                          status: 'new'
                        });
                     }
                  }
                }
              }
            }
         } catch (err) {
            console.error("Failed to process mistake book entries:", err);
         }
       }
       
    } catch (err) {
       console.error("DB error:", err);
    }

    return NextResponse.json({
       evaluation: evaluationResult,
       questionText: extractedQuestion,
       answerText: extractedAnswer,
       chapter,
       topic,
       id: savedEvalId
    });

  } catch (error) {
    console.error('Evaluation API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
