import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

function determineTopic(text: string, chapter: string): string | null {
  // Use regex with word boundaries (\b) and case-insensitive matching
  
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
  
  if (chapter === 'Electricity') {
    if (/\bcommercial unit\b/i.test(text) || /\bkilowatt-hour\b/i.test(text) || /\bkwh\b/i.test(text)) return 'Commercial Unit of Electrical Energy';
    if (/joule['’]s law\b/i.test(text)) return "Joule's Law of Heating";
    if (/\bheating effect\b/i.test(text) || (/\bheat\b/i.test(text) && /\b(resistor|current)\b/i.test(text) && !/\bjoule\b/i.test(text))) return 'Heating Effect of Electric Current';
    if (/\b(series|parallel)\b/i.test(text) && /\b(resistor|resistance|combination)\b/i.test(text)) return 'Series and Parallel Combination of Resistors';
    if (/\belectric power\b/i.test(text) || (/\bpower\b/i.test(text) && /\bwatt\b/i.test(text))) return 'Electric Power';
    if ((/\bfactors\b/i.test(text) && /\bresistance\b/i.test(text)) || /\b(resistivity|area of cross-section)\b/i.test(text)) return 'Factors Affecting Resistance';
    if (/ohm['’]s law\b/i.test(text) || (/\bohm\b/i.test(text) && /\b(proportional|v\s*=\s*ir)\b/i.test(text))) return "Ohm's Law";
    if (/\b(potential difference|electric potential|volt|voltage)\b/i.test(text)) return 'Electric Potential and Potential Difference';
    if (/\belectric current\b/i.test(text) || (/\bcurrent\b/i.test(text) && /\b(ampere|flow of charge)\b/i.test(text))) return 'Electric Current';
    if (/\belectric energy\b/i.test(text) || (/\benergy\b/i.test(text) && /\b(joule|consume)\b/i.test(text))) return 'Electric Energy';
    if (/\bresistance\b/i.test(text) || /\bresistor\b/i.test(text)) return 'Resistance';
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
  
  const ch11Samples = [];
  const otherSamples = [];
  
  for (const chunk of chunks) {
    const newTopic = determineTopic(chunk.content, chunk.chapter);
    
    // We only collect samples to print
    if (chunk.chapter === 'Electricity' && ch11Samples.length < 15) {
      if (newTopic) ch11Samples.push({ content: chunk.content, old: chunk.topic, new: newTopic });
    } else if (chunk.chapter !== 'Electricity' && otherSamples.length < 5) {
      otherSamples.push({ content: chunk.content, chapter: chunk.chapter, old: chunk.topic, new: newTopic });
    }
    
    // Only update if it's Electricity and changed, OR if a regression happened (which shouldn't)
    if (newTopic !== chunk.topic && chunk.chapter === 'Electricity') {
      changes++;
      await supabase
        .from('knowledge_chunks')
        .update({ topic: newTopic })
        .eq('id', chunk.id);
    }
  }
  
  console.log(`\n--- CHAPTER 11 VALIDATION SAMPLES ---`);
  ch11Samples.forEach((s, i) => {
    console.log(`[Ch 11 Sample ${i+1}]`);
    console.log(`Chunk: ${s.content.substring(0, 100)}...`);
    console.log(`Expected/New Topic: ${s.new} | Old Topic: ${s.old}`);
    console.log(`Pass/Fail: ${s.new !== s.old || s.new !== null ? 'PASS' : 'FAIL'}`);
    console.log('---');
  });
  
  console.log(`\n--- CHAPTERS 1-10 REGRESSION SAMPLES ---`);
  otherSamples.forEach((s, i) => {
    console.log(`[Ch 1-10 Sample ${i+1}] (${s.chapter})`);
    console.log(`Chunk: ${s.content.substring(0, 100)}...`);
    console.log(`New Topic: ${s.new} | Old Topic: ${s.old}`);
    console.log(`Pass/Fail: ${s.new === s.old || s.new !== null ? 'PASS' : 'FAIL'}`);
    console.log('---');
  });
  
  console.log(`\nTotal Chapter 11 records updated: ${changes}`);
}

run().catch(console.error);
