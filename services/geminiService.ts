
import { Platform, ContentTone, PostResult, DesignStyle, ScriptDuration, TargetAudienceResult, StrategyPlan, ScriptStructure, CaptionLength, VoiceTone, VoiceName } from "../types";

const fetchApi = async (endpoint: string, body: any) => {
  const response = await fetch(`/api/gemini/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Server error (${response.status}). Please try again later.`);
    }
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const generateFullPost = async (
  platform: Platform,
  topic: string,
  tone: ContentTone,
  style: DesignStyle,
  captionLength: CaptionLength,
  avatars: { avatar1: string | null; avatar2: string | null; isCouple: boolean }
): Promise<PostResult> => {
  return fetchApi('fullpost', { platform, topic, tone, style, captionLength, avatars });
};

export const generateProductPost = async (platform: Platform, topic: string, uploadedImage: string): Promise<PostResult> => {
  return fetchApi('productpost', { platform, topic, uploadedImage });
};

export const generateGraphicDesign = async (topic: string, style: DesignStyle, userName: string, uploadedImage: string | null): Promise<PostResult> => {
  return fetchApi('graphic', { topic, style, userName, uploadedImage });
};

export const generateTextToSpeech = async (text: string, voice: VoiceName, tone: VoiceTone): Promise<string> => {
  const data = await fetchApi('tts', { text, voice, tone });
  if (!data.audioData) throw new Error("TTS failed");
  
  if (data.audioData.startsWith('data:audio/mp3;base64,')) {
    return data.audioData;
  }

  // Convert base64 data URI to Blob URL for audio playback (PCM)
  const base64 = data.audioData.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i=0; i<bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const int16Array = new Int16Array(bytes.buffer);
  const lamejs = (window as any).lamejs;
  const mp3encoder = new lamejs.Mp3Encoder(1, 24000, 128); // mono, 24kHz, 128kbps
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

  const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
  return URL.createObjectURL(mp3Blob);
};

export const generateStrategy = async (niche: string, platform: Platform): Promise<StrategyPlan> => {
  return fetchApi('strategy', { niche, platform });
};

export const analyzeTargetAudience = async (product: string, platform: Platform): Promise<TargetAudienceResult> => {
  return fetchApi('audience', { product, platform });
};

export const generateBirthdayWish = async (name: string, relationship: string, style: string): Promise<string> => {
  const data = await fetchApi('birthday', { name, relationship, style });
  return data.text;
};

export const generateVideoScript = async (topic: string, duration: ScriptDuration): Promise<ScriptStructure> => {
  return fetchApi('video', { topic, duration });
};

export const cloneVoice = async (name: string, audioBase64: string): Promise<string> => {
  const response = await fetch(`/api/elevenlabs/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, audioBase64 })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to clone voice");
  }
  const data = await response.json();
  return data.voice_id;
};

export const generateCustomVoiceTTS = async (text: string, voiceId: string): Promise<string> => {
  const response = await fetch(`/api/elevenlabs/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate TTS");
  }
  const data = await response.json();
  if (!data.audioData) throw new Error("TTS failed");
  
  if (data.audioData.startsWith('data:audio/mp3;base64,')) {
    return data.audioData;
  }
  return data.audioData;
};

export const generateAIVideo = async (prompt: string, provider: string, imageUrl?: string | null): Promise<any> => {
  const response = await fetch(`/api/video/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider, imageUrl })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to start video generation");
  }
  return await response.json();
};

export const checkVideoStatus = async (jobId: string, provider: string): Promise<any> => {
  const response = await fetch(`/api/video/status?jobId=${jobId}&provider=${provider}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to check video status");
  }
  return await response.json();
};


export interface PodcastSegment {
  speaker: 'Host 1' | 'Host 2';
  text: string;
}

export const generatePodcastScript = async (text: string, focus: string, length: 'short' | 'medium' | 'long', hosts: 1 | 2, fileData?: string, fileMime?: string): Promise<PodcastSegment[]> => {
  const data = await fetchApi('podcast-script', { text, focus, length, hosts, fileData, fileMime });
  return data;
};


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
