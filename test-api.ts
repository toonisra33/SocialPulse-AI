async function test() {
  const res = await fetch('http://localhost:3000/api/gemini/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'สวัสดีครับ ทดสอบระบบเสียง',
      voice: 'Puck',
      tone: 'Friendly'
    })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text.substring(0, 200));
}
test().catch(console.error);
