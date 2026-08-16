async function testQuery(query) {
  console.log(`\\nTesting: "${query}"`);
  const payload = { messages: [{ role: 'user', content: query }] };
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    if (data.grounding && data.grounding.used) {
      console.log(`✓ GROUNDED in ${data.grounding.chapter}`);
    } else {
      console.log(`✗ NOT GROUNDED`);
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
}

async function run() {
  const queries = [
    "What is Ohm's law?",
    "How does a reflex arc work?",
    "What is heredity?",
    "What is the 10 percent law?"
  ];
  for (const q of queries) {
    await testQuery(q);
  }
}
run();
