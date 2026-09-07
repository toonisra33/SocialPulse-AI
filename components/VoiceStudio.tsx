import React, { useState, useRef } from 'react';
import { Mic, Headphones, Play, Volume2, Download, Wand2, Upload, AlertCircle, Loader2, Settings, Key, UserPlus, FileAudio, CheckCircle2 } from 'lucide-react';
import { generateTextToSpeech, cloneVoice, generateCustomVoiceTTS, generatePodcastScript, generatePodcastAudio, PodcastSegment } from '../services/geminiService';
import { VoiceName, VoiceTone, VoiceDetails } from '../types';

interface VoiceStudioProps {
  user: any;
  onError: (e: any) => void;
}

const VoiceStudio: React.FC<VoiceStudioProps> = ({ user, onError }) => {

const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>(VoiceName.PUCK);
  const [voiceTone, setVoiceTone] = useState<VoiceTone>(VoiceTone.NORMAL);
  const [speed, setSpeed] = useState<number>(1.0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Voice Cloning State
  const [isCloning, setIsCloning] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string | null>(null);
  const [cloneAudioBase64, setCloneAudioBase64] = useState<string | null>(null);
  const cloneFileInputRef = useRef<HTMLInputElement>(null);
  
  const [customVoices, setCustomVoices] = useState<{id: string, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'tts' | 'clone' | 'podcast'>('tts');
  // Podcast State
  const [podcastText, setPodcastText] = useState('');
  const [podcastFocus, setPodcastFocus] = useState('');
  const [podcastLength, setPodcastLength] = useState<'short'|'medium'|'long'>('medium');
  const [podcastHosts, setPodcastHosts] = useState<1|2>(2);
  const [podcastVoice1, setPodcastVoice1] = useState<string>(VoiceName.CHARON);
  const [podcastVoice2, setPodcastVoice2] = useState<string>(VoiceName.KORE);
  const [podcastFile, setPodcastFile] = useState<File | null>(null);
  const [podcastFileData, setPodcastFileData] = useState<string | null>(null);
  const podcastFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [podcastScript, setPodcastScript] = useState<PodcastSegment[] | null>(null);
  
  const [isGeneratingPodcastAudio, setIsGeneratingPodcastAudio] = useState(false);
  const [podcastAudioProgress, setPodcastAudioProgress] = useState(0);
  const [podcastAudioUrl, setPodcastAudioUrl] = useState<string | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  
  const handlePodcastFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
        return;
      }
      setPodcastFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPodcastFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePodcastScript = async () => {
    if (!podcastText.trim() && !podcastFileData) {
      setErrorMsg("กรุณาใส่ข้อมูลเนื้อหา หรือแนบไฟล์เอกสาร");
      return;
    }
    setErrorMsg(null);
    setIsGeneratingPodcast(true);
    setPodcastScript(null);
    setPodcastAudioUrl(null);
    try {
      const script = await generatePodcastScript(
        podcastText, 
        podcastFocus, 
        podcastLength, 
        podcastHosts, 
        podcastFileData || undefined, 
        podcastFile?.type
      );
      setPodcastScript(script);
    } catch (e: any) {
      setErrorMsg(e.message || "เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล");
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const handleGeneratePodcastAudio = async () => {
    if (!podcastScript || podcastScript.length === 0) return;
    setErrorMsg(null);
    setIsGeneratingPodcastAudio(true);
    setPodcastAudioUrl(null);
    try {
      const voices = {
        'Host 1': podcastVoice1,
        'Host 2': podcastVoice2
      };
      const url = await generatePodcastAudio(podcastScript, voices);
      setPodcastAudioUrl(url);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "เกิดข้อผิดพลาดในการสร้างเสียง");
    } finally {
      setIsGeneratingPodcastAudio(false);
    }
  };

  const renderPodcastTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FileAudio size={16} className="text-purple-500" /> Podcast Setup
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                 จำนวนผู้ดำเนินรายการ
               </label>
               <div className="flex gap-2">
                 <button onClick={() => setPodcastHosts(1)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${podcastHosts === 1 ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>1 คน (บรรยาย)</button>
                 <button onClick={() => setPodcastHosts(2)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${podcastHosts === 2 ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>2 คน (สนทนา)</button>
               </div>
             </div>
             
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                 เสียง Host 1
               </label>
               <select value={podcastVoice1} onChange={(e) => setPodcastVoice1(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500">
                  {Object.values(VoiceName).map(v => (
                    <option key={v} value={v}>{VoiceDetails[v as VoiceName]?.name || v} - {VoiceDetails[v as VoiceName]?.gender}</option>
                  ))}
               </select>
             </div>
             
             {podcastHosts === 2 && (
               <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                   เสียง Host 2
                 </label>
                 <select value={podcastVoice2} onChange={(e) => setPodcastVoice2(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500">
                    {Object.values(VoiceName).map(v => (
                      <option key={v} value={v}>{VoiceDetails[v as VoiceName]?.name || v} - {VoiceDetails[v as VoiceName]?.gender}</option>
                    ))}
                 </select>
               </div>
             )}
          </div>
          
          <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                 ความยาว Podcast
               </label>
               <select value={podcastLength} onChange={(e: any) => setPodcastLength(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500">
                 <option value="short">แบบสั้น (Short) - เหมาะสำหรับสรุปใจความ</option>
                 <option value="medium">แบบกลาง (Medium) - พูดคุยทั่วไป</option>
                 <option value="long">แบบยาว (Long) - เจาะลึกรายละเอียด (Deep Dive)</option>
               </select>
             </div>
             
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                 แนวทางการวิเคราะห์ (เน้นเรื่องอะไร?)
               </label>
               <input 
                 type="text" 
                 value={podcastFocus}
                 onChange={e => setPodcastFocus(e.target.value)}
                 placeholder="เช่น เน้นวิเคราะห์เชิงธุรกิจ, เน้นเรื่องตลกขบขัน..."
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500"
               />
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
              <span>ข้อมูลต้นฉบับ (ข้อความ หรือ URL)</span>
            </label>
            <textarea 
              value={podcastText}
              onChange={e => setPodcastText(e.target.value)}
              placeholder="วางข้อความบทความ, ลิงก์เว็บไซต์, หรือ URL วิดีโอที่นี่..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-purple-500 resize-none h-32"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={podcastFileInputRef} 
              onChange={handlePodcastFileUpload}
              className="hidden"
              accept=".txt,.pdf,.csv,.doc,.docx"
            />
            <button 
              onClick={() => podcastFileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <Upload size={16} /> {podcastFile ? podcastFile.name : 'อัปโหลดเอกสาร (PDF, TXT)'}
            </button>
            {podcastFile && (
              <button onClick={() => { setPodcastFile(null); setPodcastFileData(null); }} className="text-xs text-red-500 font-bold hover:underline">
                นำออก
              </button>
            )}
          </div>
          
          <button 
            onClick={handleGeneratePodcastScript}
            disabled={isGeneratingPodcast || (!podcastText.trim() && !podcastFileData)}
            className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingPodcast ? (
              <><Loader2 size={18} className="animate-spin" /> กำลังวิเคราะห์ข้อมูลและเขียนสคริปต์...</>
            ) : (
              <><Wand2 size={18} /> วิเคราะห์ข้อมูล & เขียนสคริปต์ Podcast</>
            )}
          </button>
        </div>
      </div>
      
      {podcastScript && (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex justify-between items-center">
            <span className="flex items-center gap-2"><FileAudio size={16} className="text-purple-500" /> Podcast Script</span>
            <span className="text-xs text-gray-500 font-normal normal-case">{podcastScript.length} segments</span>
          </h3>
          
          <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {podcastScript.map((segment, idx) => (
              <div key={idx} className={`p-4 rounded-xl text-sm ${segment.speaker === 'Host 1' ? 'bg-purple-50 mr-8' : 'bg-blue-50 ml-8'}`}>
                <div className="font-bold mb-1 text-xs opacity-50 uppercase tracking-wider">{segment.speaker}</div>
                <div className="text-gray-800 leading-relaxed">{segment.text}</div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleGeneratePodcastAudio}
            disabled={isGeneratingPodcastAudio}
            className="w-full bg-purple-600 text-white p-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingPodcastAudio ? (
              <><Loader2 size={24} className="animate-spin" /> กำลังสังเคราะห์เสียง Podcast...</>
            ) : (
              <><Play size={24} /> สร้างเสียง Podcast (Audio)</>
            )}
          </button>
          
          {podcastAudioUrl && (
            <div className="mt-6 p-6 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col items-center gap-4 animate-fade-in">
              <CheckCircle2 size={40} className="text-green-500" />
              <h4 className="font-black text-purple-900 text-lg">สร้าง Podcast สำเร็จ!</h4>
              <audio src={podcastAudioUrl} controls className="w-full max-w-md" />
              <a 
                href={podcastAudioUrl} 
                download={`podcast-${Date.now()}.mp3`}
                className="flex items-center gap-2 text-sm font-bold text-purple-600 bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all border border-purple-100"
              >
                <Download size={16} /> ดาวน์โหลด MP3
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );


  const handlePreviewVoice = async () => {
    try {
      const isCustom = customVoices.some(v => v.id === selectedVoice);
      const isFemale = VoiceDetails[selectedVoice as VoiceName]?.gender === 'Female';
      const voiceNameStr = isCustom ? customVoices.find(v => v.id === selectedVoice)?.name : VoiceDetails[selectedVoice as VoiceName]?.name || selectedVoice;
      
      const greeting = isFemale ? `สวัสดีค่ะ ฉันชื่อ${voiceNameStr}ค่ะ ` : `สวัสดีครับ ผมชื่อ${voiceNameStr}ครับ `;
      const previewText = `${greeting}ระบบเว็บไซต์นี้สร้างขึ้นโดยคุณทูน อิศราวัฒน์ ขอบคุณที่สร้างเว็บไซต์ดีๆให้ใช้ ชอบกันไหมเอ่ย`;
      
      // Use Web Speech API for preview to save Gemini quota
      const utterance = new SpeechSynthesisUtterance(previewText);
      utterance.lang = 'th-TH';
      
      // Try to match gender using browser voices if possible
      const voices = window.speechSynthesis.getVoices();
      const thaiVoices = voices.filter(v => v.lang.includes('th'));
      if (thaiVoices.length > 0) {
          utterance.voice = thaiVoices[0]; // fallback to first Thai voice
      }
      
      utterance.rate = speed;
      window.speechSynthesis.cancel(); // cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
      
    } catch (e: any) {
      console.error(e);
      setErrorMsg("ไม่สามารถเล่นเสียงตัวอย่างได้ (อุปกรณ์ของคุณอาจไม่รองรับ Web Speech API)");
    }
  };

  const handleGenerateTTS = async () => {
    if (!text.trim()) {
      setErrorMsg("กรุณาป้อนข้อความที่ต้องการสร้างเสียง");
      return;
    }
    
    setErrorMsg(null);
    setIsGenerating(true);
    setAudioUrl(null);
    
    try {
      let url = "";
      const isCustom = customVoices.some(v => v.id === selectedVoice);
      
      if (isCustom) {
        url = await generateCustomVoiceTTS(text, selectedVoice);
      } else {
        url = await generateTextToSpeech(text, selectedVoice as VoiceName, voiceTone);
      }
      
      setAudioUrl(url);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ API");
      onError(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg("ขนาดไฟล์เสียงต้องไม่เกิน 10MB");
        return;
      }
      
      const url = URL.createObjectURL(file);
      setCloneAudioUrl(url);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        setCloneAudioBase64(base64);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloneVoice = async () => {
    if (!cloneName.trim() || !cloneAudioBase64) {
      setErrorMsg("กรุณาระบุชื่อเสียงและอัปโหลดไฟล์เสียงต้นแบบ");
      return;
    }
    
    setIsCloning(true);
    setErrorMsg(null);
    
    try {
      const newVoiceId = await cloneVoice(cloneName, cloneAudioBase64);
      const newVoice = { id: newVoiceId, name: cloneName };
      
      setCustomVoices(prev => [...prev, newVoice]);
      setSelectedVoice(newVoiceId);
      setActiveTab('tts');
      
      // Reset form
      setCloneName('');
      setCloneAudioUrl(null);
      setCloneAudioBase64(null);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "ไม่สามารถโคลนเสียงได้ โปรดลองอีกครั้ง");
      onError(e);
    } finally {
      setIsCloning(false);
    }
  };

  const handleDownload = async () => {
    if (!audioUrl) return;
    
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-ai-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading audio:", error);
      window.open(audioUrl, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200">
            <Mic size={28} />
          </div>
          Professional Voice Studio
        </h2>
        <p className="text-gray-500 mt-2 font-medium">สังเคราะห์เสียงพากย์คุณภาพสูง (Text-to-Speech) และระบบโคลนเสียงเสมือนจริงด้วย AI</p>
      </div>

      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
        <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-black text-orange-900">ข้อจำกัดการใช้งาน API (Free Tier)</h4>
          <p className="text-xs font-medium text-orange-800 mt-1 mb-2">โมเดลเสียง AI คุณภาพสูง (Gemini TTS) มีโควต้าให้ใช้งานฟรี <b>10 ครั้ง / วัน</b> หากโควต้าเต็มแล้ว ระบบจะสลับไปใช้เสียงสำรอง (Google Translate) อัตโนมัติ ซึ่งจะทำให้เสียงเป็นเสียงผู้หญิงหุ่นยนต์เหมือนกันหมด</p>
          <div className="mt-3 p-3 bg-white/60 rounded-xl border border-orange-100">
            <h5 className="text-xs font-bold text-orange-900 mb-1 flex items-center gap-1"><Key size={12}/> ต้องการใช้งานแบบไม่จำกัด? (Unlimited Quota)</h5>
            <p className="text-[11px] text-orange-800">
              คุณสามารถใช้งานแบบไม่จำกัดและปลดล็อคข้อจำกัด 10 ครั้ง/วัน ได้ โดยการอัปเกรดเป็น <a href="https://aistudio.google.com/app/settings" target="_blank" rel="noreferrer" className="underline font-bold text-blue-600 hover:text-blue-800">Gemini API แบบผูกบัตรเครดิต (Pay-as-you-go)</a><br/>
              เมื่อผูกบัตรและได้ API Key ใหม่มาแล้ว ให้นำมาใส่ในเมนู <b>Settings</b> ของโปรเจกต์นี้
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button 
          onClick={() => setActiveTab('tts')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shrink-0 ${activeTab === 'tts' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Headphones size={18} /> Text to Speech
        </button>
        <button 
          onClick={() => setActiveTab('clone')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shrink-0 ${activeTab === 'clone' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <UserPlus size={18} /> Clone Custom Voice
        </button>
        <button 
          onClick={() => setActiveTab('podcast')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shrink-0 ${activeTab === 'podcast' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FileAudio size={18} /> AI Podcast Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {activeTab === 'podcast' ? renderPodcastTab() : activeTab === 'tts' ? (
            <>
              {/* Voice Selection */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Wand2 size={16} className="text-purple-500" /> Voice Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Select Voice
                      </label>
                      <button 
                        onClick={handlePreviewVoice} 
                        disabled={previewLoading}
                        className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                      >
                        {previewLoading ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                        {previewLoading ? 'กำลังสร้าง...' : 'ฟังเสียงตัวอย่าง'}
                      </button>
                    </div>
                    <select 
                      value={selectedVoice} 
                      onChange={(e) => setSelectedVoice(e.target.value)} 
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-500 transition-colors cursor-pointer"
                    >
                      <optgroup label="System Voices (Premium)">
                        {Object.values(VoiceName).map(v => (
                          <option key={v} value={v}>
                            {VoiceDetails[v as VoiceName]?.name || v} - {VoiceDetails[v as VoiceName]?.gender === 'Female' ? 'Female' : 'Male'}
                          </option>
                        ))}
                      </optgroup>
                      {customVoices.length > 0 && (
                        <optgroup label="My Cloned Voices">
                          {customVoices.map(v => (
                            <option key={v.id} value={v.id}>🎤 {v.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {!customVoices.some(v => v.id === selectedVoice) && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between mb-2">
                        <span>Emotion / Tone</span>
                      </label>
                      <select 
                        value={voiceTone} 
                        onChange={(e) => setVoiceTone(e.target.value as VoiceTone)} 
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-500 transition-colors cursor-pointer"
                      >
                        {Object.values(VoiceTone).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between mb-2">
                      <span>Speed</span>
                      <span className="text-gray-600">{speed.toFixed(1)}x</span>
                    </label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                      <span>Slow</span>
                      <span>Fast</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <FileAudio size={16} className="text-purple-500" /> Script Text
                  </h3>
                  <span className={`text-xs font-bold ${text.length > 3000 ? 'text-red-500' : 'text-gray-400'}`}>
                    {text.length} / 3000
                  </span>
                </div>
                
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการให้ AI อ่านออกเสียง..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium resize-none h-48 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all placeholder:text-gray-400"
                />
              </div>

              <button
                onClick={handleGenerateTTS}
                disabled={isGenerating || !text.trim() || text.length > 3000}
                className="w-full py-5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black rounded-2xl shadow-xl shadow-purple-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
              >
                {isGenerating ? (
                  <><Loader2 size={24} className="animate-spin" /> Synthesizing...</>
                ) : (
                  <><Play size={24} className="fill-white" /> Generate Voice</>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Clone Voice Form */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UserPlus size={16} className="text-purple-500" /> Create Custom Voice
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Voice Name</label>
                    <input 
                      type="text" 
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      placeholder="เช่น เสียงพี่เอก, เสียงโฆษก, เสียงน้องเมย์"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Upload Reference Audio (Clean, No Music, &gt;30s)</label>
                    
                    {cloneAudioUrl ? (
                      <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50">
                         <audio src={cloneAudioUrl} controls className="w-full h-10 mb-3" />
                         <button 
                           onClick={() => { setCloneAudioUrl(null); setCloneAudioBase64(null); if(cloneFileInputRef.current) cloneFileInputRef.current.value = ''; }}
                           className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                         >
                           <AlertCircle size={14} /> Remove File
                         </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => cloneFileInputRef.current?.click()}
                        className="w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer bg-gray-50"
                      >
                        <Upload size={32} className="mb-3" />
                        <span className="text-sm font-bold text-gray-600 mb-1">Click to Upload Audio</span>
                        <span className="text-xs">MP3, WAV, WebM (Max 10MB)</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={cloneFileInputRef} 
                      accept="audio/*"
                      className="hidden" 
                      onChange={handleCloneUpload} 
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloneVoice}
                disabled={isCloning || !cloneName.trim() || !cloneAudioBase64}
                className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-gray-200 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
              >
                {isCloning ? (
                  <><Loader2 size={24} className="animate-spin" /> Cloning Voice...</>
                ) : (
                  <><UserPlus size={24} /> Train AI Voice</>
                )}
              </button>
            </>
          )}
          
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3 text-sm font-medium animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex-1 flex flex-col items-center justify-center min-h-[400px]">
            
            {audioUrl ? (
               // Completed View
               <div className="w-full max-w-md animate-fade-in text-center space-y-6">
                 <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                   <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-20"></div>
                   <Headphones size={48} className="text-purple-600" />
                 </div>
                 
                 <div>
                   <h3 className="text-xl font-black text-gray-900">Audio Ready</h3>
                   <p className="text-sm font-medium text-gray-500 mt-1">Generated with {customVoices.find(v => v.id === selectedVoice)?.name || (VoiceDetails[selectedVoice as VoiceName]?.name || selectedVoice)}</p>
                 </div>
                 
                 <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <audio src={audioUrl} controls autoPlay className="w-full custom-audio-player" />
                 </div>
                 
                 <button 
                   onClick={handleDownload} 
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                 >
                   <Download size={20} /> Download MP3
                 </button>
               </div>
            ) : isGenerating ? (
               // Loading View
               <div className="text-center animate-fade-in">
                 <div className="w-24 h-24 relative mx-auto mb-6">
                   <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Mic size={24} className="text-purple-600 animate-pulse" />
                   </div>
                 </div>
                 <h3 className="text-xl font-black text-gray-900 mb-2">Synthesizing Speech...</h3>
                 <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto">
                   ระบบกำลังประมวลผลข้อความและสังเคราะห์เป็นเสียงพูดเสมือนจริง อาจใช้เวลาสักครู่
                 </p>
               </div>
            ) : isCloning ? (
               <div className="text-center animate-fade-in">
                 <div className="w-24 h-24 relative mx-auto mb-6">
                   <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <UserPlus size={24} className="text-gray-900" />
                   </div>
                 </div>
                 <h3 className="text-xl font-black text-gray-900 mb-2">Training Custom Voice...</h3>
                 <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto">
                   ระบบกำลังวิเคราะห์และเรียนรู้จากไฟล์เสียงต้นฉบับของคุณ
                 </p>
               </div>
            ) : (
               // Empty State
               <div className="text-center text-gray-400 max-w-xs">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Mic size={40} className="text-gray-300" />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 mb-2">Voice Studio</h3>
                 <p className="text-sm font-medium leading-relaxed">
                   พิมพ์ข้อความ หรือโคลนเสียงต้นแบบของคุณ เพื่อสร้างเสียงพากย์เสมือนจริงที่สมบูรณ์แบบ
                 </p>
               </div>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default VoiceStudio;
