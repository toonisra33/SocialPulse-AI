const fs = require('fs');
let code = fs.readFileSync('components/VideoAIGenerator.tsx', 'utf-8');

const oldHandleSelectPitch = `  const handleSelectPitch = async (pitch: any) => {
    setSelectedPitch(pitch);
    setIsLoading(true); setErrorMsg(null);
    try {
      const response = await fetch('/api/gemini/movie-characters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch })
      });
      if (!response.ok) throw new Error('Failed to generate characters');
      setCharacters(await response.json());
      setStep(4);
    } catch (e: any) { setErrorMsg(e.message); onError(e); } 
    finally { setIsLoading(false); }
  };`;

const newHandleSelectPitch = `  const handleSelectPitch = async (pitch: any) => {
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
  };`;

code = code.replace(oldHandleSelectPitch, newHandleSelectPitch);

const oldCharChange = `  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadCharId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacterFaces(prev => ({ ...prev, [activeUploadCharId]: reader.result as string }));
        setActiveUploadCharId(null);
      };
      reader.readAsDataURL(file);
    }
  };`;

const newCharChange = `  const [isRegeneratingChar, setIsRegeneratingChar] = useState<string | null>(null);

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
  };`;

code = code.replace(oldCharChange, newCharChange);

const oldCharUI = `{characterFaces[char.id] ? (
                    <div className="relative group rounded-2xl overflow-hidden h-32">
                       <img src={characterFaces[char.id]} alt={char.name} className="w-full h-full object-cover" />
                       <button onClick={() => handleFaceUploadClick(char.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">เปลี่ยนรูป</button>
                    </div>
                  ) : (
                    <button onClick={() => handleFaceUploadClick(char.id)} className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all">
                      <User size={24} className="mb-2" />
                      <span className="text-[10px] font-bold text-center px-1">ใส่ใบหน้าคุณ</span>
                    </button>
                  )}`;

const newCharUI = `{isRegeneratingChar === char.id ? (
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
                  )}`;

code = code.replace(oldCharUI, newCharUI);

fs.writeFileSync('components/VideoAIGenerator.tsx', code);
console.log('UI updated for auto char generation.');
