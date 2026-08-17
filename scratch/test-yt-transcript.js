const { YoutubeTranscript } = require('youtube-transcript');

async function test(videoId, lang) {
  try {
    const config = lang ? { lang } : undefined;
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, config);
    console.log(`✅ Success for ${videoId} (lang: ${lang || 'default'}):`, transcript.length, 'segments');
    if (transcript.length > 0) {
      console.log('Sample segment:', transcript[0]);
    }
  } catch (err) {
    console.log(`❌ Error for ${videoId} (lang: ${lang || 'default'}):`);
    console.log('  Name:', err.constructor.name);
    console.log('  Message:', err.message);
  }
}

async function run() {
  await test('dQw4w9WgXcQ', 'xyz'); // Force unknown language
}

run();
