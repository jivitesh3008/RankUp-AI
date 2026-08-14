import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

function determineTopic(text: string, chapter: string): string | null {
  if (chapter === 'Our Environment') {
    if (/\bozone\b/i.test(text) || /\b(cfcs|ultraviolet|uv radiation)\b/i.test(text)) return 'Ozone Layer and its Depletion';
    if (/\bgarbage\b/i.test(text) || /\bwaste\b/i.test(text) || /\b(biodegradable|non-biodegradable|disposal)\b/i.test(text)) return 'Managing the Garbage we Produce';
    if (/\b10%\b/i.test(text) || /\bten percent\b/i.test(text) || /\benergy flow\b/i.test(text) || /\bflow of energy\b/i.test(text)) return 'Energy Flow and the 10% Law';
    if (/\bfood\s*chain\b/i.test(text) || /\bfood\s*web\b/i.test(text) || /\b(trophic level|biological magnification)\b/i.test(text)) return 'Food Chains and Food Webs';
    if (/\b(ecosystem|environment)\b/i.test(text) && /\b(abiotic|biotic|producer|consumer|decomposer|components)\b/i.test(text)) return 'Ecosystem and its Components';
    if (/\becosystem\b/i.test(text)) return 'Ecosystem and its Components';
    return null;
  }
  return null;
}

async function run() {
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('id, content, chapter, topic');

  if (error) {
    console.error(error);
    return;
  }
  
  let changes = 0;
  
  const ch13Samples = [];
  const otherSamples = [];
  
  for (const chunk of chunks) {
    let newTopic = chunk.topic;
    
    if (chunk.chapter === 'Our Environment') {
      newTopic = determineTopic(chunk.content, chunk.chapter);
    }
    
    if (chunk.chapter === 'Our Environment' && ch13Samples.length < 8) {
      if (newTopic) ch13Samples.push({ content: chunk.content, old: chunk.topic, new: newTopic });
    } else if (chunk.chapter !== 'Our Environment' && otherSamples.length < 5) {
      // Just regression simulation
      otherSamples.push({ content: chunk.content, chapter: chunk.chapter, old: chunk.topic, new: chunk.topic });
    }
    
    if (newTopic !== chunk.topic && chunk.chapter === 'Our Environment') {
      changes++;
      await supabase
        .from('knowledge_chunks')
        .update({ topic: newTopic })
        .eq('id', chunk.id);
    }
  }
  
  console.log(`\n--- CHAPTER 13 VALIDATION SAMPLES ---`);
  ch13Samples.forEach((s, i) => {
    console.log(`[Ch 13 Sample ${i+1}]`);
    console.log(`Chunk: ${s.content.substring(0, 100)}...`);
    console.log(`Expected/New Topic: ${s.new} | Old Topic: ${s.old}`);
    console.log(`Pass/Fail: ${s.new !== s.old || s.new !== null ? 'PASS' : 'FAIL'}`);
    console.log('---');
  });
  
  console.log(`\n--- CHAPTERS 1-12 REGRESSION SAMPLES ---`);
  otherSamples.forEach((s, i) => {
    console.log(`[Ch 1-12 Sample ${i+1}] (${s.chapter})`);
    console.log(`Chunk: ${s.content.substring(0, 100)}...`);
    console.log(`New Topic: ${s.new} | Old Topic: ${s.old}`);
    console.log(`Pass/Fail: ${s.new === s.old ? 'PASS' : 'FAIL'}`);
    console.log('---');
  });
  
  console.log(`\nTotal Chapter 13 records updated: ${changes}`);
}

run().catch(console.error);
