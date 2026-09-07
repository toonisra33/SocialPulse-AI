import React, { useState, useRef, useEffect } from 'react';
import { Film, Sparkles, Image as ImageIcon, Settings, Play, CheckCircle2, AlertCircle, Loader2, Download, Upload, Clock, Check, X } from 'lucide-react';
import { generateAIVideo, checkVideoStatus } from '../services/geminiService';

interface VideoAIGeneratorProps {
  user: any;
  onError: (e: any) => void;
}

const VideoAIGenerator: React.FC<VideoAIGeneratorProps> = ({ user, onError }) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'luma' | 'runway' | 'omni_flash' | 'seedance'>('luma');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ status: string, progress: number, url: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [motionLevel, setMotionLevel] = useState('5');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (jobId && progress?.status !== 'completed' && progress?.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const statusRes = await checkVideoStatus(jobId, provider);
          if (statusRes.status === 'completed') {
            setProgress({ status: 'completed', progress: 100, url: statusRes.videoUrl });
            setIsGenerating(false);
            clearInterval(interval);
          } else if (statusRes.status === 'failed') {
            setProgress({ status: 'failed', progress: 0, url: null });
            setErrorMsg("สร้างวิดีโอไม่สำเร็จ (API Error)");
            setIsGenerating(false);
            clearInterval(interval);
          } else {
            setProgress({ status: 'processing', progress: statusRes.progress || 50, url: null });
          }
        } catch (e: any) {
          console.error("Status check error:", e);
          onError(e);
        }
      }, 5000);
    }
    
    return () => clearInterval(interval);
  }, [jobId, progress?.status, provider, onError]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("ขนาดไฟล์ภาพต้องไม่เกิน 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg("กรุณาป้อน Prompt สำหรับสร้างวิดีโอ");
      return;
    }
    
    setErrorMsg(null);
    setIsGenerating(true);
    setJobId(null);
    setProgress(null);
    
    try {
      // Create a comprehensive prompt using the advanced settings
      const finalPrompt = `${prompt}, Aspect Ratio: ${aspectRatio}, Motion Level: ${motionLevel}/10, High Quality, Cinematic`;
      
      const videoRes = await generateAIVideo(finalPrompt, provider, uploadedImage);
      setJobId(videoRes.jobId);
      setProgress({ status: 'processing', progress: 0, url: null });
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ API");
      setIsGenerating(false);
      onError(e);
    }
  };

  const handleDownload = async () => {
    if (!progress?.url) return;
    
    try {
        const response = await fetch(progress.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${provider}-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading video:", error);
        window.open(progress.url, '_blank');
    }
  };

  const providers = [
    { id: 'luma', name: 'Luma Dream Machine', tag: 'คุณภาพสูง', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
    { id: 'runway', name: 'Runway Gen-3', tag: 'เสมือนจริง', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { id: 'omni_flash', name: 'Omni Flash', tag: 'รวดเร็ว', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    { id: 'seedance', name: 'Seedance 2.5', tag: 'สมจริงขั้นสุด', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
            <Film size={28} />
          </div>
          Professional Video AI
        </h2>
        <p className="text-gray-500 mt-2 font-medium">สร้างวิดีโอคุณภาพสูงระดับภาพยนตร์ด้วย AI หลากหลายโมเดล (Text-to-Video & Image-to-Video)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Provider Selection */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" /> Choose AI Engine
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {providers.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${
                    provider === p.id 
                    ? `${p.bg} ${p.border} ${p.text} shadow-md` 
                    : 'border-gray-100 bg-white hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm leading-tight">{p.name}</span>
                    {provider === p.id && <CheckCircle2 size={16} className={p.text} />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider opacity-70`}>{p.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt & Reference Image */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
             <div className="flex justify-between items-end mb-4">
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <Film size={16} className="text-blue-500" /> Scene Description
               </h3>
               <span className="text-xs text-gray-400 font-bold">{prompt.length} chars</span>
             </div>
             
             <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="อธิบายฉากที่คุณต้องการ เช่น 'A cinematic drone shot flying over a futuristic city at sunset, neon lights glowing...'"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium resize-none h-32 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400 mb-4"
             />

             <div className="space-y-3">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image Reference (Optional)</label>
               {uploadedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                    <img src={uploadedImage} alt="Reference" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button 
                        onClick={() => setUploadedImage(null)}
                        className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
               ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs font-bold">Upload Image (Max 5MB)</span>
                  </div>
               )}
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden" 
                  onChange={handleImageUpload} 
               />
             </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings size={16} className="text-blue-500" /> Advanced Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between mb-2">
                  <span>Aspect Ratio</span>
                  <span className="text-gray-600">{aspectRatio}</span>
                </label>
                <div className="flex gap-2">
                  {['16:9', '9:16', '1:1', '4:3'].map(ratio => (
                    <button 
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${aspectRatio === ratio ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between mb-2">
                  <span>Motion Level</span>
                  <span className="text-gray-600">{motionLevel}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={motionLevel}
                  onChange={(e) => setMotionLevel(e.target.value)}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                  <span>Subtle</span>
                  <span>Dynamic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-5 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white font-black rounded-2xl shadow-xl shadow-gray-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
          >
            {isGenerating ? (
              <><Loader2 size={24} className="animate-spin" /> Generating...</>
            ) : (
              <><Play size={24} className="fill-white" /> Generate Video</>
            )}
          </button>
          
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3 text-sm font-medium">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

        </div>

        {/* Right Column: Preview & Output */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[600px]">
            
            {progress?.status === 'completed' && progress.url ? (
               // Completed View
               <div className="h-full flex flex-col animate-fade-in">
                 <div className="flex-1 rounded-[1.5rem] overflow-hidden bg-black relative flex items-center justify-center group">
                   <video 
                     src={progress.url} 
                     controls 
                     autoPlay
                     loop
                     className="w-full h-full object-contain"
                   />
                   
                   {/* Overlay Controls */}
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={handleDownload} className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-xl transition-all">
                        <Download size={20} />
                      </button>
                   </div>
                 </div>
                 
                 <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-full text-xs">
                        <CheckCircle2 size={16} /> Generation Complete
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase">
                        {providers.find(p => p.id === provider)?.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed italic border-l-2 border-gray-200 pl-4 py-1">
                      "{prompt}"
                    </p>
                    
                    <button onClick={handleDownload} className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                      <Download size={20} /> Download High-Res Video
                    </button>
                 </div>
               </div>
            ) : isGenerating ? (
               // Loading View
               <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                 <div className="w-24 h-24 mb-8 relative">
                   <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                   <div 
                     className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                     style={{ 
                       clipPath: progress?.progress 
                         ? `polygon(50% 50%, 50% 0%, ${progress.progress > 25 ? '100% 0%,' : ''} ${progress.progress > 50 ? '100% 100%,' : ''} ${progress.progress > 75 ? '0% 100%,' : ''} ${Math.min(100, progress.progress * 4)}% ${progress.progress > 25 ? '100%' : '0%'}) `
                         : 'none'
                     }}
                   ></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-xl font-black text-gray-900">{progress?.progress || 0}%</span>
                   </div>
                 </div>
                 
                 <h3 className="text-2xl font-black text-gray-900 mb-2">Rendering Masterpiece...</h3>
                 <p className="text-gray-500 font-medium max-w-sm mb-8">
                   กำลังใช้โมเดล <span className="text-blue-600 font-bold">{providers.find(p => p.id === provider)?.name}</span> สังเคราะห์วิดีโอคุณภาพสูง อาจใช้เวลา 1-3 นาที
                 </p>
                 
                 <div className="w-full max-w-md bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left">
                   <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                     <span>Process</span>
                     <span>Status</span>
                   </div>
                   <div className="space-y-3">
                     <div className="flex justify-between items-center text-sm font-medium">
                       <span className="flex items-center gap-2 text-gray-700"><CheckCircle2 size={16} className="text-green-500" /> Init Engine</span>
                       <span className="text-green-600 font-bold">Done</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-medium">
                       <span className="flex items-center gap-2 text-gray-700"><CheckCircle2 size={16} className="text-green-500" /> Prompt Analysis</span>
                       <span className="text-green-600 font-bold">Done</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-medium">
                       <span className="flex items-center gap-2 text-blue-700"><Loader2 size={16} className="text-blue-500 animate-spin" /> Synthesizing Frames</span>
                       <span className="text-blue-600 font-bold">Running</span>
                     </div>
                   </div>
                 </div>
               </div>
            ) : (
               // Empty State View
               <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                 <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                   <Film size={48} className="text-gray-300" />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 mb-2">No Video Preview</h3>
                 <p className="max-w-sm text-sm font-medium leading-relaxed">
                   กรอกรายละเอียดฉาก, เลือกรูปภาพอ้างอิง, และตั้งค่าทางซ้าย จากนั้นกดปุ่ม "Generate Video" เพื่อสร้างผลงาน
                 </p>
                 
                 <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md text-left">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <Sparkles size={20} className="text-blue-500 mb-2" />
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Text to Video</h4>
                      <p className="text-xs text-gray-500">สร้างจากข้อความบรรยาย</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <ImageIcon size={20} className="text-purple-500 mb-2" />
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Image to Video</h4>
                      <p className="text-xs text-gray-500">สร้างภาพเคลื่อนไหวจากรูป</p>
                    </div>
                 </div>
               </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default VideoAIGenerator;
