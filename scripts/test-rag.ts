import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest(query: string, testName: string) {
  console.log(`\n==================================================`);
  console.log(`TEST: ${testName}`);
  console.log(`QUERY: "${query}"`);
  console.log(`==================================================\n`);

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }]
      })
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const err = await response.text();
      console.error(err);
      return;
    }

    const data = await response.json();
    const grounding = data.grounding;

    if (grounding && grounding.used) {
      console.log(`✅ NCERT Context Used: Yes`);
      console.log(`   Source: ${grounding.source}`);
      console.log(`   Chapter: ${grounding.chapter}`);
      console.log(`   Chunks Retrieved: ${grounding.chunks}`);
      console.log(`   Top Similarity Score: ${Math.max(...grounding.scores).toFixed(4)}`);
      console.log(`   Retrieved Topics: ${Array.from(new Set(grounding.topics)).join(', ')}`);
    } else {
      console.log(`❌ NCERT Context Used: No (Insufficient or unavailable context)`);
    }

    console.log(`\n🤖 GEMINI RESPONSE:\n`);
    console.log(data.response);
    
  } catch (err: any) {
    console.error('Test failed:', err.message);
  }
}

async function main() {
  const tests = [
    { name: 'TEST 1', query: 'What is a chemical reaction?' },
    { name: 'TEST 2', query: 'What are the observations that indicate a chemical reaction has taken place?' },
    { name: 'TEST 3', query: 'What happens when a magnesium ribbon is burned in air?' },
    { name: 'TEST 4', query: 'Explain combination reactions.' },
    { name: 'NEGATIVE TEST', query: 'Explain the structure of the human heart.' }
  ];

  for (const t of tests) {
    await runTest(t.query, t.name);
    // Pause briefly to avoid hitting rate limits too fast
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error);
