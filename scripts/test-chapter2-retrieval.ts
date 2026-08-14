import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function generateQueryEmbedding(text: string): Promise<number[]> {
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

async function verify() {
  const queries = [
      "What is an ecosystem and what are its main components?", 
      "Explain the 10 percent law in a food chain.", 
      "How do CFCs affect the ozone layer?",
      "How do we extract aluminum from bauxite ore?"
  ];
  
  for (const query of queries) {
    console.log(`\nQuerying: "${query}"`);
    const queryEmbedding = await generateQueryEmbedding(query);
    
    const { data: chunks, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.65,
      match_count: 5,
      p_class: '10',
      p_subject: 'Science',
      p_chapter: 'Our Environment'
    });

    if (error) {
      console.error(error);
      continue;
    }

    console.log(`Found ${chunks?.length || 0} chunks.`);
    if (chunks && chunks.length > 0) {
      console.log(`Top chunk score: ${chunks[0].similarity}`);
      console.log(`Top chunk topic: ${chunks[0].topic}`);
      console.log(`Top chunk text: ${chunks[0].content.substring(0, 150)}...`);
      if (chunks.length > 1) {
          console.log(`Second chunk score: ${chunks[1].similarity}`);
      }
    } else {
      console.log('No chunks exceeded the 0.65 threshold.');
    }
  }
}

verify().catch(console.error);
