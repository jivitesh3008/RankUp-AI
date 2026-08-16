import fetch from 'node-fetch';

async function run() {
  const apiUrl = 'http://localhost:3000/api/chat';
  
  // Create a 6MB dummy base64 string
  const dummyBase64 = 'A'.repeat(6 * 1024 * 1024);
  
  const payload = {
    messages: [
      { role: 'user', content: 'Test size limit', image: dummyBase64, mimeType: 'image/png' }
    ]
  };
  
  console.log("Sending payload of length:", JSON.stringify(payload).length);
  
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", res.status);
    const data = await res.json().catch(() => ({}));
    console.log("Response:", data);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
