const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const geminiKey = process.env.GEMINI_API_KEY;

async function main() {
  const text = "Core concepts, definitions, numericals, diagrams, and important scientific laws.";
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
  
  if (!response.ok) {
    const err = await response.text();
    console.error(`Embedding API failed: ${response.status} ${err}`);
    return;
  }
  
  const data = await response.json();
  const embedding = data.embedding.values;
  
  fs.writeFileSync('src/lib/static-test-embedding.json', JSON.stringify(embedding));
  console.log("Static embedding written to src/lib/static-test-embedding.json");
}

main().catch(console.error);
