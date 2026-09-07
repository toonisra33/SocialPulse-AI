import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TTS_MODEL = 'gemini-3.1-flash-tts-preview';

const voices = {
  Puck: { gender: 'Male', name: 'Puck (พัค)' },
  Charon: { gender: 'Male', name: 'Charon (ชารอน)' },
  Kore: { gender: 'Female', name: 'Kore (คอเร)' },
  Fenrir: { gender: 'Male', name: 'Fenrir (เฟนริล)' },
  Aoede: { gender: 'Female', name: 'Aoede (เอเอด)' },
  Leda: { gender: 'Female', name: 'Leda (ลีด้า)' },
  Orus: { gender: 'Male', name: 'Orus (ออรัส)' },
  Callirrhoe: { gender: 'Female', name: 'Callirrhoe (แคลลีโรอี)' },
  Schedar: { gender: 'Male', name: 'Schedar (เชดาร์)' },
  Enceladus: { gender: 'Male', name: 'Enceladus (เอนเซลาดัส)' }
};

function writeWavHeader(buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + buffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  wavHeader.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(buffer.length, 40);
  return Buffer.concat([wavHeader, buffer]);
}

async function run() {
  const outDir = path.join(process.cwd(), 'public', 'previews');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const [v, details] of Object.entries(voices)) {
    console.log("Generating for " + v);
    try {
      const isFemale = details.gender === 'Female';
      const greeting = isFemale ? "สวัสดีค่ะ ฉันชื่อ" + details.name + "ค่ะ " : "สวัสดีครับ ผมชื่อ" + details.name + "ครับ ";
      const text = greeting + "ระบบเว็บไซต์นี้สร้างขึ้นโดยคุณทูน อิศราวัฒน์ ขอบคุณที่สร้างเว็บไซต์ดีๆให้ใช้ ชอบกันไหมเอ่ย";
      
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: "Speech tone FRIENDLY: " + text }] }],
        config: { 
           responseModalities: ["AUDIO"],
           speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: v } } }
         }
      });
      
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const pcmBuffer = Buffer.from(base64, 'base64');
        const wavBuffer = writeWavHeader(pcmBuffer);
        fs.writeFileSync(path.join(outDir, v + ".wav"), wavBuffer);
        console.log("Saved " + v + ".wav");
      } else {
        console.error("No audio data for " + v);
      }
    } catch (e) {
      console.error("Error generating " + v + ":", e.message || e);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
}

run();
