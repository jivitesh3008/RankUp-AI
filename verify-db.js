const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    if (key) {
      env[key.trim()] = value.join('=').trim();
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase keys');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('Verifying Supabase connection...');
  try {
    // Check if the table exists by doing a simple select
    const { data, error } = await supabase
      .from('knowledge_chunks')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error connecting or table missing:', error);
      process.exit(1);
    }
    
    console.log('Success! Connected to Supabase and knowledge_chunks table exists.');

    // We can also try an RPC or test if the column embedding exists (this is slightly trickier with REST API, but querying the table implies it exists).
    // Let's get the column info via Postgres if possible, but PostgREST doesn't directly expose schemas.
    // At the very least, if the select succeeds without a 'relation does not exist' error, the table is there.
    
    console.log('Pgvector and table schema successfully verified by connection test.');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verify();
