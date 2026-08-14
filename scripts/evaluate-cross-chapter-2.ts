import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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
  // Test 1: Previous False Positive
  { q: "Explain reproduction in humans.", expectedChapter: "How do Organisms Reproduce?", category: "Special" },

  // Test 2: Targeted (In-domain)
  { q: "What happens when magnesium ribbon burns in air?", expectedChapter: "Chemical Reactions and Equations", category: "Targeted" },
  { q: "What are the signs of a chemical reaction?", expectedChapter: "Chemical Reactions and Equations", category: "Targeted" },
  { q: "What is a decomposition reaction?", expectedChapter: "Chemical Reactions and Equations", category: "Targeted" },
  
  { q: "What is the difference between acids and bases?", expectedChapter: "Acids, Bases and Salts", category: "Targeted" },
  { q: "What happens when an acid reacts with a metal?", expectedChapter: "Acids, Bases and Salts", category: "Targeted" },
  { q: "What is the pH scale?", expectedChapter: "Acids, Bases and Salts", category: "Targeted" },
  
  { q: "What is an alloy?", expectedChapter: "Metals and Non-metals", category: "Targeted" },
  { q: "How are metals extracted from ores?", expectedChapter: "Metals and Non-metals", category: "Targeted" },
  { q: "What is corrosion?", expectedChapter: "ANY_VALID", validChapters: ["Metals and Non-metals", "Chemical Reactions and Equations"], category: "Targeted" },
  
  { q: "What is a homologous series?", expectedChapter: "Carbon and its Compounds", category: "Targeted" },
  { q: "What is the functional group of alcohols?", expectedChapter: "Carbon and its Compounds", category: "Targeted" },
  { q: "Why does carbon form so many compounds?", expectedChapter: "Carbon and its Compounds", category: "Targeted" },
  
  { q: "What is the function of the human heart?", expectedChapter: "Life Processes", category: "Targeted" },
  { q: "What is the role of bile in digestion?", expectedChapter: "Life Processes", category: "Targeted" },
  { q: "How does respiration occur?", expectedChapter: "Life Processes", category: "Targeted" },

  { q: "How does a reflex arc work?", expectedChapter: "Control and Coordination", category: "Targeted" },
  { q: "What are the main parts of the human brain?", expectedChapter: "Control and Coordination", category: "Targeted" },
  { q: "How do plants respond to stimuli?", expectedChapter: "Control and Coordination", category: "Targeted" },

  { q: "How does binary fission occur in Amoeba?", expectedChapter: "How do Organisms Reproduce?", category: "Targeted" },
  { q: "What are the changes seen in girls during puberty?", expectedChapter: "How do Organisms Reproduce?", category: "Targeted" },
  { q: "What is vegetative propagation?", expectedChapter: "How do Organisms Reproduce?", category: "Targeted" },

  // Test 3: Cross-Chapter Confusion
  { q: "What is reproduction?", expectedChapter: "How do Organisms Reproduce?", category: "Confusion" },
  { q: "What is transportation?", expectedChapter: "Life Processes", category: "Confusion" },
  { q: "What is oxidation?", expectedChapter: "ANY_VALID", validChapters: ["Chemical Reactions and Equations", "Metals and Non-metals", "Carbon and its Compounds"], category: "Confusion" },
  { q: "What is coordination?", expectedChapter: "Control and Coordination", category: "Confusion" },
  { q: "How does the body respond to changes?", expectedChapter: "Control and Coordination", category: "Confusion" },
  { q: "How does an organism obtain energy?", expectedChapter: "Life Processes", category: "Confusion" },
  { q: "Why do organisms need energy?", expectedChapter: "Life Processes", category: "Confusion" },

  // Test 4: Out-of-Dataset
  { q: "What is the human eye?", expectedChapter: "NONE", category: "OOD" },
  { q: "Explain heredity.", expectedChapter: "NONE", category: "OOD" },
  { q: "What is a magnetic field?", expectedChapter: "NONE", category: "OOD" },
  { q: "Explain electricity.", expectedChapter: "NONE", category: "OOD" },
  { q: "What is conservation of energy?", expectedChapter: "NONE", category: "OOD" }
];

const ALL_CHAPTERS = [
  "Chemical Reactions and Equations",
  "Acids, Bases and Salts",
  "Metals and Non-metals",
  "Carbon and its Compounds",
  "Life Processes",
  "Control and Coordination",
  "How do Organisms Reproduce?"
];

async function run() {
  console.log("Starting Second Cross-Chapter RAG Evaluation...\n");
  
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
      
      let allChunks: any[] = [];
      
      for (const chapter of ALL_CHAPTERS) {
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
      
      // Special diagnostic for the reproduction question
      if (item.q === "Explain reproduction in humans.") {
          console.log(`\n--- DIAGNOSTIC: Explain reproduction in humans ---`);
          const lifeProcessesChunks = allChunks.filter(c => c.chapter === "Life Processes");
          const howDoOrganismsReproduceChunks = allChunks.filter(c => c.chapter === "How do Organisms Reproduce?");
          const lpTop = lifeProcessesChunks.length > 0 ? lifeProcessesChunks[0].similarity : 0;
          const repTop = howDoOrganismsReproduceChunks.length > 0 ? howDoOrganismsReproduceChunks[0].similarity : 0;
          
          console.log(`Life Processes max similarity: ${lpTop.toFixed(4)}`);
          console.log(`How do Organisms Reproduce? max similarity: ${repTop.toFixed(4)}`);
          console.log(`Margin: ${(repTop - lpTop).toFixed(4)}`);
      }
      
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
  console.log(`1. Total questions tested: ${total}`);
  console.log(`2. In-domain questions: ${targetTotal}`);
  console.log(`3. Correct in-domain retrievals: ${correctChapters}`);
  console.log(`4. Incorrect in-domain retrievals: ${incorrectChapters}`);
  console.log(`5. In-domain accuracy: ${((correctChapters / targetTotal) * 100).toFixed(2)}%`);
  console.log(`6. False negatives (In-domain rejected): ${falseNegatives}`);
  console.log(`7. OOD questions: ${oodTotal}`);
  console.log(`8. OOD rejection rate: ${((oodRejected / oodTotal) * 100).toFixed(2)}%`);
  console.log(`9. False positives (OOD accepted): ${falsePositives}`);
  console.log(`12. Lowest correct similarity: ${lowestSuccess === 1.0 ? "N/A" : lowestSuccess.toFixed(4)}`);
  console.log(`13. Highest incorrect similarity: ${highestIncorrect === 0.0 ? "N/A" : highestIncorrect.toFixed(4)}`);
}

run().catch(console.error);
