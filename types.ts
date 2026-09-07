
export enum Platform {
  FACEBOOK = 'Facebook',
  INSTAGRAM = 'Instagram',
  TWITTER = 'X (Twitter)',
  LINKEDIN = 'LinkedIn',
  TIKTOK = 'TikTok'
}

export enum ContentTone {
  PROFESSIONAL = 'Professional',
  FUNNY = 'Funny',
  INSPIRATIONAL = 'Inspirational',
  CASUAL = 'Casual',
  SALES = 'Sales/Promotional',
  EDUCATIONAL = 'Educational',
  EMOTIONAL = 'Emotional',
  WITTY = 'Witty/Sarcastic',
  LUXURY = 'Luxury/Elegant',
  URGENT = 'Urgent/Hype',
  STORYTELLING = 'Storytelling'
}

export enum DesignStyle {
  EDITORIAL = 'Editorial (Magazine)',
  BOLD = 'Bold (Attention)',
  MINIMAL = 'Minimal (Clean)',
  LUXURY = 'Luxury (Premium)'
}

export enum ScriptDuration {
  SHORT = 'Short Video (< 1 min)',
  MEDIUM = 'Medium Video (3 mins)',
  LONG = 'Long Video (10 mins)',
  LIVE = 'Live Stream (Deep Dive 55,000+ chars)'
}

export enum CaptionLength {
  SHORT = 'Short (< 350 chars)',
  MEDIUM = 'Medium (< 650 chars)',
  LONG = 'Long (> 1,200 chars)'
}

export enum VoiceTone {
  NORMAL = 'ปกติ (ธรรมชาติ)',
  AGGRESSIVE = 'ดุดัน (ทรงพลัง)',
  AUTHORITATIVE = 'ทรงอำนาจ (เด็ดขาด)',
  SARCASTIC = 'ประชดประชัน',
  WARM = 'อบอุ่นอ่อนโยน',
  FRIENDLY = 'เป็นมิตรนุ่มนวล',
  ANGRY = 'โกรธ (โมโห)'
}

export type VideoDuration = '8s' | '15s' | '30s';

export enum VoiceName {
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir',
  AOEDE = 'Aoede',
  LEDA = 'Leda',
  ORUS = 'Orus',
  CALLIRRHOE = 'Callirrhoe',
  SCHEDAR = 'Schedar',
  ENCELADUS = 'Enceladus',
  ALNILAM = 'Alnilam',
  UMBRIEL = 'Umbriel'
}

export const VoiceDetails = {
  [VoiceName.PUCK]: { name: 'Puck', gender: 'Male', description: 'เสียงผู้ชาย ขี้เล่น สนุกสนาน' },
  [VoiceName.CHARON]: { name: 'Charon', gender: 'Male', description: 'เสียงผู้ชาย สุขุม นุ่มลึก' },
  [VoiceName.KORE]: { name: 'Kore', gender: 'Female', description: 'เสียงผู้หญิง นุ่มนวล ชัดเจน' },
  [VoiceName.FENRIR]: { name: 'Fenrir', gender: 'Male', description: 'เสียงผู้ชาย ทรงพลัง น่าเกรงขาม' },
  [VoiceName.AOEDE]: { name: 'Aoede', gender: 'Female', description: 'เสียงผู้หญิง สดใส มีชีวิตชีวา' },
  [VoiceName.LEDA]: { name: 'Leda', gender: 'Female', description: 'เสียงผู้หญิง อบอุ่น เป็นทางการ' },
  [VoiceName.ORUS]: { name: 'Orus', gender: 'Male', description: 'เสียงผู้ชาย มั่นใจ เป็นธรรมชาติ' },
  [VoiceName.CALLIRRHOE]: { name: 'Callirrhoe', gender: 'Female', description: 'เสียงผู้หญิง นุ่มลึก มีเสน่ห์' },
  [VoiceName.SCHEDAR]: { name: 'Schedar', gender: 'Male', description: 'เสียงผู้ชาย นุ่มนวล ฟังสบาย' },
  [VoiceName.ENCELADUS]: { name: 'Enceladus', gender: 'Male', description: 'เสียงผู้ชาย หนักแน่น ชัดถ้อยชัดคำ' },
  [VoiceName.ALNILAM]: { name: 'Alnilam', gender: 'Male', description: 'เสียงผู้ชาย ดุดัน ทรงอำนาจ ส่งพลังขั้นสุด' },
  [VoiceName.UMBRIEL]: { name: 'Umbriel', gender: 'Female', description: 'เสียงผู้หญิง เด็ดขาด ทรงอำนาจ' }
};

export interface ScriptStructure {
  headline: string;
  hook: string;
  painPoint: string;
  body: string;
  cta: string;
}

export interface PostResult {
  caption: string;
  englishCaption?: string;
  headline: string;
  subheadline?: string;
  quote?: string; 
  author?: string; 
  features?: string[];
  imageData?: string; 
  videoUrl?: string; 
  audioUrl?: string;
  hashtags?: string[]; 
  script?: ScriptStructure; 
}

export interface PublishedPost {
  id: string;
  platform: Platform;
  content: PostResult;
  timestamp: Date;
  status: 'published' | 'scheduled';
}

export interface MetricData {
  name: string;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
}

export interface SocialAccount {
  platform: Platform;
  username: string;
  isConnected: boolean;
  avatar?: string;
  followers?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'facebook' | 'google';
  socialAccounts: SocialAccount[];
}

export interface Subscription {
  plan: 'monthly' | 'yearly';
  status: 'trial' | 'active' | 'expired';
  startDate: Date;
  endDate: Date;
}

export interface TargetAudienceResult {
    persona: {
        name: string;
        ageRange: string;
        gender: string;
        location: string;
        incomeLevel: string;
        relationshipStatus: string;
        occupation: string;
    };
    psychographics: {
        painPoints: string[];
        desires: string[];
        buyingTriggers: string[];
    };
    adTargeting: {
        interests: string[];
        behaviors: string[];
        lookalikeSource: string;
    };
    contentStrategy: {
      stage: 'Awareness' | 'Consideration' | 'Conversion';
      hook: string;
      description: string;
    }[];
}

export interface StrategyPlan {
  niche: string;
  goals: string[];
  weekPlan: {
    day: string;
    topic: string;
    format: string;
    engagementTip: string;
  }[];
}

export interface GhostFollower {
    id: string;
    name: string;
    lastActive: string;
    reason: string;
    avatar: string;
}

export enum VideoProvider {
  LUMA = 'luma',
  RUNWAY = 'runway'
}
