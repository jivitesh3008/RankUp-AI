import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Ensure we have a 32-byte key. If the key is shorter/longer, we hash it.
const RAW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.GEMINI_API_KEY || 'default-insecure-key-rankup-test';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

export function encryptAnswer(answer: string, explanation: string): string {
  const payload = JSON.stringify({ a: answer, e: explanation });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptAnswer(token: string): { answer: string, explanation: string } | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted);
    return { answer: parsed.a, explanation: parsed.e };
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}

export function evaluateNumerical(student: string, official: string): boolean {
  if (!student || !official) return false;

  const s = student.toLowerCase().trim().replace(/,/g, '');
  const o = official.toLowerCase().trim().replace(/,/g, '');

  const parseNum = (str: string) => {
    // Match numbers including scientific notation
    const match = str.match(/^-?\d*\.?\d+(?:[eE][-+]?\d+|\s*[x×]\s*10\^[-+]?\d+)?/);
    if (!match) return { val: null, unit: str.trim() };
    let numStr = match[0].replace(/\s*[x×]\s*10\^/, 'e');
    const val = parseFloat(numStr);
    const unit = str.substring(match[0].length).trim();
    return { val, unit };
  };

  const sParsed = parseNum(s);
  const oParsed = parseNum(o);

  // If we can't extract a valid number from either, fall back to exact string match
  if (sParsed.val === null || oParsed.val === null || Number.isNaN(sParsed.val) || Number.isNaN(oParsed.val)) {
    return s === o;
  }

  // Common Unit normalization map for Class 10 Science
  const unitMap: Record<string, { factor: number, base: string }> = {
    'j': { factor: 1, base: 'j' },
    'joule': { factor: 1, base: 'j' },
    'joules': { factor: 1, base: 'j' },
    'kj': { factor: 1000, base: 'j' },
    'mj': { factor: 0.001, base: 'j' },
    
    'v': { factor: 1, base: 'v' },
    'volt': { factor: 1, base: 'v' },
    'volts': { factor: 1, base: 'v' },
    'kv': { factor: 1000, base: 'v' },
    'mv': { factor: 0.001, base: 'v' },

    'a': { factor: 1, base: 'a' },
    'ampere': { factor: 1, base: 'a' },
    'amperes': { factor: 1, base: 'a' },
    'amp': { factor: 1, base: 'a' },
    'amps': { factor: 1, base: 'a' },
    'ma': { factor: 0.001, base: 'a' },

    'w': { factor: 1, base: 'w' },
    'watt': { factor: 1, base: 'w' },
    'watts': { factor: 1, base: 'w' },
    'kw': { factor: 1000, base: 'w' },

    'ohm': { factor: 1, base: 'ohm' },
    'ohms': { factor: 1, base: 'ohm' },
    'Ω': { factor: 1, base: 'ohm' },
    'kohm': { factor: 1000, base: 'ohm' },

    'm': { factor: 1, base: 'm' },
    'meter': { factor: 1, base: 'm' },
    'meters': { factor: 1, base: 'm' },
    'km': { factor: 1000, base: 'm' },
    'cm': { factor: 0.01, base: 'm' },
    'mm': { factor: 0.001, base: 'm' },

    'kg': { factor: 1, base: 'kg' },
    'kilogram': { factor: 1, base: 'kg' },
    'g': { factor: 0.001, base: 'kg' },
    'gram': { factor: 0.001, base: 'kg' },
    'grams': { factor: 0.001, base: 'kg' },
    'mg': { factor: 0.000001, base: 'kg' },
    'milligram': { factor: 0.000001, base: 'kg' },
    'milligrams': { factor: 0.000001, base: 'kg' },

    's': { factor: 1, base: 's' },
    'sec': { factor: 1, base: 's' },
    'second': { factor: 1, base: 's' },
    'seconds': { factor: 1, base: 's' },
    'min': { factor: 60, base: 's' },
    'hour': { factor: 3600, base: 's' },
    'hr': { factor: 3600, base: 's' },
    
    'n': { factor: 1, base: 'n' },
    'newton': { factor: 1, base: 'n' },
    'newtons': { factor: 1, base: 'n' },
    
    'pa': { factor: 1, base: 'pa' },
    'pascal': { factor: 1, base: 'pa' },
    'pascals': { factor: 1, base: 'pa' },
    
    'c': { factor: 1, base: 'c' },
    'coulomb': { factor: 1, base: 'c' },
    'coulombs': { factor: 1, base: 'c' },
    
    'hz': { factor: 1, base: 'hz' },
    'hertz': { factor: 1, base: 'hz' },
    'khz': { factor: 1000, base: 'hz' },
    'mhz': { factor: 1000000, base: 'hz' },
  };

  let sUnit = sParsed.unit;
  let oUnit = oParsed.unit;
  let sVal = sParsed.val;
  let oVal = oParsed.val;

  // Convert units to base if known
  if (unitMap[sUnit]) {
    sVal *= unitMap[sUnit].factor;
    sUnit = unitMap[sUnit].base;
  }
  if (unitMap[oUnit]) {
    oVal *= unitMap[oUnit].factor;
    oUnit = unitMap[oUnit].base;
  }

  // Compare units
  // Strictly enforce that units match (e.g., '6 kg' is not '6')
  if (sUnit !== oUnit) {
    return false;
  }

  // Compare float values with tolerance
  const tolerance = 1e-5;
  if (Math.abs(sVal - oVal) <= tolerance) {
    return true;
  }
  
  return false;
}
