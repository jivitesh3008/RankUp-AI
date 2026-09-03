import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.GEMINI_API_KEY!;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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
      "equation": "String - Chemical equation or mathematical theorem",
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

  try {
    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: `Generate the structured JSON short note for ${chapter} in ${subject}.` }] }],
      generationConfig: { 
        temperature: 0.2,
        response_mime_type: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API Error for ${chapter}: ${response.status} ${response.statusText} - ${errText}`);
      return;
    }

    const data = await response.json();
    let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      console.error(`Empty response for ${chapter}`);
      return;
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
    } else {
      console.log(`✅ Saved ${chapter}`);
    }

  } catch (err) {
    console.error(`Exception generating ${chapter}:`, err);
  }
}

const SCIENCE_CHAPTERS: string[] = [];

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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Mocking remaining math chapters due to Gemini API limits...");
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
    const dummyJson = {
      title: chapter,
      overview: "This is a placeholder note. The Gemini API free tier limit of 20 requests was reached during generation. Please re-run the generation script tomorrow to fetch the actual NCERT content.",
      sections: [
        { type: "concept", title: "API Limit Reached", points: ["Run `npx tsx scripts/generate_notes.ts` tomorrow to fully populate this chapter."] }
      ],
      important_formulas: [],
      important_equations: [],
      common_mistakes: [],
      exam_tips: [],
      revision_points: []
    };

    const { error: insertError } = await supabase.from('chapter_notes').upsert({
      subject: 'Mathematics',
      chapter,
      title: dummyJson.title,
      overview: dummyJson.overview,
      sections: dummyJson.sections,
      important_formulas: dummyJson.important_formulas,
      important_equations: dummyJson.important_equations,
      common_mistakes: dummyJson.common_mistakes,
      exam_tips: dummyJson.exam_tips,
      revision_points: dummyJson.revision_points,
      version: 1
    }, { onConflict: 'subject, chapter, version' });

    if (insertError) {
      console.error(`Failed to insert ${chapter}:`, insertError);
    } else {
      console.log(`✅ Saved Mocked ${chapter}`);
    }
  }
}

run();
