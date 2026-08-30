import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function generateEmbedding(text: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });
  const data = await response.json();
  return data.embedding.values;
}

const SCIENCE_QUERIES = [
  "What is Ohm's law?",
  "What is heredity?",
  "How does a reflex arc work?",
  "What is the 10 percent law?",
  "What is Fleming's left-hand rule?"
];

const MATHS_QUERIES = [
  "Prove that √2 is irrational.", // Ch 1
  "State the Fundamental Theorem of Arithmetic.", // Ch 1
  "Find the zeroes of the quadratic polynomial x² + 7x + 10.", // Ch 2
  "Solve x + y = 14 and x - y = 4.", // Ch 3
  "Find the roots of 2x² - 5x + 3 = 0.", // Ch 4
  "What is the 10th term of the AP: 2, 7, 12, ...?", // Ch 5
  "State Pythagoras theorem.", // Ch 6 (Triangles)
  "Find the distance between points A(2, 3) and B(4, 1).", // Ch 7
  "Evaluate sin 60° cos 30° + sin 30° cos 60°.", // Ch 8
  "Prove that the lengths of tangents drawn from an external point to a circle are equal.", // Ch 10
  "Find the area of a sector of a circle with radius 6 cm if angle of the sector is 60°.", // Ch 12 (Areas related to circles)
  "Find the mean of the grouped data.", // Ch 14 (Statistics)
  "A die is thrown once. Find the probability of getting a prime number.", // Ch 15 (Probability)
  "How do you solve a pair of linear equations using the substitution method?", // Conceptual Ch 3
  "What is the relationship between the zeroes and coefficients of a polynomial?", // Conceptual Ch 2
];

const OUT_OF_SCOPE = [
  "What is the formula for integration by parts?",
  "Explain quantum mechanics.",
  "Solve this differential equation.",
  "What is the theory of relativity?",
  "College calculus limit problem."
];

const VAGUE_QUERIES = [
  "Why does this happen?",
  "Why does resistance increase?",
  "What happens next?",
  "Explain this result."
];

async function runQuery(q: string, expectedSubject: string | null) {
  const emb = await generateEmbedding(q);
  const matchThreshold = 0.65;
  
  let chosenSubject = 'Unknown';
  let bestScore = 0;
  let allChunks: any[] = [];
  
  // Dual-routing logic as in API
  const [sci, math] = await Promise.all([
    supabase.rpc('match_knowledge_chunks_global', {
      query_embedding: emb, match_threshold: matchThreshold, match_count: 5, p_class: '10', p_subject: 'Science'
    }),
    supabase.rpc('match_knowledge_chunks_global', {
      query_embedding: emb, match_threshold: matchThreshold, match_count: 5, p_class: '10', p_subject: 'Mathematics'
    })
  ]);
  
  const sciScore = sci.data?.[0]?.similarity || 0;
  const mathScore = math.data?.[0]?.similarity || 0;
  
  if (mathScore > sciScore && mathScore > matchThreshold) {
    chosenSubject = 'Mathematics';
    bestScore = mathScore;
    allChunks = math.data || [];
  } else if (sciScore >= mathScore && sciScore > matchThreshold) {
    chosenSubject = 'Science';
    bestScore = sciScore;
    allChunks = sci.data || [];
  }
  
  let pass = expectedSubject === null ? (chosenSubject === 'Unknown') : (chosenSubject === expectedSubject);
  
  if (chosenSubject !== 'Unknown') {
    // Apply Borderline OOD Guard manually here since this script bypasses the API
    if (bestScore >= 0.65 && bestScore < 0.68) {
      const oodKeywords = ['quantum', 'differential equation', 'integration by', 'calculus', 'advanced mechanics', 'integral', 'derivative', 'relativity', 'thermodynamics'];
      const qLower = q.toLowerCase();
      if (oodKeywords.some(kw => qLower.includes(kw))) {
         chosenSubject = 'Unknown';
         bestScore = 0;
         allChunks = [];
         pass = expectedSubject === null ? true : false;
      }
    }
  }
  
  console.log(`\nQuery: "${q}"`);
  console.log(`Expected: ${expectedSubject || 'None'}, Got: ${chosenSubject}, MaxScore: ${bestScore.toFixed(3)}, Chunks: ${allChunks.length}`);
  console.log(`PASS: ${pass}`);
  if (allChunks.length > 0) {
    console.log(`Top Chapter: ${allChunks[0].chapter} | Topic: ${allChunks[0].topic}`);
  }
}

async function run() {
  console.log("=== PHASE 5: SCIENCE REGRESSION ===");
  for (const q of SCIENCE_QUERIES) await runQuery(q, 'Science');
  
  console.log("\n=== PHASE 4: MATHEMATICS RAG TESTING ===");
  for (const q of MATHS_QUERIES) await runQuery(q, 'Mathematics');
  
  console.log("\n=== PHASE 18: OUT OF SCOPE ===");
  for (const q of OUT_OF_SCOPE) await runQuery(q, null);
  
  console.log("\n=== TASK 2: VAGUE QUERIES ===");
  for (const q of VAGUE_QUERIES) await runQuery(q, 'Science'); // They should resolve to some subject (often Science) without being rejected
}

run().catch(console.error);
