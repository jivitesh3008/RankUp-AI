import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

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
    throw new Error(`Embedding API failed: ${response.status} ${err}`);
  }
  
  const data = await response.json();
  const embedding = data.embedding.values;
  
  if (!embedding || embedding.length !== 768) {
    throw new Error(`Invalid query embedding dimension! Expected 768, got ${embedding?.length}`);
  }
  
  return embedding;
}
