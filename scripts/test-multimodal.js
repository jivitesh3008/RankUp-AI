import fs from 'fs';
import path from 'path';

// Helper to create a dummy 1x1 image base64
const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function runTests() {
  console.log("Starting Multimodal Tests...");
  const apiUrl = 'http://localhost:3000/api/chat';

  // We assume the dev server is running locally on port 3000 for this test.
  
  const testCases = [
    {
      name: "TEST 1: IMAGE OF TEXTBOOK QUESTION",
      payload: {
        messages: [
          { role: 'user', content: '', image: dummyBase64, mimeType: 'image/png' }
        ]
      }
    },
    {
      name: "TEST 2: IMAGE OF HANDWRITTEN WORK",
      payload: {
        messages: [
          { role: 'user', content: 'Here is my work.', image: dummyBase64, mimeType: 'image/png' }
        ]
      }
    },
    {
      name: "TEST 3: IMAGE CONTAINING A DIAGRAM",
      payload: {
        messages: [
          { role: 'user', content: 'Explain this diagram.', image: dummyBase64, mimeType: 'image/png' }
        ]
      }
    },
    {
      name: "TEST 4: IMAGE + FOLLOW-UP QUESTION",
      payload: {
        messages: [
          // Simulate that the server previously returned an imageContext for the first message
          { 
            role: 'user', 
            content: '', 
            imageContext: {
               imageType: 'handwritten_solution',
               questionText: 'What is Ohm’s Law?',
               studentWork: 'V = I/R',
               equations: ['V = I/R'],
               likelySubject: 'Science'
            }
          },
          {
            role: 'assistant',
            content: 'That looks like an attempt at Ohm\'s Law. Let\'s check the equation. Is V equal to I divided by R, or I multiplied by R?'
          },
          {
             role: 'user',
             content: 'Oh, it should be V = IR. Where did I make the mistake?'
          }
        ]
      }
    },
    {
      name: "TEXT REGRESSION: What is Ohm's law?",
      payload: {
        messages: [
          { role: 'user', content: 'What is Ohm\'s law?' }
        ]
      }
    }
  ];

  for (const tc of testCases) {
    console.log(`\n==================================================`);
    console.log(`RUNNING: ${tc.name}`);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.payload)
      });
      
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      if (data.imageContext) {
        console.log(`Extracted Image Context:`, data.imageContext);
      }
      console.log(`Grounding:`, data.grounding);
      console.log(`Response Snippet:`, data.response?.substring(0, 150) + '...');
    } catch (e) {
      console.error(`Test failed:`, e.message);
    }
  }
}

runTests();
