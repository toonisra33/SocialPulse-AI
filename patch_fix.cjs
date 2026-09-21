const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(`      res.json(extractJson(response.text || "[]"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/movie-scenes'`, `  app.post('/api/gemini/movie-scenes'`);

fs.writeFileSync('server.ts', code);
console.log('Fixed syntax error in server.ts');
