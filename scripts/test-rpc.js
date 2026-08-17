const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const spec = await res.json();
  console.log("RPCs:");
  console.log(Object.keys(spec.paths).filter(p => p.startsWith('/rpc/')));
}

run();
