const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldExtractJson = `  const extractJson = (text: string) => {
    try {
      const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(text);
    } catch (e) {
      throw new Error("AI response was not in a valid format. Please try again.");
    }
  };`;

const newExtractJson = `  const extractJson = (text: string) => {
    try {
      const cleaned = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      try {
        const match = text.match(/\\[[\\s\\S]*\\]|\\{[\\s\\S]*\\}/);
        if (match) return JSON.parse(match[0]);
      } catch (e2) {}
      throw new Error("AI response was not in a valid format. Please try again.");
    }
  };`;

if (code.includes('text.match(/\\{[\\s\\S]*\\}/)')) {
  code = code.replace(oldExtractJson, newExtractJson);
  fs.writeFileSync('server.ts', code);
  console.log('extractJson updated.');
} else {
  console.log('Could not find old extractJson.');
}
