
import React, { useState, useRef, useEffect } from 'react';
import { Platform, ContentTone, PostResult, DesignStyle, VoiceName, ScriptDuration, ScriptStructure, CaptionLength, VoiceTone, VoiceDetails, User, PublishedPost } from '../types';
import { generateFullPost, generateTextToSpeech, generateVideoScript, generateProductPost, cloneVoice, generateCustomVoiceTTS, generateAIVideo, checkVideoStatus } from '../services/geminiService';
import { Sparkles, Copy, Check, Loader2, Upload, X, Rocket, AlertCircle, FileText, Key, AlignLeft, Video, Tag, MessageSquareQuote, Image as ImageIcon, Mic, Play, Volume2, UserCircle, Heart, Share2, Globe, CheckCircle2, RefreshCw, Square } from 'lucide-react';

const CopyBlock = ({ label, text }: { label: string, text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative hover:border-blue-400 transition-all active:scale-[0.98]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{label}</span>
                <button onClick={handleCopy} className="p-2 -m-2 text-gray-400 hover:text-blue-600">
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            </div>
            <p className="text-gray-800 font-medium text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
    );
};

interface ContentGeneratorProps {
  user: User | null;
  masterAvatar1: string | null;
  masterAvatar2: string | null;
  onPublish: (post: PublishedPost) => void;
  onError?: (e: any) => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ user, masterAvatar1, masterAvatar2, onPublish, onError }) => {
  const [contentType, setContentType] = useState<'image' | 'tts' | 'script' | 'product'>('image');
  const [designStyle, setDesignStyle] = useState<DesignStyle>(DesignStyle.EDITORIAL);
  const [captionLength, setCaptionLength] = useState<CaptionLength>(CaptionLength.MEDIUM);
  const [scriptDuration, setScriptDuration] = useState<ScriptDuration>(ScriptDuration.SHORT);
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>(Platform.FACEBOOK);
  const [tone, setTone] = useState<ContentTone>(ContentTone.CASUAL);
  const [voiceTone, setVoiceTone] = useState<VoiceTone>(VoiceTone.FRIENDLY);
  const [selectedVoice, setSelectedVoice] = useState<string>(VoiceName.KORE);
  const [customVoices, setCustomVoices] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('customVoices');
    if (saved) setCustomVoices(JSON.parse(saved));
  }, []);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [result, setResult] = useState<PostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<Platform | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [downloadingWithText, setDownloadingWithText] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [videoProvider, setVideoProvider] = useState<'luma' | 'runway' | 'omni_flash' | 'seedance'>('luma');
  const [videoProgress, setVideoProgress] = useState<{ status: string, progress: number, url: string | null } | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (videoJobId && videoProgress?.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const statusRes = await checkVideoStatus(videoJobId, videoProvider);
          if (statusRes.status === 'completed') {
            setVideoProgress({ status: 'completed', progress: 100, url: statusRes.videoUrl });
            setResult({ headline: `AI Video (${videoProvider})`, subheadline: 'Generated Successfully', caption: topic, videoUrl: statusRes.videoUrl, hashtags: ["AIVideo", "ContentCreator", "Viral"] });
            setLoading(false);
            clearInterval(interval);
          } else if (statusRes.status === 'failed') {
            setVideoProgress({ status: 'failed', progress: 0, url: null });
            setErrorMsg("สร้างวิดีโอไม่สำเร็จ (API Error)");
            setLoading(false);
            clearInterval(interval);
          } else {
            setVideoProgress(prev => prev ? { ...prev, progress: statusRes.progress } : null);
          }
        } catch (e: any) {
          console.error(e);
          setErrorMsg(e.message || "เกิดข้อผิดพลาดในการตรวจสอบสถานะวิดีโอ");
          setLoading(false);
          clearInterval(interval);
        }
      }, 5000);
    }
    
    return () => clearInterval(interval);
  }, [videoJobId, videoProgress?.status, videoProvider, topic]);

  const handleGenerate = async () => {
    setLoading(true); setErrorMsg(''); setResult(null); setIsAuthError(false);
    try {
      if (contentType === 'image') {
        const useAvatar1 = topic.includes('(ToT)');
        const useAvatar2 = topic.includes('(OlO)');
        const isCouple = topic.includes('+');
        const avatars = { avatar1: useAvatar1 ? masterAvatar1 : null, avatar2: useAvatar2 ? masterAvatar2 : null, isCouple: isCouple };
        const res = await generateFullPost(platform, topic, tone, designStyle, captionLength, avatars);
        setResult(res);
      } else if (contentType === 'script') {
        const scriptRes = await generateVideoScript(topic, scriptDuration);
        setResult({ headline: scriptRes.headline, subheadline: `ความยาว: ${scriptDuration}`, caption: `Hook: ${scriptRes.hook}\n\nContent:\n${scriptRes.body}\n\nCTA: ${scriptRes.cta}`, script: scriptRes, hashtags: ["VideoScript", "Creator", "Viral", "SocialPulse", "VideoAI"] });
      } else if (contentType === 'product') {
        if (!uploadedImage) throw new Error("กรุณาอัปโหลดรูปภาพสินค้าก่อนเริ่มการโปรโมต");
        const res = await generateProductPost(platform, topic, uploadedImage);
        setResult(res);
      } else if (contentType === 'video') {
        const videoRes = await generateAIVideo(topic, videoProvider, uploadedImage);
        setVideoJobId(videoRes.jobId);
        setVideoProgress({ status: 'processing', progress: 0, url: null });
      }
    } catch (e: any) {
      console.error(e);
      if (e.message === "ERROR_AUTH_PERMISSION_DENIED") {
        setErrorMsg("สิทธิ์การเข้าถึง API ถูกปฏิเสธ (403/404) กรุณาเชื่อมต่อ API Key ใหม่อีกครั้ง");
        setIsAuthError(true);
        if (onError) onError(e);
      } else {
        setErrorMsg(e.message || "เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      if (contentType !== 'video') {
        setLoading(false);
      }
    }
  };

  const handlePublishClick = async (p: Platform) => {
    if (!result) return;
    setPublishing(p);
    await new Promise(resolve => setTimeout(resolve, 2500));
    const published: PublishedPost = { id: `post-${Date.now()}`, platform: p, content: result, timestamp: new Date(), status: 'published' };
    onPublish(published);
    setPublishing(null);
  };

  const downloadImageOnly = () => {
    if (!result?.imageData) return;
    const link = document.createElement('a');
    link.download = `image-${Date.now()}.png`;
    link.href = result.imageData;
    link.click();
  };

  const downloadWithText = async () => {
    if (!result?.imageData || !canvasRef.current) return;
    setDownloadingWithText(true);
    
    if (document.fonts) {
      await document.fonts.ready;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = result.imageData;
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);
      
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];

        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        
        let currentY = y - (lines.length - 1) * lineHeight;
        for (const l of lines) {
          context.fillText(l.trim(), x, currentY);
          currentY += lineHeight;
        }
      };

      ctx.fillStyle = "white"; 
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)"; 
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 4;
      
      const fontSize = Math.floor(canvas.width * 0.055);
      ctx.font = `800 ${fontSize}px 'Kanit', sans-serif`;
      
      const maxWidth = canvas.width * 0.85;
      const lineHeight = fontSize * 1.35;
      
      const textToDraw = result.quote || result.headline || result.caption || "";
      const hasSubtext = result.author || result.subheadline;
      const startY = hasSubtext ? canvas.height * 0.86 : canvas.height * 0.9;
      
      wrapText(ctx, textToDraw, canvas.width / 2, startY, maxWidth, lineHeight);
      
      if (hasSubtext) {
         ctx.font = `400 ${Math.floor(fontSize * 0.45)}px 'Inter', sans-serif`;
         ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
         ctx.shadowBlur = 8;
         ctx.fillText((result.author || result.subheadline || "").toUpperCase(), canvas.width / 2, canvas.height * 0.95);
      }
      
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`; link.href = dataUrl; link.click();
      setDownloadingWithText(false);
    };
  };

  const hasAvatar1 = topic.includes('(ToT)');
  const hasAvatar2 = topic.includes('(OlO)');
  const hasPlus = topic.includes('+');

  const connectedPlatforms = user?.socialAccounts.filter(a => a.isConnected).map(a => a.platform) || [];

  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-y-auto scrollbar-hide pb-20">
      <canvas ref={canvasRef} className="hidden" />
      
      {publishing && (
          <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
              <div className="max-w-xs w-full bg-white rounded-[2.5rem] p-10 shadow-2xl animate-slide-down">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 animate-pulse">
                      <Globe size={40} className="animate-spin duration-[3000ms]" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Publishing to {publishing}...</h3>
                  <p className="text-gray-500 text-xs font-medium">Syncing content and generating social tags. Please wait.</p>
                  <div className="mt-8 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 animate-progress"></div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={28} /> AI Content Studio
            </h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Consistency Character • Viral Strategy</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(['image', 'product', 'tts', 'script'] as const).map(type => (
                <button 
                  key={type} onClick={() => { setContentType(type); setResult(null); }} 
                  className={`px-6 py-3 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${contentType === type ? 'bg-white shadow-md text-blue-600' : 'text-gray-500'}`}
                >
                  {type === 'image' ? 'แคปชั่น AI' : type === 'tts' ? 'Voice' : type === 'script' ? 'Script' : type === 'product' ? 'Product' : type}
                </button>
            ))}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${(contentType === 'product' || contentType === 'video') ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6 mb-8`}>
        <div className="space-y-4">
            <div className="relative">
                <textarea 
                    value={topic} onChange={(e) => setTopic(e.target.value)}
                    placeholder={
                        contentType === 'video' ? "อธิบายวิดีโอที่คุณต้องการให้ AI สร้าง..." :
                        contentType === 'script' ? "หัวข้อวิดีโอที่คุณต้องการสคริปต์..." : 
                        contentType === 'product' ? "ข้อมูลสินค้าหรือโปรโมชั่น..." :
                        contentType === 'image' ? "พิมพ์หัวข้อ... (ใช้ (ToT) หรือ (OlO) เพื่อเรียกอวตารต้นแบบ)" :
                        "พิมพ์ข้อความที่ต้องการเปลี่ยนเป็นเสียงพูด..."
                    }
                    className="w-full p-5 border border-gray-200 rounded-3xl h-44 focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all shadow-inner font-medium text-sm md:text-base pr-12"
                />
                {contentType === 'image' && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {hasAvatar1 && <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm" title="ใช้อวตารภาพที่ 1"><UserCircle size={16} /></div>}
                        {hasAvatar2 && <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg shadow-sm" title="ใช้อวตารภาพที่ 2"><UserCircle size={16} /></div>}
                        {hasPlus && (hasAvatar1 || hasAvatar2) && <div className="p-1.5 bg-pink-100 text-pink-600 rounded-lg shadow-sm animate-pulse" title="ตีความเป็นคู่รัก"><Heart size={16} /></div>}
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contentType !== 'script' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Platform</label>
                        <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold h-[56px] outline-none">
                            {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                )}

                {contentType === 'image' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ความยาวแคปชั่น (Caption Length)</label>
                        <select value={captionLength} onChange={(e) => setCaptionLength(e.target.value as CaptionLength)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold h-[56px] outline-none">
                            {Object.values(CaptionLength).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                )}

                {contentType === 'script' && (
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ความยาวสคริปต์ (Script Duration)</label>
                        <select value={scriptDuration} onChange={(e) => setScriptDuration(e.target.value as ScriptDuration)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold h-[56px] outline-none">
                            {Object.values(ScriptDuration).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                )}

                {contentType === 'video' && (
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ผู้ให้บริการ AI Video (Video Provider)</label>
                        <select value={videoProvider} onChange={(e) => setVideoProvider(e.target.value as any)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold h-[56px] outline-none">
                            <option value="luma">Luma Dream Machine (คุณภาพสูง)</option>
                            <option value="runway">Runway Gen-3 (เสมือนจริง)</option>
                            <option value="omni_flash">Omni Flash (รวดเร็ว)</option>
                            <option value="seedance">Seedance 2.5 (สมจริง)</option>
                        </select>
                    </div>
                )}
            </div>
        </div>

        {(contentType === 'product' || contentType === 'video') && (
            <div className="h-44 md:h-full border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden active:bg-blue-100/20 transition-colors">
                {uploadedImage ? (
                    <div className="absolute inset-0">
                        <img src={uploadedImage} className="w-full h-full object-cover" />
                        <button onClick={() => setUploadedImage(null)} className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 shadow-xl"><X size={18}/></button>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center p-8 text-center w-full h-full justify-center">
                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 text-blue-500"><Upload size={28} /></div>
                        <span className="text-xs font-black text-gray-800">อัปโหลดรูปสินค้า</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const f = e.target.files?.[0]; if (f) {
                                const r = new FileReader(); r.onload = (ev) => setUploadedImage(ev.target?.result as string); r.readAsDataURL(f);
                            }
                        }} />
                    </label>
                )}
            </div>
        )}
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={loading || (contentType === 'product' && !uploadedImage) || !topic} 
        className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-3 shadow-2xl transition-all h-[64px]"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
        <span className="tracking-[0.1em] uppercase text-sm">
          {(loading && contentType === 'video' && videoProgress) ? `กำลังสร้างวิดีโอ (${videoProgress.progress}%)` : 'Generate AI Content'}
        </span>
      </button>

      {errorMsg && (
          <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-4 animate-shake text-red-700 text-xs font-bold">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" /> {errorMsg}
              </div>
              {isAuthError && (
                <button 
                  onClick={() => onError && onError({message: "ERROR_AUTH_PERMISSION_DENIED"})}
                  className="mt-2 w-full py-2 bg-orange-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw size={14} /> Re-verify API Connection
                </button>
              )}
          </div>
      )}

      {result && (
        <div className="mt-12 border-t pt-12 space-y-12 animate-fade-in pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                  {result.imageData ? (
                      <div className="space-y-4">
                          <div className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 border-8 border-white">
                              <img src={result.imageData} className="w-full h-auto object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 flex flex-col justify-end p-6">
                                  <h4 className="text-white font-black text-xl leading-tight mb-2">{result.headline}</h4>
                                  <p className="text-blue-300 text-[10px] font-black uppercase">Asian Character Focus</p>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button onClick={downloadWithText} disabled={downloadingWithText} className="bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-colors">
                                  {downloadingWithText ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} 
                                  พร้อมตัวอักษร
                              </button>
                              <button onClick={downloadImageOnly} className="bg-white text-gray-900 border py-4 px-6 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                  <ImageIcon size={16} /> รูปภาพเปล่า
                              </button>
                          </div>
                      </div>
                  ) : result.videoUrl ? (
                      <div className="space-y-4">
                          <div className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 border-8 border-white">
                              <video src={result.videoUrl} controls loop className="w-full h-auto object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 flex flex-col justify-end p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                  <h4 className="text-white font-black text-xl leading-tight mb-2">AI Video Ready</h4>
                              </div>
                          </div>
                          <a href={result.videoUrl} download="ai_video.mp4" target="_blank" rel="noreferrer" className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors">
                              <Upload size={16} className="rotate-180" /> ดาวน์โหลด MP4
                          </a>
                      </div>
                  ) : contentType === 'script' ? (
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl border-8 border-slate-800">
                          <>
                            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Video size={40} /></div>
                            <h4 className="text-white font-black text-xl">Script Generated</h4>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">{scriptDuration}</p>
                          </>
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                           {result.subheadline || contentType.toUpperCase()}
                        </div>
                    </div>
                  ) : null}
              </div>
              
              <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2rem] shadow-xl border-l-8 border-white/20">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Headline Suggestion</p>
                              <h4 className="text-2xl font-black text-white leading-tight">{result.subheadline || result.headline}</h4>
                          </div>
                          <div className="bg-white/10 px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase"><AlignLeft size={10} /> {contentType.toUpperCase()}</div>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Publish to Social Media</p>
                      <div className="grid grid-cols-2 gap-3">
                          {connectedPlatforms.length > 0 ? connectedPlatforms.map(p => (
                              <button 
                                key={p} 
                                onClick={() => handlePublishClick(p)}
                                className={`py-4 px-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 shadow-md transition-all hover:-translate-y-1 active:scale-95 text-white ${
                                    p === Platform.FACEBOOK ? 'bg-[#1877F2]' : 
                                    p === Platform.INSTAGRAM ? 'bg-gradient-to-r from-[#f09433] to-[#bc1888]' : 
                                    p === Platform.TIKTOK ? 'bg-black' : 'bg-slate-800'
                                }`}
                              >
                                  <Share2 size={16} /> Publish to {p}
                              </button>
                          )) : (
                              <div className="col-span-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                                  <AlertCircle size={18} className="text-gray-400" />
                                  <p className="text-[10px] text-gray-500 font-bold">No social accounts connected. Connect in Settings to enable direct posting.</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CopyBlock label="ก๊อปปี้หัวข้อหลัก" text={result.subheadline || result.headline} />
                      <CopyBlock label="ก๊อปปี้หัวข้อรอง" text={result.headline} />
                  </div>

                  {result.caption && <CopyBlock label={contentType === 'script' ? "Video Content Script" : "Viral Caption"} text={result.caption} />}
                  
                  {result.hashtags && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Recommended Hashtags (5)</p>
                      <div className="flex flex-wrap gap-2">
                          {result.hashtags.map((h, i) => (
                              <span key={i} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">#{h}</span>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContentGenerator;
