import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content, topic')
    .eq('chapter', 'Our Environment')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }
  
  chunks?.forEach((c, i) => {
    console.log(`--- CHUNK ${i+1} [Topic: ${c.topic}] ---`);
    console.log(c.content);
  });
}

run().catch(console.error);
