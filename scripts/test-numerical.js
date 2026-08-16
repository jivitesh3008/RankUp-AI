function evaluateNumerical(student, official) {
  if (!student || !official) return false;

  const s = student.toLowerCase().trim().replace(/,/g, '');
  const o = official.toLowerCase().trim().replace(/,/g, '');

  const parseNum = (str) => {
    // allow 'x 10^' or '× 10^'
    const match = str.match(/^-?\d*\.?\d+(?:[eE][-+]?\d+|\s*[x×]\s*10\^[-+]?\d+)?/);
    if (!match) return { val: null, unit: str.trim() };
    let numStr = match[0].replace(/\s*[x×]\s*10\^/, 'e');
    const val = parseFloat(numStr);
    const unit = str.substring(match[0].length).trim();
    return { val, unit };
  };

  const sParsed = parseNum(s);
  const oParsed = parseNum(o);

  if (sParsed.val === null || oParsed.val === null || Number.isNaN(sParsed.val) || Number.isNaN(oParsed.val)) {
    return s === o;
  }

  const unitMap = {
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
    'ω': { factor: 1, base: 'ohm' },
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
    's': { factor: 1, base: 's' },
    'sec': { factor: 1, base: 's' },
    'second': { factor: 1, base: 's' },
    'seconds': { factor: 1, base: 's' },
    'min': { factor: 60, base: 's' },
    'hour': { factor: 3600, base: 's' },
    'hr': { factor: 3600, base: 's' },
  };

  let sUnit = sParsed.unit;
  let oUnit = oParsed.unit;
  let sVal = sParsed.val;
  let oVal = oParsed.val;

  if (unitMap[sUnit]) {
    sVal *= unitMap[sUnit].factor;
    sUnit = unitMap[sUnit].base;
  }
  if (unitMap[oUnit]) {
    oVal *= unitMap[oUnit].factor;
    oUnit = unitMap[oUnit].base;
  }

  if (sUnit !== oUnit) {
    return false;
  }

  const tolerance = 1e-5;
  if (Math.abs(sVal - oVal) <= tolerance) {
    return true;
  }
  
  return false;
}

const numericalTests = [
  { s: "6J", o: "6 J", e: true },
  { s: "6 J", o: "6 J", e: true },
  { s: "6.0 J", o: "6 J", e: true },
  { s: "6 joules", o: "6 J", e: true },
  { s: "6J", o: "7 J", e: false },
  { s: "6 mJ", o: "6 J", e: false },
  { s: "1000 J", o: "1 kJ", e: true },
  { s: "1,000 J", o: "1000 J", e: true },
  { s: " 6 J ", o: "6 J", e: true },
  { s: "2 × 10^3 J", o: "2000 J", e: true },
  { s: "6 kg", o: "6", e: false }
];

let passed = 0;
numericalTests.forEach(({s, o, e}, i) => {
  const res = evaluateNumerical(s, o);
  if (res === e) {
    console.log(`✅ Test ${i+1} PASSED: "${s}" vs "${o}" -> ${res}`);
    passed++;
  } else {
    console.error(`❌ Test ${i+1} FAILED: "${s}" vs "${o}" -> Expected ${e}, got ${res}`);
  }
});
