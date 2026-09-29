import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('chapter_notes')
    .select('chapter, subject, title, overview')
    .eq('subject', 'Mathematics');

  if (error) {
    console.error(error);
  } else {
    console.log("Mathematics Chapters in DB:");
    data.forEach(row => {
      console.log(`- ${row.chapter}: ${row.title}`);
      if (row.overview && row.overview.includes('API free tier limit')) {
          console.log(`  MOCKED: ${row.chapter}`);
      }
    });
  }
}

check();
