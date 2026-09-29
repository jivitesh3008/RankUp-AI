import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.GEMINI_API_KEY!;
const modelName = 'gemini-3.5-flash-lite';

if (!supabaseUrl || !supabaseKey || !apiKey) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateChapterNote(subject: string, chapter: string) {
  console.log(`\nGenerating notes for ${subject} - ${chapter}...`);
  
  // Fetch up to 15 chunks of context for the chapter
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('class', '10')
    .eq('subject', subject)
    .ilike('chapter', `%${chapter}%`)
    .limit(15);

  let ncertContext = '';
  if (!error && chunks && chunks.length > 0) {
    ncertContext = chunks.map(c => c.content).join('\n\n---\n\n');
  }

  const systemPrompt = `You are an expert CBSE Class 10 ${subject} educator creating a highly structured, exam-oriented revision note for the chapter: ${chapter}.
Your goal is to provide ready-to-use, concise, NCERT-focused notes.

CRITICAL INSTRUCTIONS:
- You MUST output strictly valid JSON.
- DO NOT wrap the JSON in markdown code blocks (\`\`\`json). Just return the raw JSON object.
- Use standard LaTeX/MathJax for mathematical expressions where appropriate (e.g., $a^2 + b^2 = c^2$, $\\frac{a}{b}$).

JSON SCHEMA:
{
  "title": "String - The exact chapter name",
  "overview": "String - A 2-3 sentence overview of what this chapter is about.",
  "sections": [
    {
      "title": "String - Concept Title",
      "type": "concept",
      "points": ["String - Bullet point 1", "String - Bullet point 2"]
    }
    // Include 4-7 sections covering the core concepts of the chapter
  ],
  "important_formulas": [
    // Array of objects (or empty array if none)
    {
      "formula": "String - The formula in math notation if applicable",
      "explanation": "String - What it is used for"
    }
  ],
  "important_equations": [
    // Array of objects (or empty array if none)
    {
      "equation": "String - Chemical equation or mathematical theorem statement",
      "explanation": "String - What it represents"
    }
  ],
  "common_mistakes": [
    "String - Mistake 1",
    "String - Mistake 2"
  ],
  "exam_tips": [
    "String - Tip 1",
    "String - Tip 2"
  ],
  "revision_points": [
    "String - Last minute quick point 1",
    "String - Last minute quick point 2"
  ]
}

Ensure the content takes about 5-10 minutes to revise. Do not hallucinate content outside of Class 10 scope.

NCERT CONTEXT (Use this to ground your notes):
${ncertContext || 'No context found. Rely on general Class 10 CBSE knowledge.'}
`;

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: `Generate the structured JSON short note for ${chapter} in ${subject}.` }] }],
      generationConfig: { 
        temperature: 0.2,
        response_mime_type: "application/json"
      }
    };

    let success = false;
    for (let parseAttempt = 1; parseAttempt <= 3; parseAttempt++) {
        try {
            let response;
            for (let attempt = 1; attempt <= 10; attempt++) {
              response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestBody),
                }
              );
              if (response.ok) break;
              if (response.status === 429) {
                  console.log(`429 received. Quota exceeded. Retrying in 35 seconds...`);
                  await new Promise(resolve => setTimeout(resolve, 35000));
                  continue;
              }
              if (attempt === 10 || response.status !== 503) break;
              console.log(`503 received. Retrying in ${attempt * 5} seconds...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 5000));
            }

            if (!response || !response.ok) {
              const errText = await response?.text();
              console.error(`Gemini API Error for ${chapter}: ${response?.status} ${response?.statusText} - ${errText}`);
              return false;
            }

            const data = await response.json();
            let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!replyText) {
              console.error(`Empty response for ${chapter}`);
              return false;
            }

            if (replyText.startsWith('\`\`\`json')) {
                replyText = replyText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
            }
            if (replyText.startsWith('\`\`\`')) {
                replyText = replyText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
            }

    const parsedJson = JSON.parse(replyText);

            const { error: insertError } = await supabase.from('chapter_notes').upsert({
              subject,
              chapter,
              title: parsedJson.title || chapter,
              overview: parsedJson.overview || '',
              sections: parsedJson.sections || [],
              important_formulas: parsedJson.important_formulas || [],
              important_equations: parsedJson.important_equations || [],
              common_mistakes: parsedJson.common_mistakes || [],
              exam_tips: parsedJson.exam_tips || [],
              revision_points: parsedJson.revision_points || [],
              version: 1
            }, { onConflict: 'subject, chapter, version' });

            if (insertError) {
              console.error(`Failed to insert ${chapter}:`, insertError);
              return false;
            } else {
              console.log(`✅ Saved ${chapter}`);
              return true;
            }
        } catch (err) {
            console.log(`JSON parse error on attempt ${parseAttempt} for ${chapter}. Retrying...`);
            if (parseAttempt === 3) {
                console.error(`Exception generating ${chapter} after 3 attempts:`, err);
                return false;
            }
        }
    }
    return false;
}

async function run() {
  const MATHS_CHAPTERS = [
    'Triangles',
    'Coordinate Geometry',
    'Introduction to Trigonometry',
    'Some Applications of Trigonometry',
    'Circles',
    'Areas Related to Circles',
    'Surface Areas and Volumes',
    'Statistics',
    'Probability'
  ];

  for (const chapter of MATHS_CHAPTERS) {
    // Check if valid note exists
    const { data: existing, error } = await supabase
        .from('chapter_notes')
        .select('overview')
        .eq('subject', 'Mathematics')
        .eq('chapter', chapter)
        .eq('version', 1)
        .single();
    
    if (existing && existing.overview && !existing.overview.includes('API free tier limit')) {
        console.log(`Skipping ${chapter}, valid notes already exist.`);
        continue;
    }

    const success = await generateChapterNote('Mathematics', chapter);
    if (!success) {
        console.error(`Stopping generation due to failure on ${chapter}`);
        break;
    }
    
    // Wait a little bit to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

run();
