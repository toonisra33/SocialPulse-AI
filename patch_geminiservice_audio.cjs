const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const audioFunction = `
export const generatePodcastAudio = async (script: PodcastSegment[], voices: Record<string, string>): Promise<string> => {
  const data = await fetchApi('podcast-audio', { script, voices });
  if (!data.audioData) throw new Error("TTS failed");
  
  if (data.audioData.startsWith('data:audio/mp3;base64,')) {
    return data.audioData;
  }

  const base64 = data.audioData.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i=0; i<bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const int16Array = new Int16Array(bytes.buffer);
  const lamejs = (window as any).lamejs;
  const mp3encoder = new lamejs.Mp3Encoder(1, 24000, 128); 
  const mp3Data = [];

  const sampleBlockSize = 1152;
  for (let i = 0; i < int16Array.length; i += sampleBlockSize) {
    const sampleChunk = int16Array.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  const blob = new Blob(mp3Data, { type: 'audio/mp3' });
  return URL.createObjectURL(blob);
};
`;

if (!code.includes('generatePodcastAudio')) {
  code = code + '\n' + audioFunction;
  fs.writeFileSync('services/geminiService.ts', code);
  console.log('Added generatePodcastAudio to geminiService.ts');
}
