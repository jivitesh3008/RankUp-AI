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
  console.log("Testing video with auto-generated English captions");
  await test('jNQXAC9IVRw'); 
  console.log("Testing video with NO captions (e.g. some music video or old video)");
  await test('Wch3gJG2IG4'); // A video without captions hopefully
  console.log("Testing invalid URL");
  await test('invalid-id-here123');
}

run();
