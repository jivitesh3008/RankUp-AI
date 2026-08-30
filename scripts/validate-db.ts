import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log("=== PHASE 2: DATABASE VERIFICATION ===");
  
  // 1. Math records
  const { data: mathData, error: mathError } = await supabase
    .from('knowledge_chunks')
    .select('id, class, subject, chapter, topic')
    .eq('subject', 'Mathematics');
    
  if (mathError) console.error(mathError);
  console.log(`Total Mathematics records: ${mathData?.length}`);
  
  // 2. Science records
  const { data: sciData, error: sciError } = await supabase
    .from('knowledge_chunks')
    .select('id, class, subject, chapter')
    .eq('subject', 'Science');
    
  if (sciError) console.error(sciError);
  console.log(`Total Science records: ${sciData?.length}`);
  
  // 3. Verify math records properties
  let invalidClass = 0;
  let uniqueChapters = new Set();
  
  mathData?.forEach(m => {
    if (m.class !== '10') invalidClass++;
    uniqueChapters.add(m.chapter);
  });
  
  console.log(`Math records with invalid class: ${invalidClass}`);
  console.log(`=== PHASE 3: EXACT CHAPTER LIST ===`);
  console.log(Array.from(uniqueChapters));

  // Count dimensions
  // Unfortunately we can't easily count vector dims without raw SQL, but we know it inserts successfully.
}
run().catch(console.error);
