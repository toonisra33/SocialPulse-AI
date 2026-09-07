const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

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
    setPodcastAudioProgress(0);
    setPodcastAudioUrl(null);
    try {
      const audioBuffers: Int16Array[] = [];
      let totalLength = 0;
      
      for (let i = 0; i < podcastScript.length; i++) {
        const segment = podcastScript[i];
        setPodcastAudioProgress(Math.round(((i) / podcastScript.length) * 100));
        
        const voiceId = segment.speaker === 'Host 2' ? podcastVoice2 : podcastVoice1;
        const isCustom = customVoices.some(v => v.id === voiceId);
        
        let url = '';
        if (isCustom) {
           url = await generateCustomVoiceTTS(segment.text, voiceId);
        } else {
           url = await generateTextToSpeech(segment.text, voiceId as VoiceName, VoiceTone.NORMAL);
        }
        
        if (url.startsWith('data:audio/mp3;base64,')) {
           // We cannot easily combine MP3 buffers in client side without decoding.
           // However, if the server falls back to mp3, it will fail to concatenate cleanly. 
           // For MVP, we will just use the base64 data and decode it if we had a full decoder, 
           // but since our server sends raw PCM normally, it's fine. Wait, generateTextToSpeech 
           // converts it to MP3 blob url!
        }
      }
    } catch (e: any) {
      
    }
  };
`;
