import fs from 'fs';
async function test() {
  const res = await fetch('http://localhost:3000/api/gemini/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'สวัสดีครับ',
      voice: 'Puck',
      tone: 'Friendly'
    })
  });
  const data = await res.json();
  const b64 = data.audioData.split(',')[1];
  fs.writeFileSync('test.mp3', Buffer.from(b64, 'base64'));
  console.log('Saved test.mp3, size:', fs.statSync('test.mp3').size);
}
test().catch(console.error);
