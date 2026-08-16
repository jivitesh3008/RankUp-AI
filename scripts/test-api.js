const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Match the key logic in evaluate.ts
const RAW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.GEMINI_API_KEY || 'default-insecure-key-rankup-test';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

function encryptAnswer(answer, explanation) {
  const payload = JSON.stringify({ a: answer, e: explanation });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function run() {
  const testCases = [
    { student: "6J", correct: "6 J", expected: true, type: "Numerical" },
    { student: "6 J", correct: "6 J", expected: true, type: "Numerical" },
    { student: "6.0 J", correct: "6 J", expected: true, type: "Numerical" },
    { student: "7J", correct: "6 J", expected: false, type: "Numerical" },
    { student: "6mJ", correct: "6J", expected: false, type: "Numerical" },
    { student: "1,000 J", correct: "1000 J", expected: true, type: "Numerical" },
    { student: "1000 J", correct: "1 kJ", expected: true, type: "Numerical" },
    { student: "1000 W", correct: "1 kW", expected: true, type: "Numerical" },
    { student: "2 mV", correct: "0.002 V", expected: true, type: "Numerical" },
    { student: "2 A", correct: "2000 mA", expected: true, type: "Numerical" },
    { student: "500 ohm", correct: "0.5 kohm", expected: true, type: "Numerical" },
    { student: "6J", correct: "6 J", expected: false, type: "Short Answer" } // This should be WRONG because it falls back to string match!
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const qId = `q-${i}`;
    
    const payload = {
      questions: [
        {
          id: qId,
          type: tc.type,
          question: "Test question?",
          answerToken: encryptAnswer(tc.correct, "explanation"),
          chapter: "Electricity",
          topic: "Topic"
        }
      ],
      userAnswers: {
        [qId]: tc.student
      }
    };

    try {
      const res = await fetch('http://localhost:3000/api/evaluate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      const isCorrect = data.evaluatedQuestions[0].isCorrect;
      
      if (isCorrect === tc.expected) {
        console.log(`✅ [${tc.type}] '${tc.student}' vs '${tc.correct}' -> ${isCorrect} (Expected: ${tc.expected})`);
      } else {
        console.error(`❌ [${tc.type}] '${tc.student}' vs '${tc.correct}' -> ${isCorrect} (Expected: ${tc.expected})`);
      }
    } catch (e) {
      console.error('Error fetching API', e);
    }
  }
}

run();
