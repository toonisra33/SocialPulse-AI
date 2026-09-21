import React, { useState, useRef, useEffect } from 'react';
import { Film, Sparkles, Image as ImageIcon, Settings, Play, CheckCircle2, AlertCircle, Loader2, Download, Upload, Clock, RefreshCw, ChevronRight, User, Users, Clapperboard, Mic } from 'lucide-react';
import { generateAIVideo, checkVideoStatus } from '../services/geminiService';

interface VideoAIGeneratorProps {
  user: any;
  onError: (e: any) => void;
}

const VISUAL_STYLES = ['ภาพยนตร์สมจริง (Cinematic Realistic)', 'การ์ตูนอนิเมะ (Japanese Anime)', 'การ์ตูนดิสนีย์/พิกซาร์ (3D Disney/Pixar)', 'ไซเบอร์พังก์ (Cyberpunk)', 'สีน้ำ (Watercolor)', 'ดาร์กแฟนตาซี (Dark Fantasy)', 'ฟิล์มวินเทจ (Vintage Film)'];
const GENRES = ['ดราม่า (Drama)', 'แอ็กชั่น (Action)', 'ไซไฟ (Sci-Fi)', 'แฟนตาซี (Fantasy)', 'สยองขวัญ (Horror)', 'ตลก (Comedy)', 'ลึกลับสืบสวน (Mystery)', 'ซูเปอร์ฮีโร่ (Superhero)'];
const LENGTHS = ['ภาพยนตร์สั้น (ไม่เกิน 30 นาที)', 'ภาพยนตร์ขนาดกลาง (30-60 นาที)', 'ภาพยนตร์เต็มเรื่อง (120 นาทีขึ้นไป)'];

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const VideoAIGenerator: React.FC<VideoAIGeneratorProps> = ({ user, onError }) => {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1 & 2 State
  const [selectedStyle, setSelectedStyle] = useState(VISUAL_STYLES[0]);
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedLength, setSelectedLength] = useState(LENGTHS[0]);

  // Step 3 State (Pitches)
  const [pitches, setPitches] = useState<any[]>([]);
  const [selectedPitch, setSelectedPitch] = useState<any | null>(null);

  // Step 4 State (Characters)
  const [characters, setCharacters] = useState<any[]>([]);
  // Store uploaded faces mapped to character IDs { "c1": "data:image...", "c2": "..." }
  const [characterFaces, setCharacterFaces] = useState<Record<string, string>>({}); 

  // Step 5 State (Scenes)
  const [scenes, setScenes] = useState<any[]>([]);
  
  // Step 6 State (Video Generation per scene)
  // Store duration preferences per scene { "s1": "10s", "s2": "5s" }
  const [sceneDurations, setSceneDurations] = useState<Record<string, string>>({});
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [sceneProgress, setSceneProgress] = useState<Record<string, { status: string, progress: number, videoUrl: string | null, audioUrl: string | null }>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadCharId, setActiveUploadCharId] = useState<string | null>(null);

  // Polling for video generation
  useEffect(() => {
    let interval: any;
    const activeGenId = Object.keys(sceneProgress).find(id => 
      sceneProgress[id]?.status === 'processing' || sceneProgress[id]?.status === 'in_queue'
    );

    if (activeGenId && generatingSceneId) { // Check generatingSceneId to know which job we are tracking
      interval = setInterval(async () => {
        try {
          // Assume the API returns jobId in the progress state temporarily (we will structure it properly)
          const currentJobId = sceneProgress[activeGenId]?.status === 'processing' ? generatingSceneId : null;
          
          if (currentJobId) {
             const statusRes = await checkVideoStatus(currentJobId, 'luma');
             if (statusRes.status === 'completed') {
                setSceneProgress(prev => ({
                  ...prev,
                  [activeGenId]: { ...prev[activeGenId], status: 'completed', progress: 100, videoUrl: statusRes.videoUrl || null }
                }));
                setGeneratingSceneId(null);
                
                // --- Step 7 Auto Voiceover Trigger (Simulated for this flow) ---
                simulateVoiceGeneration(activeGenId);

             } else if (statusRes.status === 'failed') {
                setSceneProgress(prev => ({
                  ...prev,
                  [activeGenId]: { ...prev[activeGenId], status: 'failed', progress: 0 }
                }));
                setGeneratingSceneId(null);
             } else {
                setSceneProgress(prev => ({
                  ...prev,
                  [activeGenId]: { ...prev[activeGenId], status: statusRes.status, progress: statusRes.progress || (prev[activeGenId].progress + 5) }
                }));
             }
          }
        } catch (e) { console.error(e); }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [sceneProgress, generatingSceneId]);

  const simulateVoiceGeneration = (sceneId: string) => {
      // In a real app, you'd call ElevenLabs or TTS here based on the scene's dialog and emotion
      setTimeout(() => {
        setSceneProgress(prev => ({
           ...prev,
           [sceneId]: { 
             ...prev[sceneId], 
             audioUrl: 'mock_audio_generated' // Marker that audio is done
           }
        }));
      }, 3000);
  }


  // --- Actions ---

  const handleGeneratePitches = async () => {
    setIsLoading(true); setErrorMsg(null);
    try {
      const response = await fetch('/api/gemini/movie-pitches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: selectedStyle, genre: selectedGenre, length: selectedLength })
      });
      if (!response.ok) throw new Error('Failed to generate pitches');
      setPitches(await response.json());
      setStep(3);
    } catch (e: any) { setErrorMsg(e.message); onError(e); } 
    finally { setIsLoading(false); }
  };

  const handleSelectPitch = async (pitch: any) => {
    setSelectedPitch(pitch);
    setIsLoading(true); setErrorMsg(null);
    try {
      const response = await fetch('/api/gemini/movie-characters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch, style: selectedStyle })
      });
      if (!response.ok) throw new Error('Failed to generate characters');
      
      const chars = await response.json();
      setCharacters(chars);
      
      // Auto-populate characterFaces with the generated images
      const initialFaces: Record<string, string> = {};
      chars.forEach((c: any) => {
         if (c.imageUrl) initialFaces[c.id] = c.imageUrl;
      });
      setCharacterFaces(initialFaces);
      
      setStep(4);
    } catch (e: any) { setErrorMsg(e.message); onError(e); } 
    finally { setIsLoading(false); }
  };

  const handleFaceUploadClick = (charId: string) => {
    setActiveUploadCharId(charId);
    fileInputRef.current?.click();
  };

  const [isRegeneratingChar, setIsRegeneratingChar] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadCharId) {
      const currentId = activeUploadCharId;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const uploadedFace = reader.result as string;
        
        // Show loading state for this character
        setIsRegeneratingChar(currentId);
        setActiveUploadCharId(null);
        
        try {
           const char = characters.find(c => c.id === currentId);
           const response = await fetch('/api/gemini/movie-character-regen', {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ char, style: selectedStyle, uploadedFace })
           });
           const data = await response.json();
           if (data.imageUrl) {
              setCharacterFaces(prev => ({ ...prev, [currentId]: data.imageUrl }));
           }
        } catch(e) {
           console.error("Failed to regenerate face", e);
        } finally {
           setIsRegeneratingChar(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateScenes = async () => {
    setIsLoading(true); setErrorMsg(null);
    try {
      const response = await fetch('/api/gemini/movie-scenes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch: selectedPitch, characters })
      });
      if (!response.ok) throw new Error('Failed to generate scenes');
      const data = await response.json();
      setScenes(data);
      // Initialize default duration for all scenes
      const initialDurations: Record<string, string> = {};
      data.forEach((s: any) => initialDurations[s.id] = '5s');
      setSceneDurations(initialDurations);
      setStep(5);
    } catch (e: any) { setErrorMsg(e.message); onError(e); } 
    finally { setIsLoading(false); }
  };

  const handleGenerateSceneVideo = async (scene: any) => {
    setErrorMsg(null);
    
    // Set UI to processing immediately
    setSceneProgress(prev => ({
      ...prev,
      [scene.id]: { status: 'processing', progress: 0, videoUrl: null, audioUrl: null }
    }));

    try {
      // Find character face if speaking character is present in scene
      let faceImage = null;
      if (scene.speakingCharacterId && characterFaces[scene.speakingCharacterId]) {
         faceImage = characterFaces[scene.speakingCharacterId];
      }

      const prompt = `Movie Scene. Style: ${selectedStyle}. ${scene.location}. ${scene.action}. Emotion: ${scene.emotion}. ${faceImage ? 'CONSISTENT FACE REQUIRED.' : ''} --duration ${sceneDurations[scene.id]}`;
      
      const videoRes = await generateAIVideo(prompt, 'luma', faceImage);
      
      // Store the job ID to be picked up by the polling useEffect
      setGeneratingSceneId(videoRes.jobId); 

    } catch (e: any) {
      console.error(e);
      setSceneProgress(prev => ({
        ...prev,
        [scene.id]: { status: 'failed', progress: 0, videoUrl: null, audioUrl: null }
      }));
      setErrorMsg(`Scene ${scene.sceneNumber}: ` + (e.message || "เกิดข้อผิดพลาดในการสร้างวิดีโอ"));
    }
  };

  // --- UI Renderers ---

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 hide-scrollbar">
      {[
        { n: 1, label: 'รูปแบบ' }, { n: 2, label: 'ความยาว' }, { n: 3, label: 'พล็อตเรื่อง' },
        { n: 4, label: 'ตัวละคร' }, { n: 5, label: 'ฉาก' }, { n: 6, label: 'สร้างวิดีโอ' }, { n: 7, label: 'ประกอบเสียง' }
      ].map((s, idx) => (
        <React.Fragment key={s.n}>
          <div className={`flex flex-col items-center min-w-[60px] ${step >= s.n ? 'text-purple-600' : 'text-gray-300'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-1 ${step >= s.n ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-100'}`}>
              {step > s.n ? <CheckCircle2 size={16} /> : s.n}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
          </div>
          {idx < 6 && <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.n ? 'bg-purple-600' : 'bg-gray-100'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white">
          <Clapperboard size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Movie Studio</h2>
          <p className="text-gray-500 font-medium mt-1">สร้างภาพยนตร์ครบวงจรตั้งแต่พล็อตเรื่องไปจนถึงเสียงพากย์</p>
        </div>
      </div>

      <StepIndicator />

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-bold text-sm">{errorMsg}</span>
        </div>
      )}

      {/* STEP 1 & 2: Setup */}
      {(step === 1 || step === 2) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="text-purple-500" size={20} /> 1. รูปแบบและแนวภาพยนตร์
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">รูปแบบภาพ (Visual Style)</label>
                  <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-500">
                    {VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">แนวภาพยนตร์ (Genre)</label>
                  <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-purple-500">
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="text-blue-500" size={20} /> 2. ความยาวเนื้อเรื่อง
                </h3>
                <div className="space-y-3">
                  {LENGTHS.map(len => (
                    <button 
                      key={len} onClick={() => setSelectedLength(len)}
                      className={`w-full p-4 text-left font-bold rounded-2xl border transition-all ${selectedLength === len ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleGeneratePitches} disabled={isLoading} className="mt-6 w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg hover:bg-purple-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                ต่อไป: ให้ AI คิดพล็อตเรื่อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Pitches */}
      {step === 3 && (
         <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-900">3. เลือกพล็อตเรื่องภาพยนตร์</h3>
                <p className="text-sm text-gray-500">เลือกเนื้อเรื่องที่คุณสนใจมากที่สุด AI จะนำไปขยายผลต่อ</p>
              </div>
              <button onClick={handleGeneratePitches} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50 text-sm">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} สร้างชุดใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pitches.map((pitch, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                  <h4 className="text-lg font-black text-purple-700 mb-3 leading-tight">{pitch.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{pitch.synopsis}</p>
                  <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                    <strong className="text-xs text-gray-900 block mb-1">บทสรุปตอนจบ:</strong>
                    <p className="text-xs text-gray-500">{pitch.ending}</p>
                  </div>
                  <button onClick={() => handleSelectPitch(pitch)} disabled={isLoading} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
                    เลือกเรื่องนี้
                  </button>
                </div>
              ))}
            </div>
         </div>
      )}

      {/* STEP 4: Characters */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900">4. สร้างและจัดการตัวละคร</h3>
              <p className="text-sm text-gray-500">คุณสามารถอัปโหลดใบหน้าของคุณเข้าไปแทนที่ตัวละครที่ต้องการได้</p>
            </div>
            <button onClick={handleGenerateScenes} disabled={isLoading} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={18}/> : null} ยืนยันและสร้างฉากต่อไป <ChevronRight size={18}/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map(char => (
              <div key={char.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4">
                <div className="w-24 shrink-0">
                  {isRegeneratingChar === char.id ? (
                    <div className="w-full h-32 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-purple-500">
                       <Loader2 className="animate-spin mb-2" size={24} />
                       <span className="text-[10px] font-bold">กำลังสร้าง...</span>
                    </div>
                  ) : characterFaces[char.id] ? (
                    <div className="relative group rounded-2xl overflow-hidden h-32 bg-gray-100">
                       <img src={characterFaces[char.id]} alt={char.name} className="w-full h-full object-cover" />
                       <button onClick={() => handleFaceUploadClick(char.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">เปลี่ยนรูป</button>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                       <User size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-gray-900">{char.name}</h4>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{char.role}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{char.description}</p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 inline-flex px-2 py-1 rounded-lg border border-gray-100">
                    <Mic size={12} /> เสียง: {char.voiceStyle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5, 6, 7: Scenes, Generation & Audio */}
      {(step === 5 || step === 6 || step === 7) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedPitch?.title}</h3>
              <p className="text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">{selectedPitch?.synopsis}</p>

              <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Film className="text-blue-500" size={20} /> 5-7. รายละเอียดฉาก & สร้างวิดีโอ (Scene Generation)
              </h4>
              
              <div className="space-y-8">
                {scenes.map(scene => {
                  const sProg = sceneProgress[scene.id];
                  const char = characters.find(c => c.id === scene.speakingCharacterId);
                  
                  return (
                    <div key={scene.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-gray-900 text-white font-black px-3 py-1 rounded-xl text-xs">ซีนที่ {scene.sceneNumber}</span>
                            <span className="font-bold text-gray-900 text-lg">{scene.location}</span>
                          </div>
                          <p className="text-sm text-gray-600"><strong className="text-gray-900">Action:</strong> {scene.action}</p>
                        </div>
                        
                        {/* Generation Controls for this Scene */}
                        {!sProg?.videoUrl && sProg?.status !== 'processing' && (
                          <div className="shrink-0 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
                             <select 
                               value={sceneDurations[scene.id]} 
                               onChange={e => setSceneDurations(prev => ({...prev, [scene.id]: e.target.value}))}
                               className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
                             >
                               <option value="5s">5 วินาที</option>
                               <option value="10s">10 วินาที</option>
                             </select>
                             <button 
                               onClick={() => handleGenerateSceneVideo(scene)}
                               disabled={!!generatingSceneId}
                               className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                             >
                               <Play size={14} /> สร้างซีนนี้
                             </button>
                          </div>
                        )}
                      </div>

                      {/* Dialog Section */}
                      {scene.dialog !== "None" && (
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 mt-4 relative overflow-hidden">
                           {sProg?.audioUrl && (
                              <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                <CheckCircle2 size={12}/> เสียงพากย์พร้อมแล้ว
                              </div>
                           )}
                           <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                             {char && characterFaces[char.id] ? (
                               <img src={characterFaces[char.id]} className="w-full h-full object-cover"/>
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20}/></div>
                             )}
                           </div>
                           <div>
                             <span className="font-black text-gray-900 text-sm block mb-1">{char?.name || 'Unknown'} <span className="text-xs text-gray-400 font-normal ml-2">(อารมณ์: {scene.emotion})</span></span>
                             <p className="text-gray-700 text-sm font-medium italic">"{scene.dialog}"</p>
                           </div>
                        </div>
                      )}

                      {/* Video Progress & Result */}
                      {sProg && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {sProg.status === 'processing' || sProg.status === 'in_queue' ? (
                            <div className="space-y-3">
                              <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>กำลังเรนเดอร์วิดีโอ (ซีน {scene.sceneNumber})...</span>
                                <span>{Math.round(sProg.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full transition-all duration-500" style={{width: `${sProg.progress}%`}}></div>
                              </div>
                            </div>
                          ) : sProg.videoUrl ? (
                            <div className="flex flex-col items-center">
                              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative">
                                <video src={sProg.videoUrl} controls loop className="w-full h-full object-cover" />
                                {sProg.audioUrl && (
                                   <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-purple-900 text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-2">
                                      <Mic size={14} className="text-purple-600" /> ผสมเสียงพากย์ 100% แล้ว
                                   </div>
                                )}
                              </div>
                              <button className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"><Download size={16}/> ดาวน์โหลดซีนนี้</button>
                            </div>
                          ) : sProg.status === 'failed' ? (
                             <div className="text-red-500 text-sm font-bold text-center">เกิดข้อผิดพลาดในการสร้างวิดีโอซีนนี้</div>
                          ) : null}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default VideoAIGenerator;
