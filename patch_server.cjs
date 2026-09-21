const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
  app.post('/api/gemini/video-pitches', async (req, res) => {
    try {
      const { style, genre } = req.body;
      const response = await safeGenerateContent({
        contents: \`Create 5 short video concept pitches. Style: \${style}. Genre: \${genre}.
        Respond strictly in JSON format as an array of objects, each containing:
        - title (string)
        - synopsis (string, max 3 lines)
        Example: [ { "title": "...", "synopsis": "..." }, ... ]\`,
        config: { responseMimeType: "application/json" }
      });
      res.json(extractJson(response.text || "[]"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/video-script', async (req, res) => {
    try {
      const { pitch, style } = req.body;
      const response = await safeGenerateContent({
        contents: \`You are an expert film director and screenwriter. 
        Expand the following video pitch into a detailed full scene-by-scene script.
        Pitch Title: \${pitch.title}
        Pitch Synopsis: \${pitch.synopsis}
        Visual Style: \${style}
        
        Provide the response strictly in JSON format matching this structure:
        {
          "characters": [ { "name": "...", "description": "..." } ],
          "scenes": [
            {
              "sceneNumber": 1,
              "location": "...",
              "action": "...",
              "cameraAngle": "...",
              "emotionAndDetails": "..."
            }
          ]
        }\`,
        config: { responseMimeType: "application/json" }
      });
      res.json(extractJson(response.text || "{}"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });
`;

if (!code.includes('/api/gemini/video-pitches')) {
  code = code.replace(
    "app.post('/api/gemini/video', async (req, res) => {",
    newEndpoints + "\n  app.post('/api/gemini/video', async (req, res) => {"
  );
  fs.writeFileSync('server.ts', code);
  console.log('Endpoints added to server.ts');
} else {
  console.log('Endpoints already exist.');
}
