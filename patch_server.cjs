const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const podcastEndpoint = `
  app.post('/api/gemini/podcast-script', async (req, res) => {
    try {
      const { text, focus, length, hosts, fileData, fileMime } = req.body;
      let parts = [];
      if (fileData && fileMime) {
        parts.push({
          inlineData: {
            data: fileData.split(',')[1] || fileData,
            mimeType: fileMime
          }
        });
      }
      if (text) {
        parts.push({ text: \`Source material/URL: \${text}\` });
      }
      
      const prompt = \`
You are an expert podcast producer. Analyze the provided source material and write a highly engaging podcast script.
Focus/Direction: \${focus || "General overview"}
Length constraint: \${length === 'short' ? '3-5 minutes (approx 500 words)' : length === 'medium' ? '10-15 minutes (approx 1500 words)' : 'Deep dive 20+ minutes (approx 3000 words)'}
Hosts: \${hosts === 2 ? '2 Hosts (Host 1 and Host 2 having a dynamic conversation)' : '1 Host (Host 1 giving a solo deep-dive)'}

Return the script strictly as a JSON array of objects with exactly two fields:
"speaker": either "Host 1" or "Host 2"
"text": the dialogue text for that segment. (Keep each segment reasonably concise).
Ensure the tone is engaging, educational, and natural.
\`;
      parts.push({ text: prompt });

      const textRes = await safeGenerateContent({
        contents: [{ role: "user", parts }],
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      
      const data = extractJson(textRes.text || "[]");
      res.json(Array.isArray(data) ? data : []);
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });
`;

if (!code.includes('/api/gemini/podcast-script')) {
  code = code.replace("app.post('/api/gemini/fullpost',", podcastEndpoint.trim() + "\n\n  app.post('/api/gemini/fullpost',");
  fs.writeFileSync('server.ts', code);
  console.log('Added podcast endpoint to server.ts');
} else {
  console.log('Podcast endpoint already exists');
}
