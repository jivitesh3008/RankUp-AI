import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function generateEmbedding(text: string) {
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
    throw new Error(`Embedding API failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.embedding.values;
}

const QUESTIONS = [
  // Test 1: Chapter Identification
  { q: "What happens when magnesium ribbon burns in air?", expectedChapter: "Chemical Reactions and Equations", category: "Targeted" },
  { q: "What are the signs of a chemical reaction?", expectedChapter: "Chemical Reactions and Equations", category: "Targeted" },
  { q: "What is a decomposition reaction?", expectedChapter: "Chemical Reactions and Equations", category: "Targeted" },
  
  { q: "What is the difference between acids and bases?", expectedChapter: "Acids, Bases and Salts", category: "Targeted" },
  { q: "What happens when an acid reacts with a metal?", expectedChapter: "Acids, Bases and Salts", category: "Targeted" },
  { q: "What is the pH scale?", expectedChapter: "Acids, Bases and Salts", category: "Targeted" },
  
  { q: "What is an alloy?", expectedChapter: "Metals and Non-metals", category: "Targeted" },
  { q: "How are metals extracted from ores?", expectedChapter: "Metals and Non-metals", category: "Targeted" },
  { q: "What is corrosion?", expectedChapter: "Metals and Non-metals", category: "Targeted" }, // Corrosion is also in Ch1, but expected any valid
  
  { q: "What is a homologous series?", expectedChapter: "Carbon and its Compounds", category: "Targeted" },
  { q: "What is the functional group of alcohols?", expectedChapter: "Carbon and its Compounds", category: "Targeted" },
  { q: "Why does carbon form so many compounds?", expectedChapter: "Carbon and its Compounds", category: "Targeted" },
  
  { q: "What is the function of the human heart?", expectedChapter: "Life Processes", category: "Targeted" },
  { q: "What is the role of bile in digestion?", expectedChapter: "Life Processes", category: "Targeted" },
  { q: "How does respiration occur?", expectedChapter: "Life Processes", category: "Targeted" },

  // Test 2: Cross-Chapter Confusion
  { q: "What is oxidation?", expectedChapter: "ANY_VALID", validChapters: ["Chemical Reactions and Equations", "Metals and Non-metals", "Carbon and its Compounds"], category: "Confusion" },
  { q: "What is transportation?", expectedChapter: "Life Processes", category: "Confusion" },
  { q: "What happens during a reaction?", expectedChapter: "ANY_VALID", validChapters: ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds"], category: "Confusion" },
  { q: "What is energy needed for life?", expectedChapter: "Life Processes", category: "Confusion" },

  // Test 3: Out-of-Dataset
  { q: "Explain the human eye.", expectedChapter: "NONE", category: "OOD" },
  { q: "What is Fleming's left hand rule?", expectedChapter: "NONE", category: "OOD" },
  { q: "Explain heredity.", expectedChapter: "NONE", category: "OOD" },
  { q: "What is a magnetic field?", expectedChapter: "NONE", category: "OOD" },
  { q: "Explain reproduction in humans.", expectedChapter: "NONE", category: "OOD" }
];

async function run() {
  console.log("Starting Cross-Chapter RAG Evaluation...\n");
  
  let total = 0;
  let correctChapters = 0;
  let incorrectChapters = 0;
  let oodRejected = 0;
  let oodFailedToReject = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  let lowestSuccess = 1.0;
  let highestIncorrect = 0.0;
  
  for (const item of QUESTIONS) {
    try {
      const embedding = await generateEmbedding(item.q);
      
      const chapters = [
        "Chemical Reactions and Equations",
        "Acids, Bases and Salts",
        "Metals and Non-metals",
        "Carbon and its Compounds",
        "Life Processes"
      ];
      
      let allChunks: any[] = [];
      
      for (const chapter of chapters) {
        const { data: chunks, error } = await supabase.rpc('match_knowledge_chunks', {
          query_embedding: embedding,
          match_threshold: 0.65,
          match_count: 5,
          p_class: '10',
          p_subject: 'Science',
          p_chapter: chapter
        });

        if (error) throw error;
        
        if (chunks && chunks.length > 0) {
          // add the chapter to each chunk for identification
          const chunksWithChapter = chunks.map((c: any) => ({...c, chapter}));
          allChunks = allChunks.concat(chunksWithChapter);
        }
      }
      
      // Sort combined chunks by similarity descending and take top 5
      allChunks.sort((a, b) => b.similarity - a.similarity);
      const topChunks = allChunks.slice(0, 5);
      
      const chunksCount = topChunks.length;
      let topScore = chunksCount > 0 ? topChunks[0].similarity : null;
      let secondScore = chunksCount > 1 ? topChunks[1].similarity : null;
      let margin = (topScore !== null && secondScore !== null) ? (topScore - secondScore) : null;
      
      let isRelevant = chunksCount > 0;
      let rejectReason = "";

      if (isRelevant && topScore !== null && topScore < 0.68) {
        const top2Topics = topChunks.slice(0, 2).map((c: any) => c.topic);
        const hasTopicConsistency = top2Topics.length === 2 && top2Topics[0] === top2Topics[1];
        if (!hasTopicConsistency && chunksCount < 2) {
           isRelevant = false;
           rejectReason = " (Borderline score + low topic consistency)";
        }
      }

      const ragAccepted = isRelevant;
      const topChapter = ragAccepted && chunksCount > 0 ? topChunks[0].chapter : "NONE";
      const topTopic = ragAccepted && chunksCount > 0 ? topChunks[0].topic : "NONE";
      const retrievedTopics = ragAccepted && chunksCount > 0 ? topChunks.map((c: any) => c.topic).join(", ") : "NONE";

      let resultCorrect = false;

      if (item.category === "OOD") {
        if (!ragAccepted) {
          oodRejected++;
          resultCorrect = true;
        } else {
          oodFailedToReject++;
          falsePositives++;
          if (topScore && topScore > highestIncorrect) highestIncorrect = topScore;
        }
      } else {
        if (!ragAccepted) {
          falseNegatives++;
        } else {
          if (item.expectedChapter === "ANY_VALID") {
             if (item.validChapters?.includes(topChapter)) {
               resultCorrect = true;
               correctChapters++;
             } else {
               incorrectChapters++;
             }
          } else {
             if (topChapter === item.expectedChapter) {
               resultCorrect = true;
               correctChapters++;
             } else {
               incorrectChapters++;
             }
          }
        }
      }

      if (resultCorrect && ragAccepted && topScore && topScore < lowestSuccess) {
         lowestSuccess = topScore;
      }

      console.log(`\nQ: ${item.q}`);
      console.log(`- Expected Chapter: ${item.expectedChapter}`);
      console.log(`- Top Retrieved Chapter: ${topChapter}`);
      console.log(`- Top Similarity Score: ${topScore ? topScore.toFixed(4) : "N/A"}`);
      console.log(`- Second-best Score: ${secondScore ? secondScore.toFixed(4) : "N/A"}`);
      console.log(`- Margin: ${margin ? margin.toFixed(4) : "N/A"}`);
      console.log(`- Retrieved Chunks: ${chunksCount}`);
      console.log(`- Retrieved Topics: ${retrievedTopics}`);
      console.log(`- Result Correct: ${resultCorrect}`);
      
      // Delay to avoid rate limit
      await new Promise(r => setTimeout(r, 700));

    } catch (err: any) {
      console.error(`Error on question "${item.q}": ${err.message}`);
    }
    total++;
  }

  const oodTotal = QUESTIONS.filter(q => q.category === "OOD").length;
  const targetTotal = QUESTIONS.filter(q => q.category !== "OOD").length;

  console.log(`\n==================================================`);
  console.log(`FINAL REPORT`);
  console.log(`==================================================`);
  console.log(`1. Total questions: ${total}`);
  console.log(`2. Correct chapter retrievals: ${correctChapters}`);
  console.log(`3. Incorrect chapter retrievals: ${incorrectChapters}`);
  console.log(`4. Chapter accuracy: ${((correctChapters / targetTotal) * 100).toFixed(2)}%`);
  console.log(`5. Out-of-dataset rejection rate: ${((oodRejected / oodTotal) * 100).toFixed(2)}%`);
  console.log(`6. False positives (OOD accepted): ${falsePositives}`);
  console.log(`7. False negatives (In-dataset rejected): ${falseNegatives}`);
  console.log(`8. Lowest successful similarity: ${lowestSuccess === 1.0 ? "N/A" : lowestSuccess.toFixed(4)}`);
  console.log(`9. Highest incorrect similarity: ${highestIncorrect === 0.0 ? "N/A" : highestIncorrect.toFixed(4)}`);
}

run().catch(console.error);
