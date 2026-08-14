import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

function determineTopic(text: string, chapter: string): string | null {
  if (chapter === 'Chemical Reactions and Equations') {
    if (/\bdecomposition\b/i.test(text)) return 'Decomposition reactions';
    if (/\bcombination\b/i.test(text)) return 'Combination reactions';
    if (/\b(oxidation|reduction)\b/i.test(text)) return 'Oxidation and reduction';
    if (/\bcorrosion\b/i.test(text)) return 'Corrosion';
    if (/\brancidity\b/i.test(text)) return 'Rancidity';
    if (/\bdisplacement\b/i.test(text)) return 'Displacement reactions';
    if (/\bchemical reaction\b/i.test(text)) return 'Chemical reactions';
  }
  
  if (chapter === 'Acids, Bases and Salts') {
    if (/\bph scale\b/i.test(text) || /\bhydrogen ion concentration\b/i.test(text)) return 'pH Scale';
    if (/\bbaking soda\b/i.test(text)) return 'Baking Soda';
    if (/\bindicator\b/i.test(text)) return 'Indicators';
    if (/\bsalt\b/i.test(text)) return 'Salts';
    if (/\bacid\b/i.test(text) || /\bbase\b/i.test(text)) return 'Acids and Bases';
  }
  
  if (chapter === 'Metals and Non-metals') {
    if (/\bmetallurgy\b/i.test(text) || /\bextraction\b/i.test(text) || /\bore\b/i.test(text)) return 'Metallurgy';
    if (/\bcorrosion\b/i.test(text)) return 'Corrosion';
    if (/\breactivity series\b/i.test(text)) return 'Reactivity Series';
    if (/\bmetal\b/i.test(text) || /\bnon-metal\b/i.test(text)) return 'Metals and Non-metals';
  }
  
  if (chapter === 'Carbon and its Compounds') {
    if (/\bhomologous series\b/i.test(text)) return 'Homologous Series';
    if (/\bcovalent bond\b/i.test(text)) return 'Covalent Bonds';
    if (/\b(ethanol|ethanoic acid)\b/i.test(text)) return 'Important Carbon Compounds';
    if (/\bcarbon\b/i.test(text) || /\bcompound\b/i.test(text)) return 'Carbon Compounds';
  }
  
  if (chapter === 'Life Processes') {
    if (/\b(respiration|respire)\b/i.test(text)) return 'Respiration';
    if (/\b(nutrition|digest)\b/i.test(text)) return 'Nutrition';
    if (/\b(transportation|heart|blood)\b/i.test(text)) return 'Transportation';
    if (/\b(excretion|kidney)\b/i.test(text)) return 'Excretion';
    if (/\blife process\b/i.test(text)) return 'Life Processes';
  }
  
  if (chapter === 'Control and Coordination') {
    if (/\breflex action\b/i.test(text)) return 'Reflex Action';
    if (/\bhuman brain\b/i.test(text)) return 'Human Brain';
    if (/\b(nervous system|neuron)\b/i.test(text)) return 'Nervous System';
    if (/\b(endocrine|hormone)\b/i.test(text)) return 'Endocrine System';
    if (/\bcoordination in plants\b/i.test(text) || /\b(tropic|nastic|phytohormone)\b/i.test(text)) return 'Coordination in Plants';
    if (/\bcontrol and coordination\b/i.test(text)) return 'Control and Coordination';
  }
  
  if (chapter === 'How do Organisms Reproduce?') {
    if (/\b(reproductive health|contraception|std)\b/i.test(text)) return 'Reproductive Health';
    if (/\b(human|male|female|puberty)\b/i.test(text)) return 'Reproduction in Human Beings';
    if (/\b(flower|seed|pollination)\b/i.test(text)) return 'Sexual Reproduction in Flowering Plants';
    if (/\b(fission|fragmentation|regeneration|budding|vegetative|asexual)\b/i.test(text)) return 'Asexual Reproduction';
    if (/\breproduce\b/i.test(text) || /\breproduction\b/i.test(text)) return 'Reproduction';
  }
  
  if (chapter === 'Heredity') {
    if (/\b(speciation|fossil)\b/i.test(text)) return 'Evolution';
    if (/\b(evolution|darwin)\b/i.test(text)) return 'Evolution';
    if (/\bsex determination\b/i.test(text)) return 'Sex Determination';
    if (/\b(mendel|trait|inherit|inheritance)\b/i.test(text)) return 'Heredity';
    if (/\bheredity\b/i.test(text)) return 'Heredity';
  }
  
  if (chapter === 'Light - Reflection and Refraction') {
    if (/\b(refraction|refractive index|snell)\b/i.test(text)) return 'Refraction';
    if (/\b(lens|magnification|power of a lens)\b/i.test(text)) return 'Lenses';
    if (/\b(mirror|reflection)\b/i.test(text)) return 'Reflection';
    if (/\blight\b/i.test(text)) return 'Light';
  }
  
  if (chapter === 'The Human Eye and the Colourful World') {
    if (/\b(myopia|hypermetropia|presbyopia|cataract|defect|vision)\b/i.test(text)) return 'Defects of Vision';
    if (/\b(human eye|accommodation|cornea|retina|ciliary)\b/i.test(text)) return 'The Human Eye';
    if (/\b(prism|dispersion|rainbow|scattering|blue sky)\b/i.test(text)) return 'The Colourful World';
  }

  return null;
}

async function run() {
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('id, content, chapter, topic');

  if (error) {
    console.error(error);
    return;
  }
  
  let changes = 0;
  
  const ch10Samples = [];
  const otherSamples = [];
  
  for (const chunk of chunks) {
    const newTopic = determineTopic(chunk.content, chunk.chapter);
    
    // We only collect samples to print
    if (chunk.chapter === 'The Human Eye and the Colourful World' && ch10Samples.length < 10) {
      ch10Samples.push({ content: chunk.content, old: chunk.topic, new: newTopic });
    } else if (chunk.chapter !== 'The Human Eye and the Colourful World' && otherSamples.length < 5) {
      otherSamples.push({ content: chunk.content, chapter: chunk.chapter, old: chunk.topic, new: newTopic });
    }
    
    if (newTopic !== chunk.topic) {
      changes++;
      await supabase
        .from('knowledge_chunks')
        .update({ topic: newTopic })
        .eq('id', chunk.id);
    }
  }
  
  console.log(`\\n--- CHAPTER 10 VALIDATION SAMPLES ---`);
  ch10Samples.forEach((s, i) => {
    console.log(`[Ch 10 Sample ${i+1}]`);
    console.log(`Chunk: ${s.content.substring(0, 100)}...`);
    console.log(`Expected/New Topic: ${s.new} | Old Topic: ${s.old}`);
    console.log(`Pass/Fail: ${s.new !== null && s.new !== 'Heating Effect and Electric Power' ? 'PASS' : 'FAIL'}`);
    console.log('---');
  });
  
  console.log(`\\n--- CHAPTERS 1-9 VALIDATION SAMPLES ---`);
  otherSamples.forEach((s, i) => {
    console.log(`[Ch 1-9 Sample ${i+1}] (${s.chapter})`);
    console.log(`Chunk: ${s.content.substring(0, 100)}...`);
    console.log(`New Topic: ${s.new} | Old Topic: ${s.old}`);
    console.log(`Pass/Fail: ${s.new === s.old || s.new !== null ? 'PASS' : 'FAIL'}`);
    console.log('---');
  });
  
  console.log(`\\nTotal records updated: ${changes}`);
}

run().catch(console.error);
