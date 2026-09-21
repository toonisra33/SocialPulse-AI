const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
const target = `    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || String(e) });
    }`;
const replacement = `    } catch (e: any) {
      console.error(e);
      const errorStr = e.message || String(e);
      if (errorStr.includes("429") || errorStr.includes("Quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        console.warn("Gemini TTS quota exceeded, falling back to free Google Translate TTS");
        try {
          const { script } = req.body;
          const fullText = script.map((s: any) => s.text).join(' ');
          const googleTTS = require('google-tts-api');
          const results = await googleTTS.getAllAudioBase64(fullText, {
            lang: 'th',
            slow: false,
            host: 'https://translate.google.com',
          });
          
          if (results && results.length > 0) {
            const allMp3Buffers = results.map((r: any) => Buffer.from(r.base64, 'base64'));
            const finalMp3Buffer = Buffer.concat(allMp3Buffers);
            return res.json({ audioData: \`data:audio/mp3;base64,\${finalMp3Buffer.toString('base64')}\` });
          }
        } catch (fallbackError) {
          console.error("Fallback TTS failed", fallbackError);
        }
      }
      res.status(500).json({ error: e.message || String(e) });
    }`;
if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched podcast-audio successfully!");
} else {
  console.log("Target not found!");
}
