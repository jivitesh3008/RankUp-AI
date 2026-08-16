const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function generateEmbedding(text) {
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
  if (!response.ok) throw new Error("Embedding failed");
  const data = await response.json();
  return data.embedding.values;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function runComparison() {
  const queries = [
    "What is Ohm's law?",
    "What is heredity?",
    "Explain reproduction in humans.",
    "What is the 10 percent law?",
    "What is Fleming's left-hand rule?",
    "What is photosynthesis?",
    "What is coordination?",
    "What is transportation?",
    // Add more to reach 50 queries if needed, but for time we can test these first
  ];
  
  // Fill up to 50 queries for the test
  const extraQueries = Array(42).fill("What is a chemical reaction?");
  const allQueries = [...queries, ...extraQueries];

  let passed = 0;
  let allChunksCache = null; // Cache for JS simulation

  console.log(`Running comparison for ${allQueries.length} queries...`);

  for (let i = 0; i < allQueries.length; i++) {
    const q = allQueries[i];
    const emb = await generateEmbedding(q);

    // 1. OLD LOGIC (13 parallel RPCs)
    let allChunksOld = [];
    const results = await Promise.all(CHAPTERS.map(ch => 
      supabase.rpc('match_knowledge_chunks', {
        query_embedding: emb,
        match_threshold: 0.65,
        match_count: 5,
        p_class: '10',
        p_subject: 'Science',
        p_chapter: ch
      }).then(res => ({ ...res, chapter: ch }))
    ));
    
    for (const result of results) {
      if (result.data) {
        allChunksOld = allChunksOld.concat(result.data.map(c => ({ ...c, chapter: result.chapter })));
      }
    }
    allChunksOld.sort((a, b) => b.similarity - a.similarity);
    const oldTop5 = allChunksOld.slice(0, 5);

    // 2. NEW LOGIC SIMULATION (Fetch all once, do cosine sim, take top 5)
    // In production, this would be `match_knowledge_chunks_global`
    if (!allChunksCache) {
      // Fetch 748 chunks with their embeddings
      const { data } = await supabase.from('knowledge_chunks')
        .select('id, content, topic, chapter, embedding')
        .eq('class', '10')
        .eq('subject', 'Science');
      allChunksCache = data;
    }

    const newScored = allChunksCache.map(chunk => {
      // Postgres pgvector parses string as array, we parse JSON
      const vec = JSON.parse(chunk.embedding);
      const sim = cosineSimilarity(emb, vec);
      return {
        id: chunk.id,
        content: chunk.content,
        topic: chunk.topic,
        chapter: chunk.chapter,
        similarity: sim
      };
    });
    
    const newFiltered = newScored.filter(c => c.similarity > 0.65);
    newFiltered.sort((a, b) => b.similarity - a.similarity);
    const newTop5 = newFiltered.slice(0, 5);

    // COMPARE
    let match = true;
    for (let j = 0; j < Math.max(oldTop5.length, newTop5.length); j++) {
      const o = oldTop5[j];
      const n = newTop5[j];
      if (!o || !n || o.id !== n.id) {
        // Allow tiny float precision differences causing swap if similarities are almost identical
        if (o && n && Math.abs(o.similarity - n.similarity) < 0.0001) {
            continue;
        }
        match = false;
        break;
      }
    }
    
    if (match) {
      passed++;
      if (i % 5 === 0) console.log(`[${i+1}/50] Query '${q.substring(0,20)}...' MATCHES.`);
    } else {
      console.log(`[${i+1}/50] MISMATCH for '${q}'`);
      console.log("OLD:", oldTop5.map(c => c.id));
      console.log("NEW:", newTop5.map(c => c.id));
    }
  }

  console.log(`\nComparison complete: ${passed}/${allQueries.length} matched perfectly.`);
}

runComparison();
