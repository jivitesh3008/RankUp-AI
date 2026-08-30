import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  const { data } = await supabase
    .from('knowledge_chunks')
    .select('chapter, topic')
    .eq('subject', 'Mathematics');
    
  let topicsByChapter: Record<string, Set<string>> = {};
  data?.forEach(d => {
    if (!topicsByChapter[d.chapter]) topicsByChapter[d.chapter] = new Set();
    topicsByChapter[d.chapter].add(d.topic);
  });
  
  for (const [chapter, topics] of Object.entries(topicsByChapter)) {
    console.log(`\nChapter: ${chapter}`);
    console.log(`Topics: ${Array.from(topics).join(', ')}`);
  }
}

run().catch(console.error);
