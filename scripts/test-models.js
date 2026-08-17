const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;

async function testModel(model) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
      }
    );
    if (response.ok) {
      console.log(`Model ${model} is VALID.`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`Model ${model} is INVALID: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (e) {
    console.error(`Error testing ${model}:`, e);
    return false;
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.0-pro');
}
run();
