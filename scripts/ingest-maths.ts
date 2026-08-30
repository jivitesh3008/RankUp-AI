import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
const MATHS_CHAPTERS = [
  'Real Numbers',
  'Polynomials',
  'Pair of Linear Equations in Two Variables',
  'Quadratic Equations',
  'Arithmetic Progressions',
  'Triangles',
  'Coordinate Geometry',
  'Introduction to Trigonometry',
  'Some Applications of Trigonometry',
  'Circles',
  'Areas Related to Circles',
  'Surface Areas and Volumes',
  'Statistics',
  'Probability'
];

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

const chapterIndexArg = process.argv.slice(2).find(arg => !arg.startsWith('--') && !isNaN(parseInt(arg)));
const chapterIndex = chapterIndexArg ? parseInt(chapterIndexArg, 10) : 1;
if (isNaN(chapterIndex) || chapterIndex < 1 || chapterIndex > 14) {
  console.error("Please provide a valid chapter number 1-14.");
  process.exit(1);
}

const chapterName = MATHS_CHAPTERS[chapterIndex - 1];
const pdfFileName = `jemh1${chapterIndex.toString().padStart(2, '0')}.pdf`;
const PDF_PATH = path.resolve(`data/ncert/class10/maths/${pdfFileName}`);

const METADATA = {
  class: '10',
  subject: 'Mathematics',
  chapter: chapterName,
  source: 'NCERT Class 10 Mathematics'
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
  
  if (ch === 'Real Numbers') {
    if (/\b(euclid|division algorithm)\b/i.test(text)) return 'Euclid\'s Division Lemma';
    if (/\b(fundamental theorem of arithmetic|prime factorisation|hcf|lcm)\b/i.test(text)) return 'The Fundamental Theorem of Arithmetic';
    if (/\b(irrational|rational|sqrt|proof by contradiction)\b/i.test(text)) return 'Revisiting Irrational Numbers';
    if (/\b(terminating|non-terminating|decimal expansion)\b/i.test(text)) return 'Revisiting Rational Numbers and Their Decimal Expansions';
  }
  if (ch === 'Polynomials') {
    if (/\b(geometrical meaning|zeroes of a polynomial|graph)\b/i.test(text)) return 'Geometrical Meaning of the Zeroes of a Polynomial';
    if (/\b(relationship between zeroes and coefficients|sum of zeroes|product of zeroes)\b/i.test(text)) return 'Relationship between Zeroes and Coefficients of a Polynomial';
    if (/\bdivision algorithm\b/i.test(text)) return 'Division Algorithm for Polynomials';
  }
  if (ch === 'Pair of Linear Equations in Two Variables') {
    if (/\b(graphical method|intersect|parallel|coincident)\b/i.test(text)) return 'Graphical Method of Solution';
    if (/\bsubstitution method\b/i.test(text)) return 'Algebraic Methods: Substitution Method';
    if (/\belimination method\b/i.test(text)) return 'Algebraic Methods: Elimination Method';
    if (/\bcross-multiplication\b/i.test(text)) return 'Algebraic Methods: Cross-Multiplication Method';
    if (/\bequations reducible\b/i.test(text)) return 'Equations Reducible to a Pair of Linear Equations';
  }
  if (ch === 'Quadratic Equations') {
    if (/\b(factorisation|splitting the middle term)\b/i.test(text)) return 'Solution of a Quadratic Equation by Factorisation';
    if (/\bcompleting the square\b/i.test(text)) return 'Solution of a Quadratic Equation by Completing the Square';
    if (/\b(quadratic formula|discriminant|nature of roots)\b/i.test(text)) return 'Nature of Roots';
  }
  if (ch === 'Arithmetic Progressions') {
    if (/\b(nth term|general term)\b/i.test(text)) return 'nth Term of an AP';
    if (/\b(sum of first n terms|sn)\b/i.test(text)) return 'Sum of First n Terms of an AP';
  }
  if (ch === 'Triangles') {
    if (/\b(similar figures|similarity of triangles)\b/i.test(text)) return 'Similarity of Triangles';
    if (/\b(criteria for similarity|aaa|sss|sas)\b/i.test(text)) return 'Criteria for Similarity of Triangles';
    if (/\b(areas of similar triangles|ratio of areas)\b/i.test(text)) return 'Areas of Similar Triangles';
    if (/\bpythagoras theorem\b/i.test(text)) return 'Pythagoras Theorem';
  }
  if (ch === 'Coordinate Geometry') {
    if (/\bdistance formula\b/i.test(text)) return 'Distance Formula';
    if (/\bsection formula\b/i.test(text)) return 'Section Formula';
    if (/\barea of a triangle\b/i.test(text)) return 'Area of a Triangle';
  }
  if (ch === 'Introduction to Trigonometry') {
    if (/\b(trigonometric ratios|sin|cos|tan|cosec|sec|cot)\b/i.test(text)) return 'Trigonometric Ratios';
    if (/\b(ratios of some specific angles|30|45|60|90)\b/i.test(text)) return 'Trigonometric Ratios of Some Specific Angles';
    if (/\b(complementary angles|90 - a)\b/i.test(text)) return 'Trigonometric Ratios of Complementary Angles';
    if (/\btrigonometric identities\b/i.test(text)) return 'Trigonometric Identities';
  }
  if (ch === 'Some Applications of Trigonometry') {
    if (/\b(heights and distances|angle of elevation|angle of depression)\b/i.test(text)) return 'Heights and Distances';
  }
  if (ch === 'Circles') {
    if (/\btangent to a circle\b/i.test(text)) return 'Tangent to a Circle';
    if (/\b(number of tangents|point on a circle)\b/i.test(text)) return 'Number of Tangents from a Point on a Circle';
  }
  if (ch === 'Areas Related to Circles') {
    if (/\b(perimeter and area|circumference)\b/i.test(text)) return 'Perimeter and Area of a Circle';
    if (/\b(areas of sector|segment)\b/i.test(text)) return 'Areas of Sector and Segment of a Circle';
    if (/\bareas of combinations of plane figures\b/i.test(text)) return 'Areas of Combinations of Plane Figures';
  }
  if (ch === 'Surface Areas and Volumes') {
    if (/\bsurface area of a combination of solids\b/i.test(text)) return 'Surface Area of a Combination of Solids';
    if (/\bvolume of a combination of solids\b/i.test(text)) return 'Volume of a Combination of Solids';
    if (/\bconversion of solid\b/i.test(text)) return 'Conversion of Solid from One Shape to Another';
    if (/\bfrustum of a cone\b/i.test(text)) return 'Frustum of a Cone';
  }
  if (ch === 'Statistics') {
    if (/\bmean of grouped data\b/i.test(text)) return 'Mean of Grouped Data';
    if (/\bmode of grouped data\b/i.test(text)) return 'Mode of Grouped Data';
    if (/\bmedian of grouped data\b/i.test(text)) return 'Median of Grouped Data';
    if (/\b(cumulative frequency distribution|ogive)\b/i.test(text)) return 'Graphical Representation of Cumulative Frequency Distribution';
  }
  if (ch === 'Probability') {
    if (/\b(probability|theoretical approach|equally likely|outcomes)\b/i.test(text)) return 'Probability - A Theoretical Approach';
  }

  return 'General Mathematics';
}

