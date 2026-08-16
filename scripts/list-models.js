const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (response.ok) {
      const data = await response.json();
      console.log("Available models:");
      data.models.forEach(m => console.log(m.name, m.supportedGenerationMethods));
    } else {
      const errorText = await response.text();
      console.error(`Failed to list models: ${response.status} - ${errorText}`);
    }
  } catch (e) {
    console.error(`Error listing models:`, e);
  }
}

listModels();
