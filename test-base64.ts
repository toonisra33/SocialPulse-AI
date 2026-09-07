import * as googleTTS from 'google-tts-api';

async function test() {
  const results = await googleTTS.getAllAudioBase64('สวัสดี', {
    lang: 'th',
    slow: false,
    host: 'https://translate.google.com',
  });
  console.log('Base64 length:', results[0].base64.length);
  console.log('Has newlines:', results[0].base64.includes('\n'));
}
test().catch(console.error);
