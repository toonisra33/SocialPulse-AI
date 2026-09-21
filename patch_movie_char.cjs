const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
  app.post('/api/gemini/movie-characters', async (req, res) => {
    try {
      const { pitch, style } = req.body;
      // 1. Generate text details
      const textRes = await safeGenerateContent({
        contents: \`Based on this movie pitch: Title: "\${pitch.title}", Synopsis: "\${pitch.synopsis}".
        Generate the main characters for this movie.
        Respond strictly in JSON format as an array of objects:
        - id (string, unique like char_1)
        - name (string)
        - role (string, e.g., Protagonist, Antagonist, Sidekick)
        - description (string, appearance and personality)
        - voiceStyle (string, e.g., Deep and raspy, High and energetic)
        - prompt (string, a highly detailed prompt to generate a portrait image of this character in "\${style}" style)
        Example: [ { "id": "c1", "name": "...", "role": "...", "description": "...", "voiceStyle": "...", "prompt": "..." } ]\`,
        config: { responseMimeType: "application/json" }
      });
      const characters = extractJson(textRes.text || "[]");
      
      // 2. Generate images for each character
      const charsWithImages = await Promise.all(characters.map(async (char: any) => {
         try {
            const imgRes = await safeGenerateContent({
               model: IMAGE_MODEL,
               contents: \`Portrait of \${char.name}. \${char.prompt}. Style: \${style}. \${CAMERA_SPECS}\`,
               config: { imageConfig: { aspectRatio: "1:1" } }
            });
            let imageUrl = null;
            for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
               if (part.inlineData) {
                  imageUrl = \`data:image/png;base64,\${part.inlineData.data}\`;
               }
            }
            return { ...char, imageUrl };
         } catch(e) {
            console.error("Failed to generate image for char", char.name);
            return { ...char, imageUrl: null };
         }
      }));

      res.json(charsWithImages);
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/movie-character-regen', async (req, res) => {
    try {
       const { char, style, uploadedFace } = req.body;
       const contents = {
          parts: [
            { text: \`Generate a portrait of \${char.name}. \${char.prompt}. Style: \${style}. MAKE SURE THE FACE MATCHES THE PROVIDED IMAGE EXACTLY. \${CAMERA_SPECS}\` }
          ]
       } as any;

       if (uploadedFace) {
          contents.parts.unshift({
             inlineData: { mimeType: 'image/png', data: uploadedFace.split(',')[1] }
          });
       }

       const imgRes = await safeGenerateContent({
          model: IMAGE_MODEL,
          contents,
          config: { imageConfig: { aspectRatio: "1:1" } }
       });
       let imageUrl = null;
       for (const part of imgRes.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) imageUrl = \`data:image/png;base64,\${part.inlineData.data}\`;
       }
       res.json({ imageUrl });
    } catch (e: any) {
       res.status(500).json({ error: e.message || String(e) });
    }
  });
`;

if (code.includes('app.post(\'/api/gemini/movie-characters\', async (req, res) => {')) {
  // Replace the old character endpoint
  const targetRegex = /app\.post\('\/api\/gemini\/movie-characters', async \(req, res\) => \{[\s\S]*?\}\);/;
  code = code.replace(targetRegex, newEndpoints);
  fs.writeFileSync('server.ts', code);
  console.log('Character endpoints updated.');
} else {
  console.log('Could not find character endpoint.');
}
