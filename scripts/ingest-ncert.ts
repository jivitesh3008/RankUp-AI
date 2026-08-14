import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const isDryRun = process.argv.includes('--dry-run');
const PDF_PATH = path.resolve('data/ncert/class10/science/chapter-13.pdf');

const METADATA = {
  class: '10',
  subject: 'Science',
  chapter: 'Our Environment',
  source: 'NCERT Class 10 Science'
};

async function extractPages(pdfPath: string): Promise<{pageNumber: number, text: string}[]> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const pages: {pageNumber: number, text: string}[] = [];
  
  await pdfParse(dataBuffer, {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          text: text
        });
        return text;
      });
    }
  });
  
  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

function extractChapter(pages: {pageNumber: number, text: string}[]) {
  return pages.filter(p => p.text.trim().length > 0);
}

function determineTopic(text: string, chapter?: string): string | null {
  const ch = chapter || METADATA.chapter;
  
  if (ch === 'Chemical Reactions and Equations') {
    if (/\bdecomposition\b/i.test(text)) return 'Decomposition reactions';
    if (/\bcombination\b/i.test(text)) return 'Combination reactions';
    if (/\b(oxidation|reduction)\b/i.test(text)) return 'Oxidation and reduction';
    if (/\bcorrosion\b/i.test(text)) return 'Corrosion';
    if (/\brancidity\b/i.test(text)) return 'Rancidity';
    if (/\bdisplacement\b/i.test(text)) return 'Displacement reactions';
    if (/\bchemical reaction\b/i.test(text)) return 'Chemical reactions';
  }
  
  if (ch === 'Acids, Bases and Salts') {
    if (/\bph scale\b/i.test(text) || /\bhydrogen ion concentration\b/i.test(text)) return 'pH Scale';
    if (/\bbaking soda\b/i.test(text)) return 'Baking Soda';
    if (/\bindicator\b/i.test(text)) return 'Indicators';
    if (/\bsalt\b/i.test(text)) return 'Salts';
    if (/\bacid\b/i.test(text) || /\bbase\b/i.test(text)) return 'Acids and Bases';
  }
  
  if (ch === 'Metals and Non-metals') {
    if (/\bmetallurgy\b/i.test(text) || /\bextraction\b/i.test(text) || /\bore\b/i.test(text)) return 'Metallurgy';
    if (/\bcorrosion\b/i.test(text)) return 'Corrosion';
    if (/\breactivity series\b/i.test(text)) return 'Reactivity Series';
    if (/\bmetal\b/i.test(text) || /\bnon-metal\b/i.test(text)) return 'Metals and Non-metals';
  }
  
  if (ch === 'Carbon and its Compounds') {
    if (/\bhomologous series\b/i.test(text)) return 'Homologous Series';
    if (/\bcovalent bond\b/i.test(text)) return 'Covalent Bonds';
    if (/\b(ethanol|ethanoic acid)\b/i.test(text)) return 'Important Carbon Compounds';
    if (/\bcarbon\b/i.test(text) || /\bcompound\b/i.test(text)) return 'Carbon Compounds';
  }
  
  if (ch === 'Life Processes') {
    if (/\b(respiration|respire)\b/i.test(text)) return 'Respiration';
    if (/\b(nutrition|digest)\b/i.test(text)) return 'Nutrition';
    if (/\b(transportation|heart|blood)\b/i.test(text)) return 'Transportation';
    if (/\b(excretion|kidney)\b/i.test(text)) return 'Excretion';
    if (/\blife process\b/i.test(text)) return 'Life Processes';
  }
  
  if (ch === 'Control and Coordination') {
    if (/\breflex action\b/i.test(text)) return 'Reflex Action';
    if (/\bhuman brain\b/i.test(text)) return 'Human Brain';
    if (/\b(nervous system|neuron)\b/i.test(text)) return 'Nervous System';
    if (/\b(endocrine|hormone)\b/i.test(text)) return 'Endocrine System';
    if (/\bcoordination in plants\b/i.test(text) || /\b(tropic|nastic|phytohormone)\b/i.test(text)) return 'Coordination in Plants';
    if (/\bcontrol and coordination\b/i.test(text)) return 'Control and Coordination';
  }
  
  if (ch === 'How do Organisms Reproduce?') {
    if (/\b(reproductive health|contraception|std)\b/i.test(text)) return 'Reproductive Health';
    if (/\b(human|male|female|puberty)\b/i.test(text)) return 'Reproduction in Human Beings';
    if (/\b(flower|seed|pollination)\b/i.test(text)) return 'Sexual Reproduction in Flowering Plants';
    if (/\b(fission|fragmentation|regeneration|budding|vegetative|asexual)\b/i.test(text)) return 'Asexual Reproduction';
    if (/\breproduce\b/i.test(text) || /\breproduction\b/i.test(text)) return 'Reproduction';
  }
  
  if (ch === 'Heredity') {
    if (/\b(speciation|fossil)\b/i.test(text)) return 'Evolution';
    if (/\b(evolution|darwin)\b/i.test(text)) return 'Evolution';
    if (/\bsex determination\b/i.test(text)) return 'Sex Determination';
    if (/\b(mendel|trait|inherit|inheritance)\b/i.test(text)) return 'Heredity';
    if (/\bheredity\b/i.test(text)) return 'Heredity';
  }
  
  if (ch === 'Light - Reflection and Refraction') {
    if (/\b(refraction|refractive index|snell)\b/i.test(text)) return 'Refraction';
    if (/\b(lens|magnification|power of a lens)\b/i.test(text)) return 'Lenses';
    if (/\b(mirror|reflection)\b/i.test(text)) return 'Reflection';
    if (/\blight\b/i.test(text)) return 'Light';
  }
  
  if (ch === 'The Human Eye and the Colourful World') {
    if (/\b(myopia|hypermetropia|presbyopia|cataract|defect|vision)\b/i.test(text)) return 'Defects of Vision';
    if (/\b(human eye|accommodation|cornea|retina|ciliary)\b/i.test(text)) return 'The Human Eye';
    if (/\b(prism|dispersion|rainbow|scattering|blue sky)\b/i.test(text)) return 'The Colourful World';
  }
  
  if (ch === 'Electricity') {
    if (/\bcommercial unit\b/i.test(text) || /\bkilowatt-hour\b/i.test(text) || /\bkwh\b/i.test(text)) return 'Commercial Unit of Electrical Energy';
    if (/joule['’]s law\b/i.test(text)) return "Joule's Law of Heating";
    if (/\bheating effect\b/i.test(text) || (/\bheat\b/i.test(text) && /\b(resistor|current)\b/i.test(text) && !/\bjoule\b/i.test(text))) return 'Heating Effect of Electric Current';
    if (/\b(series|parallel)\b/i.test(text) && /\b(resistor|resistance|combination)\b/i.test(text)) return 'Series and Parallel Combination of Resistors';
    if (/\belectric power\b/i.test(text) || (/\bpower\b/i.test(text) && /\bwatt\b/i.test(text))) return 'Electric Power';
    if ((/\bfactors\b/i.test(text) && /\bresistance\b/i.test(text)) || /\b(resistivity|area of cross-section)\b/i.test(text)) return 'Factors Affecting Resistance';
    if (/ohm['’]s law\b/i.test(text) || (/\bohm\b/i.test(text) && /\b(proportional|v\\s*=\\s*ir)\b/i.test(text))) return "Ohm's Law";
    if (/\b(potential difference|electric potential|volt|voltage)\b/i.test(text)) return 'Electric Potential and Potential Difference';
    if (/\belectric current\b/i.test(text) || (/\bcurrent\b/i.test(text) && /\b(ampere|flow of charge)\b/i.test(text))) return 'Electric Current';
    if (/\belectric energy\b/i.test(text) || (/\benergy\b/i.test(text) && /\b(joule|consume)\b/i.test(text))) return 'Electric Energy';
    if (/\bresistance\b/i.test(text) || /\bresistor\b/i.test(text)) return 'Resistance';
  }
  
  if (ch === 'Magnetic Effects of Electric Current') {
    if (/\bdomestic\b/i.test(text) && /\b(circuit|wiring|earth wire|fuse|short circuit|overloading)\b/i.test(text)) return 'Domestic Electric Circuits';
    if (/\bfleming['’]s right\b/i.test(text) || /\bgenerator\b/i.test(text)) return 'Electric Generator';
    if (/\belectromagnetic induction\b/i.test(text) || (/\binduced current\b/i.test(text) && /\b(coil|magnet|galvanometer)\b/i.test(text))) return 'Electromagnetic Induction';
    if (/\bfleming['’]s left\b/i.test(text) || /\bmotor\b/i.test(text)) return 'Electric Motor';
    if (/\bforce\b/i.test(text) && /\b(current-carrying|conductor|magnetic field)\b/i.test(text)) return 'Force on a Current-Carrying Conductor in a Magnetic Field';
    if (/\bsolenoid\b/i.test(text)) return 'Magnetic Field due to a Current in a Solenoid';
    if (/\bcircular loop\b/i.test(text) || /\bcoil\b/i.test(text)) return 'Magnetic Field due to a Current through a Circular Loop';
    if (/\bstraight conductor\b/i.test(text) || /\bstraight wire\b/i.test(text) || /\bright-hand thumb rule\b/i.test(text)) return 'Magnetic Field due to a Current through a Straight Conductor';
    if (/\bmagnetic field\b/i.test(text) || /\bfield lines\b/i.test(text) || /\bcompass needle\b/i.test(text)) return 'Magnetic Field and Field Lines';
  }
  
  if (ch === 'Our Environment') {
    if (/\bozone\b/i.test(text) || /\b(cfcs|ultraviolet|uv radiation)\b/i.test(text)) return 'Ozone Layer and its Depletion';
    if (/\bgarbage\b/i.test(text) || /\bwaste\b/i.test(text) || /\b(biodegradable|non-biodegradable|disposal)\b/i.test(text)) return 'Managing the Garbage we Produce';
    if (/\bfood\s*chain\b/i.test(text) || /\bfood\s*web\b/i.test(text) || /\b(trophic level|10%\s*law|ten percent|biological magnification)\b/i.test(text)) return 'Food Chains and Webs';
    if (/\b(ecosystem|environment)\b/i.test(text) && /\b(abiotic|biotic|producer|consumer|decomposer|components)\b/i.test(text)) return 'Ecosystem and its Components';
    if (/\becosystem\b/i.test(text)) return 'Ecosystem and its Components';
  }

  return null;
}

function chunkText(pages: {pageNumber: number, text: string}[]) {
  const chunks: {content: string, pageNumber: number, topic: string | null}[] = [];
  
  for (const page of pages) {
    let text = page.text;
    
    // Clean headers/footers
    text = text.replace(/^\s*\d+\s*$/gm, '');
    text = text.replace(/^\s*Science\s*$/gmi, '');
    text = text.replace(/^\s*Rationalised\s*2023-24\s*$/gmi, '');
    
    // Remove multiple newlines and fix broken lines
    text = text.replace(/([^\.\?\!\:;])\n+/g, '$1 ');
    text = text.replace(/\n+/g, ' ');
    text = text.replace(/\s{2,}/g, ' ');
    
    // Controlled Dictionary Corrections for PDF Bullet / Parsing artifacts
    const dictionary: Record<string, string> = {
      'nmilk': 'milk',
      'nan iron': 'an iron',
      'ngrapes': 'grapes',
      'nfood': 'food',
      'nwe respire': 'we respire',
      'ature': 'nature',
      'eeds': 'needs',
      'ot science': 'not science',
      'ot literature': 'not literature',
      'C onsider': 'Consider',
      'nClean': 'Clean',
      'nHold': 'Hold',
      'nWhat': 'What',
      'nchange': 'change',
      'nevolution': 'evolution'
    };
    
    for (const [bad, good] of Object.entries(dictionary)) {
      // Use word boundaries for safe replacement, but accommodate "nmilk" which might be matched fully
      // We can use a simple replace for specific bullet anomalies if they are exact words
      const regex = new RegExp(`\b${bad}\b`, 'g');
      text = text.replace(regex, good);
    }
    
    // Also handle exact string matches where word boundary might fail due to punctuation
    text = text.replace(/nmilk/g, 'milk');
    text = text.replace(/nan iron/g, 'an iron');
    text = text.replace(/ngrapes/g, 'grapes');
    text = text.replace(/nfood/g, 'food');
    text = text.replace(/nwe respire/g, 'we respire');
    text = text.replace(/nClean/g, 'Clean');
    text = text.replace(/nHold/g, 'Hold');
    text = text.replace(/nWhat/g, 'What');
    text = text.replace(/nchange/g, 'change');
    text = text.replace(/nevolution/g, 'evolution');
    
    // Restore word boundaries for typical misspellings
    text = text.replace(/\bature\b/g, 'nature');
    text = text.replace(/\beeds\b/g, 'needs');
    text = text.replace(/\bot science\b/g, 'not science');
    text = text.replace(/\bot literature\b/g, 'not literature');
    text = text.replace(/\bC onsider\b/g, 'Consider');
    
    // Fix PDF artifact decimals and duplicate labels
    text = text.replace(/(\d+)\.\s+(\d+)/g, '$1.$2'); // Fix "1. 1" -> "1.1"
    text = text.replace(/(Activity\s*\d+\.\d+)(?:\s*\1)+/gi, '$1'); // Fix "Activity 1.1Activity 1.1"
    text = text.replace(/(Figure\s*\d+\.\d+)(?:\s*\1)+/gi, '$1'); // Fix "Figure 1.1Figure 1.1"
    
    const sentences = text.match(/(?:[^.!?]|(?<=\d)\.(?=\d)|(?<=Fig)\.)+[.!?]+/gi) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (!cleanSentence) continue;
      
      if (currentChunk.length + cleanSentence.length > 800) {
        if (currentChunk.trim().length > 50) {
           const finalContent = currentChunk.trim();
           chunks.push({ content: finalContent, pageNumber: page.pageNumber, topic: determineTopic(finalContent) });
        }
        
        // Semantic overlap
        const prevSentences = currentChunk.match(/(?:[^.!?]|(?<=\d)\.(?=\d)|(?<=Fig)\.)+[.!?]+/gi) || [];
        const overlap = prevSentences.length > 0 ? prevSentences[prevSentences.length - 1].trim() + ' ' : '';
        currentChunk = overlap + cleanSentence + ' ';
      } else {
        currentChunk += cleanSentence + ' ';
      }
    }
    
    if (currentChunk.trim().length > 50) {
      const finalContent = currentChunk.trim();
      chunks.push({ content: finalContent, pageNumber: page.pageNumber, topic: determineTopic(finalContent) });
    }
  }
  
  return chunks;
}

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
    const err = await response.text();
    throw new Error(`Embedding API failed: ${response.status} ${err}`);
  }
  
  const data = await response.json();
  return data.embedding.values;
}

async function isDuplicate(content: string) {
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id')
    .eq('content', content)
    .eq('chapter', METADATA.chapter)
    .limit(1);
    
  if (error) throw error;
  return data && data.length > 0;
}

async function main() {
  console.log(`Starting NCERT Ingestion... (Dry Run: ${isDryRun})`);
  
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found at ${PDF_PATH}`);
    process.exit(1);
  }
  
  const allPages = await extractPages(PDF_PATH);
  console.log(`Extracted ${allPages.length} total pages from PDF.`);
  
  const chapterPages = extractChapter(allPages);
  console.log(`Extracted ${chapterPages.length} pages for ${METADATA.chapter}.`);
  
  if (chapterPages.length === 0) {
    console.error(`Failed to reliably identify ${METADATA.chapter} boundaries. Stopping.`);
    process.exit(1);
  }
  
  const chunks = chunkText(chapterPages);
  console.log(`Created ${chunks.length} semantic chunks.`);
  
  if (!isDryRun) {
    console.log("Cleaning up existing Chapter 1 records for safe re-ingestion...");
    const { error: delError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('chapter', METADATA.chapter)
      .eq('class', METADATA.class);
      
    if (delError) {
      console.error("Failed to delete old chunks:", delError);
      process.exit(1);
    }
    console.log("Successfully cleared previous chunks.");
  }
  
  let duplicates = 0;
  let inserted = 0;
  let failures = 0;
  
  const limit = isDryRun ? Math.min(3, chunks.length) : chunks.length;
  
  for (let i = 0; i < limit; i++) {
    const chunk = chunks[i];
    try {
      if (!isDryRun) {
        const dup = await isDuplicate(chunk.content);
        if (dup) {
          duplicates++;
          continue;
        }
      }
      
      const embedding = await generateEmbedding(chunk.content);
      
      if (!embedding || embedding.length !== 768) {
        throw new Error(`Invalid embedding dimension! Expected 768, got ${embedding?.length}`);
      }
      
      if (isDryRun) {
        console.log(`\n--- DRY RUN CHUNK ${i+1} ---`);
        console.log(`Page: ${chunk.pageNumber}`);
        console.log(`Topic: ${chunk.topic || 'None'}`);
        console.log(`Content: ${chunk.content.substring(0, 200)}...`);
        console.log(`Embedding Dimensions: ${embedding.length}`);
      } else {
        const { error } = await supabase.from('knowledge_chunks').insert({
          content: chunk.content,
          embedding: embedding,
          class: METADATA.class,
          subject: METADATA.subject,
          chapter: METADATA.chapter,
          topic: chunk.topic,
          source: METADATA.source,
          page_number: chunk.pageNumber
        });
        
        if (error) throw error;
        inserted++;
      }
      
      // Gentle rate limit for Gemini API
      await new Promise(r => setTimeout(r, 600));
      
    } catch (err: any) {
      console.error(`Error processing chunk on page ${chunk.pageNumber}:`, err.message);
      failures++;
    }
  }
  
  console.log('\n--- SUMMARY ---');
  console.log(`Total Pages: ${allPages.length}`);
  console.log(`Chapter Pages: ${chapterPages.length}`);
  console.log(`Total Chunks: ${chunks.length}`);
  if (!isDryRun) {
    console.log(`Inserted: ${inserted}`);
    console.log(`Duplicates Skipped: ${duplicates}`);
    console.log(`Failures: ${failures}`);
  }
}

main().catch(console.error);
