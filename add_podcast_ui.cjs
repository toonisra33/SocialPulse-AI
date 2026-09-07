const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

// Insert functions
const functionsCode = `
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
                 <button onClick={() => setPodcastHosts(1)} className={\`flex-1 py-3 rounded-xl font-bold text-sm transition-all \${podcastHosts === 1 ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}\`}>1 คน (บรรยาย)</button>
                 <button onClick={() => setPodcastHosts(2)} className={\`flex-1 py-3 rounded-xl font-bold text-sm transition-all \${podcastHosts === 2 ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}\`}>2 คน (สนทนา)</button>
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
              <div key={idx} className={\`p-4 rounded-xl text-sm \${segment.speaker === 'Host 1' ? 'bg-purple-50 mr-8' : 'bg-blue-50 ml-8'}\`}>
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
                download={\`podcast-\${Date.now()}.mp3\`}
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
`;

code = code.replace("const handlePreviewVoice = async () => {", functionsCode + "\n\n  const handlePreviewVoice = async () => {");

// Add Tab Button
const tabButtonsRegex = /<div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">[\s\S]*?<\/div>/;
const newTabButtons = `
      <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button 
          onClick={() => setActiveTab('tts')}
          className={\`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shrink-0 \${activeTab === 'tts' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}\`}
        >
          <Headphones size={18} /> Text to Speech
        </button>
        <button 
          onClick={() => setActiveTab('clone')}
          className={\`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shrink-0 \${activeTab === 'clone' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}\`}
        >
          <UserPlus size={18} /> Clone Custom Voice
        </button>
        <button 
          onClick={() => setActiveTab('podcast')}
          className={\`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shrink-0 \${activeTab === 'podcast' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}\`}
        >
          <FileAudio size={18} /> AI Podcast Analysis
        </button>
      </div>
`;
code = code.replace(tabButtonsRegex, newTabButtons.trim());

// Render conditional tabs
code = code.replace("{activeTab === 'tts' ? (", "{activeTab === 'podcast' ? renderPodcastTab() : activeTab === 'tts' ? (");

fs.writeFileSync('components/VoiceStudio.tsx', code);
console.log('Patched UI for VoiceStudio');