function chunkText(pages: {pageNumber: number, text: string}[]) {
  const chunks: {content: string, pageNumber: number, topic: string | null}[] = [];
  
  for (const page of pages) {
    let text = page.text;
    
    // Clean headers/footers carefully
    text = text.replace(/^\s*\d+\s*$/gm, '');
    text = text.replace(/^\s*MATHEMATICS\s*$/gmi, '');
    text = text.replace(/^\s*Rationalised\s*2023-24\s*$/gmi, '');
    text = text.replace(/^\s*Reprint\s*2026-27\s*$/gmi, '');
    
    // Remove multiple newlines but preserve line integrity for maths
    text = text.replace(/\n+/g, '\n');
    text = text.replace(/\s{2,}/g, ' ');
    
    // For Maths, we do NOT use the aggressive dictionary replacements from Science
    // that could corrupt variables (e.g. replacing "ature" with "nature" might break some variable names if matched weirdly,
    // though the regex used word boundaries. We'll just skip them for safety.)
    
    // Split into sentences or lines
    // Maths sentences might not end with standard punctuation due to formulas.
    // We split by standard punctuation but keep an eye on lines.
    const sentences = text.split(/(?<=[.!?])\s+|(?<=\n)/);
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
        const prevSentences = currentChunk.split(/(?<=[.!?])\s+|(?<=\n)/);
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
  console.log(`Starting Mathematics Ingestion for ${METADATA.chapter}... (Dry Run: ${isDryRun})`);
  
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found at ${PDF_PATH}`);
    process.exit(1);
  }
  
  const allPages = await extractPages(PDF_PATH);
  console.log(`Extracted ${allPages.length} total pages from PDF.`);
  
  const chapterPages = extractChapter(allPages);
  
  if (chapterPages.length === 0) {
    console.error(`Failed to reliably identify ${METADATA.chapter} boundaries. Stopping.`);
    process.exit(1);
  }
  
  const chunks = chunkText(chapterPages);
  console.log(`Created ${chunks.length} semantic chunks.`);
  
  if (!isDryRun) {
    console.log(`Cleaning up existing ${METADATA.chapter} records for safe re-ingestion...`);
    const { error: delError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('chapter', METADATA.chapter)
      .eq('class', METADATA.class)
      .eq('subject', METADATA.subject);
      
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
