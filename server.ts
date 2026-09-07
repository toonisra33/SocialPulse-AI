import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // AI Logic
  const PRIMARY_PRO_MODEL = 'gemini-3.6-flash';
  const STABLE_FALLBACK_MODEL = 'gemini-3.6-flash';
  const IMAGE_MODEL = 'gemini-3.1-flash-image';
  const TTS_MODEL = 'gemini-3.1-flash-tts-preview';
  const CAMERA_SPECS = "Shot with Canon EOS R5, RF 85mm f/1.2L lens, 8K resolution, ultra-realistic photography, sharp focus, professional studio lighting.";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const safeGenerateContent = async (params: any) => {
    try {
      return await ai.models.generateContent({ ...params, model: PRIMARY_PRO_MODEL });
    } catch (e: any) {
      const errorStr = e.message || JSON.stringify(e);
      if (errorStr.includes("404") || errorStr.includes("not found") || errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("Quota")) {
        console.warn("Primary model not found or quota exhausted, falling back to Flash model.");
        return await ai.models.generateContent({ ...params, model: STABLE_FALLBACK_MODEL });
      }
      throw e;
    }
  };

  const extractJson = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(text);
    } catch (e) {
      throw new Error("AI response was not in a valid format. Please try again.");
    }
  };

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
        return res.json({ audioData: `data:audio/pcm;base64,${finalBuffer.toString('base64')}` });
      } else {
        throw new Error("No audio generated");
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || String(e) });
    }
  });

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
        parts.push({ text: `Source material/URL: ${text}` });
      }
      
      const prompt = `
You are an expert podcast producer. Analyze the provided source material and write a highly engaging podcast script.
Focus/Direction: ${focus || "General overview"}
Length constraint: ${length === 'short' ? '3-5 minutes (approx 500 words)' : length === 'medium' ? '10-15 minutes (approx 1500 words)' : 'Deep dive 20+ minutes (approx 3000 words)'}
Hosts: ${hosts === 2 ? '2 Hosts (Host 1 and Host 2 having a dynamic conversation)' : '1 Host (Host 1 giving a solo deep-dive)'}

Return the script strictly as a JSON array of objects with exactly two fields:
"speaker": either "Host 1" or "Host 2"
"text": the dialogue text for that segment. (Keep each segment reasonably concise).
Ensure the tone is engaging, educational, and natural.
`;
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

  app.post('/api/gemini/fullpost', async (req, res) => {
    try {
      const { platform, topic, tone, style, captionLength, avatars } = req.body;
      const textRes = await safeGenerateContent({
        contents: `Social Media Strategist. Platform: ${platform}. Topic: "${topic}". Tone: ${tone}. JSON output: { "caption": "...", "hook": "Headline", "prompt": "Image prompt", "hashtags": [] }`,
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      const data = extractJson(textRes.text || "{}");
      
      const imageParts: any[] = [];
      if (avatars.avatar1) imageParts.push({ inlineData: { mimeType: 'image/png', data: avatars.avatar1.split(',')[1] } });
      if (avatars.avatar2) imageParts.push({ inlineData: { mimeType: 'image/png', data: avatars.avatar2.split(',')[1] } });

      const imageRes = await safeGenerateContent({
        model: IMAGE_MODEL,
        contents: { parts: [...imageParts, { text: `${data.prompt}. ${CAMERA_SPECS}` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      let imageData = "";
      for (const part of imageRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageData = `data:image/png;base64,${part.inlineData.data}`;
      }

      res.json({ caption: data.caption, headline: data.hook, hashtags: data.hashtags, imageData });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/productpost', async (req, res) => {
    try {
      const { platform, topic, uploadedImage } = req.body;
      const response = await safeGenerateContent({
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: uploadedImage.split(',')[1] } },
            { text: `Create viral post for ${platform} about: ${topic}. Respond JSON: { "caption": "...", "headline": "...", "hashtags": [] }` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const data = extractJson(response.text || "{}");
      res.json({ ...data, imageData: uploadedImage });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/graphic', async (req, res) => {
    try {
      const { topic, style, userName, uploadedImage } = req.body;
      const parts: any[] = [];
      if (uploadedImage) parts.push({ inlineData: { mimeType: 'image/png', data: uploadedImage.split(',')[1] } });
      parts.push({ text: `สร้างคำคมไทยหัวข้อ "${topic}" โดยใช้สติปัญญา Gemini 3.1 Pro ตอบเป็น JSON: { "quote": "...", "imagePrompt": "..." }` });

      const textRes = await safeGenerateContent({ contents: { parts }, config: { responseMimeType: "application/json" } });
      const data = extractJson(textRes.text || "{}");
      
      const imageRes = await safeGenerateContent({ model: IMAGE_MODEL, contents: `${data.imagePrompt}. ${CAMERA_SPECS}` });
      let imageData = "";
      for (const part of imageRes.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageData = `data:image/png;base64,${part.inlineData.data}`;
      }
      res.json({ caption: data.quote, headline: data.quote, quote: data.quote, author: userName, imageData, hashtags: [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/tts', async (req, res) => {
    try {
      const { text, voice, tone } = req.body;

      try {
        // จำกัดความยาวแต่ละท่อนที่ 600 ตัวอักษร (ประมาณ 1 นาที) เพื่อไม่ให้เสียงอู้
        const maxLength = 600;
        const chunks: string[] = [];
        let currentChunk = "";
        
        // แยกตามย่อหน้าก่อน เพื่อไม่ให้เสียรูปประโยค
        const paragraphs = text.split(/\n+/);
        
        for (const paragraph of paragraphs) {
          if (paragraph.trim().length === 0) continue;
          if (currentChunk.length + paragraph.length + 1 <= maxLength) {
            currentChunk += (currentChunk ? "\n" : "") + paragraph;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            if (paragraph.length > maxLength) {
              // ถ้าย่อหน้ายาวเกินไป ให้แยกตามช่องว่าง (การเว้นวรรคในภาษาไทย)
              const words = paragraph.split(' ');
              let pChunk = "";
              for (const word of words) {
                if (pChunk.length + word.length + 1 <= maxLength) {
                  pChunk += (pChunk ? " " : "") + word;
                } else {
                  if (pChunk) chunks.push(pChunk);
                  pChunk = word;
                }
              }
              currentChunk = pChunk;
            } else {
              currentChunk = paragraph;
            }
          }
        }
        if (currentChunk) chunks.push(currentChunk);

        if (chunks.length === 0) {
          throw new Error("No text provided");
        }

        const allBuffers: Buffer[] = [];
        for (const chunk of chunks) {
          const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: `Speech tone ${tone}: ${chunk}` }] }],
            config: { 
              responseModalities: [Modality.AUDIO], 
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } 
            }
          });
          const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64) {
            allBuffers.push(Buffer.from(base64, 'base64'));
          }
        }

        const finalBuffer = Buffer.concat(allBuffers);
        if (finalBuffer.length > 0) {
          return res.json({ audioData: `data:audio/pcm;base64,${finalBuffer.toString('base64')}` });
        }
      } catch (geminiError: any) {
        const errorStr = geminiError.message || String(geminiError);
        if (errorStr.includes("429") || errorStr.includes("Quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
          console.warn("Gemini TTS quota exceeded, falling back to free Google Translate TTS");
          const googleTTS = await import('google-tts-api');
          const results = await googleTTS.getAllAudioBase64(text, {
            lang: 'th',
            slow: false,
            host: 'https://translate.google.com',
          });
          
          if (results && results.length > 0) {
            const allMp3Buffers = results.map(r => Buffer.from(r.base64, 'base64'));
            const finalMp3Buffer = Buffer.concat(allMp3Buffers);
            return res.json({ audioData: `data:audio/mp3;base64,${finalMp3Buffer.toString('base64')}` });
          }
        }
        throw geminiError;
      }
      
      res.json({ audioData: null });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/strategy', async (req, res) => {
    try {
      const { niche, platform } = req.body;
      const response = await safeGenerateContent({ contents: `Growth strategy for ${niche} on ${platform}. JSON.` });
      res.json(extractJson(response.text || "{}"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/audience', async (req, res) => {
    try {
      const { product, platform } = req.body;
      const response = await safeGenerateContent({ contents: `Target audience for ${product} on ${platform}. JSON.` });
      res.json(extractJson(response.text || "{}"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/birthday', async (req, res) => {
    try {
      const { name, relationship, style } = req.body;
      const response = await safeGenerateContent({ contents: `Wish for ${name}, ${relationship}, ${style} in Thai.` });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/gemini/video', async (req, res) => {
    try {
      const { topic, duration } = req.body;
      const response = await safeGenerateContent({ contents: `Viral script for "${topic}" (${duration}). JSON.` });
      res.json(extractJson(response.text || "{}"));
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/elevenlabs/clone', async (req, res) => {
    try {
      if (!process.env.ELEVENLABS_API_KEY) {
        // Return a mock voice ID for demo purposes when PRO plan is simulated
        return res.json({ voice_id: `mock_voice_${Date.now()}` });
      }
      const { name, audioBase64 } = req.body;
      const buffer = Buffer.from(audioBase64, 'base64');
      const blob = new Blob([buffer], { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('name', name);
      formData.append('files', blob, 'recording.webm');
      formData.append('description', 'Custom voice cloned from user');

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: formData as any
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail?.message || "Failed to clone voice on ElevenLabs");
      }
      res.json({ voice_id: data.voice_id });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/elevenlabs/tts', async (req, res) => {
    try {
      if (!process.env.ELEVENLABS_API_KEY) {
        // Mock TTS response for demo purposes (returns a short silent or dummy base64 string)
        const dummyBase64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwBRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1d/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/AAAAAExhdmM1OS4zNwAAAAAAAAAAAAAAAAQAAP/////////////////////zAAADJQAyAAAA";
        return res.json({ audioData: `data:audio/mp3;base64,${dummyBase64}` });
      }
      const { text, voiceId } = req.body;
      
      // Split text into chunks to prevent quality degradation on long texts
      const maxLength = 3000;
      const chunks: string[] = [];
      let currentChunk = "";
      const paragraphs = text.split(/\n+/);
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim().length === 0) continue;
        if (currentChunk.length + paragraph.length + 1 <= maxLength) {
          currentChunk += (currentChunk ? "\n" : "") + paragraph;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (paragraph.length > maxLength) {
            const words = paragraph.split(' ');
            let pChunk = "";
            for (const word of words) {
              if (pChunk.length + word.length + 1 <= maxLength) {
                pChunk += (pChunk ? " " : "") + word;
              } else {
                if (pChunk) chunks.push(pChunk);
                pChunk = word;
              }
            }
            currentChunk = pChunk;
          } else {
            currentChunk = paragraph;
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      if (chunks.length === 0) {
        throw new Error("No text provided");
      }

      const allBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: chunk,
            model_id: 'eleven_multilingual_v2'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail?.message || "ElevenLabs TTS failed");
        }
        
        const arrayBuffer = await response.arrayBuffer();
        allBuffers.push(Buffer.from(arrayBuffer));
      }
      
      const finalBuffer = Buffer.concat(allBuffers);
      const base64 = finalBuffer.toString('base64');
      res.json({ audioData: `data:audio/mp3;base64,${base64}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post('/api/video/generate', async (req, res) => {
    try {
      const { prompt, provider, imageUrl } = req.body;
      
      if (provider === 'luma') {
        const apiKey = process.env.LUMA_API_KEY;
        if (!apiKey) return res.json({ jobId: `mock_luma_${Date.now()}`, provider: 'luma' });

        const payload: any = {
          prompt: prompt,
        };
        
        if (imageUrl) {
          payload.image_url = imageUrl;
        }

        const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Luma API Error: ${response.status}`);
        }

        const data = await response.json();
        return res.json({ jobId: data.id, provider: 'luma' });

      } else if (provider === 'runway') {
        const apiKey = process.env.RUNWAY_API_KEY;
        if (!apiKey) return res.json({ jobId: `mock_runway_${Date.now()}`, provider: 'runway' });

        const payload: any = {
          promptImage: imageUrl,
          promptText: prompt,
          model: 'gen3a_turbo'
        };

        const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Runway-Version': '2024-11-06',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || error.message || `Runway API Error: ${response.status}`);
        }

        const data = await response.json();
        return res.json({ jobId: data.id, provider: 'runway' });
      } else if (provider === 'omni_flash') {
        const apiKey = process.env.OMNI_API_KEY;
        
        // Using a mock implementation for Omni Flash until official API is available
        return res.json({ jobId: `omni_${Date.now()}`, provider: 'omni_flash' });
      } else if (provider === 'seedance') {
        const apiKey = process.env.SEEDANCE_API_KEY;
        
        // Using a mock implementation for Seedance 2.5 until official API is available
        return res.json({ jobId: `seedance_${Date.now()}`, provider: 'seedance' });
      }

      throw new Error(`Unsupported provider: ${provider}`);
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.get('/api/video/status', async (req, res) => {
    try {
      const { jobId, provider } = req.query;
      
      if (String(jobId).startsWith('mock_') || String(jobId).startsWith('omni_') || String(jobId).startsWith('seedance_')) {
        const timestamp = parseInt(String(jobId).split('_').pop() || "0");
        const elapsed = Date.now() - timestamp;
        
        if (elapsed > 15000) {
          return res.json({
            status: 'completed',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            progress: 100
          });
        } else {
          return res.json({
            status: 'processing',
            videoUrl: null,
            progress: Math.min(95, Math.floor((elapsed / 15000) * 100))
          });
        }
      }
      
      if (provider === 'luma') {
        const apiKey = process.env.LUMA_API_KEY;
        const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Luma API Error: ${response.status}`);
        }

        const data = await response.json();
        
        let status = 'processing';
        if (data.state === 'completed') status = 'completed';
        if (data.state === 'failed') status = 'failed';

        return res.json({ 
          status, 
          videoUrl: data.assets?.video,
          progress: 50 // Luma doesn't return exact progress, mock it while processing
        });

      } else if (provider === 'runway') {
        const apiKey = process.env.RUNWAY_API_KEY;
        const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Runway-Version': '2024-11-06'
          }
        });

        if (!response.ok) {
          throw new Error(`Runway API Error: ${response.status}`);
        }

        const data = await response.json();
        
        let status = 'processing';
        if (data.status === 'SUCCEEDED') status = 'completed';
        if (data.status === 'FAILED') status = 'failed';

        return res.json({ 
          status, 
          videoUrl: data.output ? data.output[0] : null,
          progress: data.progress ? Math.round(data.progress * 100) : 50
        });
      } else if (provider === 'omni_flash' || provider === 'seedance') {
        // Fallback for non-prefixed jobs if any
        return res.json({
          status: 'completed',
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          progress: 100
        });
      }

      throw new Error(`Unsupported provider: ${provider}`);
    } catch (e: any) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  // OAuth endpoints for Social Media
  app.get('/api/auth/:provider/url', (req, res) => {
    const { provider } = req.params;
    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}/auth/callback`;
    let authUrl = '';
    
    if (provider === 'facebook') {
      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID || 'dummy_fb_client_id',
        redirect_uri: redirectUri,
        state: provider,
        response_type: 'code',
        scope: 'email,pages_manage_posts,pages_read_engagement'
      });
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
    } else if (provider === 'instagram') {
      const params = new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID || 'dummy_ig_client_id',
        redirect_uri: redirectUri,
        state: provider,
        response_type: 'code',
        scope: 'user_profile,user_media'
      });
      authUrl = `https://api.instagram.com/oauth/authorize?${params}`;
    } else if (provider === 'tiktok') {
      const params = new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || 'dummy_tiktok_client_key',
        redirect_uri: redirectUri,
        state: provider,
        response_type: 'code',
        scope: 'user.info.basic,video.publish'
      });
      authUrl = `https://www.tiktok.com/v2/auth/authorize?${params}`;
    } else if (provider === 'twitter') {
      const params = new URLSearchParams({
        client_id: process.env.TWITTER_CLIENT_ID || 'dummy_twitter_client_id',
        redirect_uri: redirectUri,
        state: provider,
        response_type: 'code',
        scope: 'tweet.read,tweet.write,users.read',
        code_challenge: 'challenge',
        code_challenge_method: 'plain'
      });
      authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;
    }
    
    res.json({ url: authUrl });
  });

  app.get('/auth/callback', (req, res) => {
    const { code, state } = req.query;
    // In a real app, we would exchange the code for an access token here.
    // For this demonstration, we'll simulate a successful connection.
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: '${state}', code: '${code}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler to prevent HTML responses for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
