const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newEndpoints = `
  app.post('/api/gemini/movie-pitches', async (req, res) => {
    try {
      const { style, genre, length } = req.body;
      const response = await safeGenerateContent({
        contents: \`Create 3 movie concept pitches. Style: \${style}. Genre: \${genre}. Length: \${length}.
        Respond strictly in JSON format as an array of objects, each containing:
        - title (string)
        - synopsis (string, max 3 lines)
        - ending (string, brief explanation of how the story concludes)
        Example: [ { "title": "...", "synopsis": "...", "ending": "..." } ]\`,
        config: { responseMimeType: "application/json" }
      });
      res.json(extractJson(response.text || "[]"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/movie-characters', async (req, res) => {
    try {
      const { pitch } = req.body;
      const response = await safeGenerateContent({
        contents: \`Based on this movie pitch: Title: "\${pitch.title}", Synopsis: "\${pitch.synopsis}".
        Generate the main characters for this movie.
        Respond strictly in JSON format as an array of objects:
        - id (string, unique like char_1)
        - name (string)
        - role (string, e.g., Protagonist, Antagonist, Sidekick)
        - description (string, appearance and personality)
        - voiceStyle (string, e.g., Deep and raspy, High and energetic)
        Example: [ { "id": "c1", "name": "...", "role": "...", "description": "...", "voiceStyle": "..." } ]\`,
        config: { responseMimeType: "application/json" }
      });
      res.json(extractJson(response.text || "[]"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/movie-scenes', async (req, res) => {
    try {
      const { pitch, characters } = req.body;
      const response = await safeGenerateContent({
        contents: \`Based on the movie "\${pitch.title}" and characters: \${JSON.stringify(characters.map(c => c.name))}.
        Create the first 3 detailed scenes (to avoid token limits, we just do 3 scenes for this demo).
        Respond strictly in JSON format as an array of objects:
        - id (string, unique like s_1)
        - sceneNumber (number)
        - location (string)
        - action (string, detailed visual action for video generation)
        - dialog (string, actual spoken words by characters, or "None" if action only)
        - speakingCharacterId (string, id of character speaking, or null)
        - emotion (string, the mood/emotion for voice and face)
        Example: [ { "id": "s1", "sceneNumber": 1, "location": "...", "action": "...", "dialog": "...", "speakingCharacterId": "c1", "emotion": "Angry" } ]\`,
        config: { responseMimeType: "application/json" }
      });
      res.json(extractJson(response.text || "[]"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });
`;

if (!code.includes('/api/gemini/movie-pitches')) {
  code = code.replace(
    "app.post('/api/gemini/video-pitches', async (req, res) => {",
    newEndpoints + "\n  app.post('/api/gemini/video-pitches', async (req, res) => {"
  );
  fs.writeFileSync('server.ts', code);
  console.log('Movie endpoints added to server.ts');
} else {
  console.log('Movie endpoints already exist.');
}
