const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const podcastAudioEndpoint = `
  app.post('/api/gemini/podcast-audio', async (req, res) => {
    try {
      const { script, voices } = req.body;
      const allBuffers: Buffer[] = [];
      
      for (const segment of script) {
        const voice = voices[segment.speaker] || voices['Host 1'];
        // Assume text is reasonably sized for this demo
        const response = await ai.models.generateContent({
          model: TTS_MODEL,
          contents: [{ parts: [{ text: segment.text }] }],
          config: { 
             responseModalities: ["AUDIO"],
             speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
           }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
          allBuffers.push(Buffer.from(base64, 'base64'));
        }
        // Small delay to prevent rate limit
        await new Promise(r => setTimeout(r, 1000));
      }
      
      const finalBuffer = Buffer.concat(allBuffers);
      if (finalBuffer.length > 0) {
        return res.json({ audioData: \`data:audio/pcm;base64,\${finalBuffer.toString('base64')}\` });
      } else {
        throw new Error("No audio generated");
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || String(e) });
    }
  });
`;

if (!code.includes('/api/gemini/podcast-audio')) {
  code = code.replace("app.post('/api/gemini/podcast-script',", podcastAudioEndpoint.trim() + "\n\n  app.post('/api/gemini/podcast-script',");
  fs.writeFileSync('server.ts', code);
  console.log('Added podcast-audio endpoint to server.ts');
}
