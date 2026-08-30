import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const geminiKey = process.env.GEMINI_API_KEY || '';
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

const TEST_QUERIES = [
  // Math
  "Solve x² - 5x + 6 = 0.",
  "Prove that √2 is irrational.",
  "Find the zeroes of x² + 7x + 10.",
  "Find the 10th term of an arithmetic progression.",
  "Find the distance between (2,3) and (5,7).",
  "A die is thrown once. Find the probability of getting a prime number.",
  "Evaluate sin 60° cos 30° + sin 30° cos 60°.",
  "State Pythagoras theorem.",
  "Find the mean of the grouped data.",
  "Prove that the lengths of tangents drawn from an external point to a circle are equal.",
  "Find the area of a sector of a circle with radius 6 cm if angle of the sector is 60°.",
  "Solve x + y = 14 and x - y = 4.",
  "Find the roots of 2x² - 5x + 3 = 0.",
  "What is the relationship between the zeroes and coefficients of a polynomial?",
  "How do you solve a pair of linear equations using the substitution method?",
  // Science
  "What is Ohm's law?",
  "What is heredity?",
  "How does a reflex arc work?",
  "What is the 10 percent law?",
  "What is Fleming's left-hand rule?",
  "What is an electric motor?",
  "Explain the process of photosynthesis.",
  "What are the differences between aerobic and anaerobic respiration?",
  "State Mendel's laws of inheritance.",
  "What is the refractive index?",
  "Describe the structure of a human heart.",
  "What is a balanced chemical equation?",
  "Explain the Tyndall effect.",
  "What is the function of the nephron?",
  "How is ozone formed in the upper atmosphere?"
];

function guessSubject(q: string) {
  const lower = q.toLowerCase();
  const mathKeywords = ['solve', 'prove that', 'find the', 'zeroes', 'polynomial', 'arithmetic progression', 'distance between', 'probability', 'sin ', 'cos ', 'tan ', 'theorem', 'mean ', 'tangent', 'radius', 'equation', 'roots'];
  if (mathKeywords.some(kw => lower.includes(kw))) return 'Mathematics';
  return 'Science';
}

async function run() {
  let oldRpcCalls = 0;
  let newRpcCalls = 0;
  let matches = 0;

  for (const q of TEST_QUERIES) {
    const emb = await generateEmbedding(q);

    // Old approach (2 RPCs)
    const [sci, math] = await Promise.all([
      supabase.rpc('match_knowledge_chunks_global', { query_embedding: emb, match_threshold: 0.65, match_count: 5, p_class: '10', p_subject: 'Science' }),
      supabase.rpc('match_knowledge_chunks_global', { query_embedding: emb, match_threshold: 0.65, match_count: 5, p_class: '10', p_subject: 'Mathematics' })
    ]);
    oldRpcCalls += 2;
    const sciScore = sci.data?.[0]?.similarity || 0;
    const mathScore = math.data?.[0]?.similarity || 0;
    const oldTop = mathScore > sciScore ? math.data[0] : (sci.data && sci.data[0] ? sci.data[0] : null);

    // New approach (1 RPC)
    const guessed = guessSubject(q);
    const newRes = await supabase.rpc('match_knowledge_chunks_global', { query_embedding: emb, match_threshold: 0.65, match_count: 5, p_class: '10', p_subject: guessed });
    newRpcCalls += 1;
    const newTop = newRes.data?.[0];

    const match = oldTop?.id === newTop?.id;
    if (match) matches++;
    else {
      console.log(`Mismatch on: "${q}"`);
      console.log(`Old: ${oldTop?.subject} (${oldTop?.similarity}) | New (guessed ${guessed}): ${newTop?.subject} (${newTop?.similarity})`);
    }
  }

  console.log(`\nResults on ${TEST_QUERIES.length} queries:`);
  console.log(`Matches: ${matches}/${TEST_QUERIES.length}`);
  console.log(`Old RPC calls: ${oldRpcCalls}`);
  console.log(`New RPC calls: ${newRpcCalls}`);
}

run().catch(console.error);
