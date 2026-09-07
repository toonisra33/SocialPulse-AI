
import React, { useState, useRef } from 'react';
import { DesignStyle, PostResult, User, Platform, PublishedPost } from '../types';
import { generateGraphicDesign } from '../services/geminiService';
import { Palette, Rocket, Loader2, Upload, X, Copy, Download, Sparkles, User as UserIcon, Quote, Send, Wand2, Image as ImageIcon, FileText, Share2, AlertCircle, Key, Globe, RefreshCw } from 'lucide-react';

interface GraphicCreatorProps { 
  user: User | null; 
  userName?: string; 
  onPublish: (post: PublishedPost) => void;
  onError?: (e: any) => void;
}

const GraphicCreator: React.FC<GraphicCreatorProps> = ({ user, userName = "วิธีคิดทัศนคติ/คนสำเร็จ", onPublish, onError }) => {
  const [topic, setTopic] = useState('');
  const [style, setDesignStyle] = useState<DesignStyle>(DesignStyle.EDITORIAL);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [result, setResult] = useState<PostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<Platform | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [downloadingWithText, setDownloadingWithText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
    setLoading(true); setErrorMsg(''); setResult(null); setIsAuthError(false);
    try {
      const res = await generateGraphicDesign(topic, style, userName, uploadedImage);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      if (e.message === "ERROR_AUTH_PERMISSION_DENIED") {
        setErrorMsg("สิทธิ์การเข้าถึง API ถูกปฏิเสธ หรือไม่พบโมเดล (403/404) กรุณาเชื่อมต่อ API Key ใหม่ที่รองรับโมเดล Pro");
        setIsAuthError(true);
        if (onError) onError(e);
      } else {
        setErrorMsg(e.message || "เกิดข้อผิดพลาดในการสร้างกราฟิก กรุณาลองใหมีกครั้ง");
      }
    } finally { setLoading(false); }
  };

  const handlePublishClick = async (p: Platform) => {
    if (!result) return;
    setPublishing(p);
    await new Promise(resolve => setTimeout(resolve, 2500));
    const published: PublishedPost = { id: `graphic-${Date.now()}`, platform: p, content: result, timestamp: new Date(), status: 'published' };
    onPublish(published);
    setPublishing(null);
  };

  const downloadOriginalImage = () => {
      if (!result?.imageData) return;
      const link = document.createElement('a');
      link.download = `raw-image-${Date.now()}.png`;
      link.href = result.imageData;
      link.click();
  };

  const getWrappedLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(/(\s+)/);
    let lines = [];
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      let testLine = currentLine + words[n];
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lines.push(currentLine.trim());
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    return lines;
  };

  const downloadWithText = async () => {
    if (!result?.imageData || !result?.quote || !canvasRef.current) return;
    setDownloadingWithText(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = result.imageData;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

      let fontSize = Math.floor(canvas.width * 0.055);
      const maxWidth = canvas.width * 0.85; 
      const text = `"${result.quote}"`;
      
      ctx.font = `900 ${fontSize}px 'Kanit', sans-serif`;
      let lines = getWrappedLines(ctx, text, maxWidth);
      let lineHeight = fontSize * 1.35;
      let totalHeight = lines.length * lineHeight;

      while (totalHeight > canvas.height * 0.3 && fontSize > 16) {
          fontSize -= 2;
          ctx.font = `900 ${fontSize}px 'Kanit', sans-serif`;
          lines = getWrappedLines(ctx, text, maxWidth);
          lineHeight = fontSize * 1.35;
          totalHeight = lines.length * lineHeight;
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      ctx.lineWidth = Math.floor(fontSize * 0.22);
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 15;

      let currentY = (canvas.height * 0.65) - (totalHeight / 2);
      lines.forEach((line) => {
        ctx.strokeText(line, canvas.width / 2, currentY);
        ctx.fillText(line, canvas.width / 2, currentY);
        currentY += lineHeight;
      });

      ctx.shadowBlur = 0;
      const creditMain = "วิธีคิดทัศนคติ/คนสำเร็จ";
      const creditSub = "create by ทูน อิศราวัฒน์";
      
      const authorFontSize = Math.floor(canvas.width * 0.038);
      ctx.font = `800 ${authorFontSize}px 'Kanit', sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      ctx.lineWidth = Math.floor(authorFontSize * 0.2);

      const footerY = Math.min(currentY + (authorFontSize * 1.5), canvas.height - (authorFontSize * 2.5));
      ctx.strokeText(creditMain.toUpperCase(), canvas.width / 2, footerY);
      ctx.fillText(creditMain.toUpperCase(), canvas.width / 2, footerY);
      
      const subFontSize = Math.floor(canvas.width * 0.024);
      ctx.font = `400 ${subFontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2;
      
      const subY = footerY + (authorFontSize * 1.1);
      ctx.strokeText(creditSub, canvas.width / 2, subY);
      ctx.fillText(creditSub, canvas.width / 2, subY);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `success-mindset-g3-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadingWithText(false);
    };
  };

  const connectedPlatforms = user?.socialAccounts.filter(a => a.isConnected).map(a => a.platform) || [];

  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-y-auto scrollbar-hide pb-20">
      <canvas ref={canvasRef} className="hidden" />
      
      {publishing && (
          <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
              <div className="max-w-xs w-full bg-white rounded-[2.5rem] p-10 shadow-2xl animate-slide-down">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600 animate-pulse">
                      <Globe size={40} className="animate-spin duration-[3000ms]" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Sharing to {publishing}...</h3>
                  <p className="text-gray-500 text-xs font-medium">Pushing graphic content to your timeline.</p>
                  <div className="mt-8 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 animate-progress"></div>
                  </div>
              </div>
          </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Palette className="text-purple-600" size={28} /> Graphic Master Pro
        </h2>
        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Strict Identity • Canon EOS R5 Realism</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">คำสำคัญหรือไอเดีย (ToT/OlO/+)</label>
                <textarea 
                    value={topic} onChange={(e) => setTopic(e.target.value)}
                    placeholder="พิมพ์ไอเดียคำคม... AI จะใช้ Gemini 3.1 Pro เรียบเรียงให้สละสลวย"
                    className="w-full p-5 border border-gray-200 rounded-3xl h-32 focus:ring-4 focus:ring-purple-100 outline-none resize-none transition-all shadow-inner font-medium text-sm md:text-base"
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Design Style</label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(DesignStyle).map(s => (
                        <button 
                            key={s} 
                            onClick={() => setDesignStyle(s)}
                            className={`p-3 rounded-2xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${style === s ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100 scale-[1.02]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                        >
                            <ImageIcon size={14} /> {s.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="h-44 md:h-full min-h-[220px] border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-purple-400 transition-all">
            {uploadedImage ? (
                <div className="absolute inset-0">
                    <img src={uploadedImage} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => setUploadedImage(null)} className="bg-red-500 text-white rounded-full p-3 shadow-xl hover:scale-110 transition-transform flex items-center gap-2 font-bold text-xs">
                           <X size={18}/> เปลี่ยนรูป
                        </button>
                    </div>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center p-8 text-center w-full h-full justify-center">
                    <div className="p-5 bg-white rounded-2xl shadow-md mb-4 text-purple-500 group-hover:scale-110 transition-transform ring-4 ring-purple-50">
                        <UserIcon size={32} />
                    </div>
                    <span className="text-xs font-black text-gray-900 mb-1">อัปโหลดภาพบุคคล</span>
                    <span className="text-[10px] text-gray-400 font-medium">เพื่อความเหมือน 1 ล้านเปอร์เซ็นต์</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const f = e.target.files?.[0]; if (f) {
                            const r = new FileReader(); r.onload = (ev) => setUploadedImage(ev.target?.result as string); r.readAsDataURL(f);
                        }
                    }} />
                </label>
            )}
        </div>
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={loading || !topic} 
        className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-3xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex justify-center items-center gap-3 shadow-2xl shadow-purple-200 transition-all active:scale-[0.97] h-[72px]"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
        <span className="tracking-[0.1em] uppercase text-sm">{loading ? "Gemini 3.1 Pro Processing..." : "Generate Magic Graphic"}</span>
      </button>
      
      {errorMsg && (
          <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-4 animate-shake text-red-700 text-xs font-bold leading-relaxed">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0" /> {errorMsg}
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
        <div className="mt-12 border-t pt-12 animate-fade-in space-y-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col items-center">
                <div 
                    className="relative w-full max-w-[500px] aspect-square rounded-[3rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] bg-slate-100 border-8 border-white group"
                >
                    <img src={result.imageData} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/95 flex flex-col justify-end p-8 md:p-12">
                        <div className="relative mb-6">
                            <h3 
                                className="text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-2xl font-display text-center"
                                style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}
                            >
                                {result.quote}
                            </h3>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="h-1 w-12 bg-purple-500 rounded-full mb-3 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                            <p className="text-white font-black text-sm uppercase tracking-[0.2em] drop-shadow-md">วิธีคิดทัศนคติ/คนสำเร็จ</p>
                            <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.1em] mt-1">create by ทูน อิศราวัฒน์</p>
                        </div>
                    </div>
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-[500px]">
                    <button 
                        onClick={downloadWithText}
                        disabled={downloadingWithText}
                        className="flex-1 bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all hover:-translate-y-1"
                    >
                        {downloadingWithText ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />} 
                        ดาวน์โหลด (HD)
                    </button>
                    <button 
                        onClick={downloadOriginalImage}
                        className="flex-1 bg-white text-gray-900 border-2 border-gray-100 py-4 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-lg hover:bg-gray-50 transition-all hover:-translate-y-1"
                    >
                        <ImageIcon size={18} /> รูปภาพต้นฉบับ
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-8 bg-purple-50 rounded-[2.5rem] border border-purple-100">
                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Quick Publish</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {connectedPlatforms.length > 0 ? connectedPlatforms.map(p => (
                            <button 
                                key={p} 
                                onClick={() => handlePublishClick(p)}
                                className={`py-5 px-6 rounded-2xl font-black text-[10px] flex items-center justify-between gap-2 shadow-md transition-all hover:-translate-y-1 active:scale-95 text-white ${
                                    p === Platform.FACEBOOK ? 'bg-[#1877F2]' : 
                                    p === Platform.INSTAGRAM ? 'bg-gradient-to-r from-[#f09433] to-[#bc1888]' : 'bg-slate-800'
                                }`}
                            >
                                <span className="flex items-center gap-3"><Share2 size={18} /> Publish to {p}</span>
                                <Rocket size={16} className="opacity-40" />
                            </button>
                        )) : (
                            <div className="p-5 bg-white border border-purple-100 rounded-3xl flex items-center gap-3">
                                <AlertCircle size={20} className="text-purple-400" />
                                <p className="text-[10px] text-purple-700 font-bold uppercase tracking-tight">Connect accounts in Settings to publish graphics directly.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Design Meta</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400">Aspect Ratio</span>
                            <span className="text-[10px] font-black text-gray-900">1:1 (Square)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400">Resolution</span>
                            <span className="text-[10px] font-black text-gray-900">1024 x 1024 (1K)</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-[10px] font-bold text-gray-400">Rendering Engine</span>
                            <span className="text-[10px] font-black text-blue-600">Gemini 3.1 Flash Image</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphicCreator;
