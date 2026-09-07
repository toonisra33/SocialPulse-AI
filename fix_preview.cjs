const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

const previewVoiceCode = `
  const handlePreviewVoice = async () => {
    try {
      const isCustom = customVoices.some(v => v.id === selectedVoice);
      const isFemale = VoiceDetails[selectedVoice as VoiceName]?.gender === 'Female';
      const voiceNameStr = isCustom ? customVoices.find(v => v.id === selectedVoice)?.name : VoiceDetails[selectedVoice as VoiceName]?.name || selectedVoice;
      
      const greeting = isFemale ? \`สวัสดีค่ะ ฉันชื่อ\${voiceNameStr}ค่ะ \` : \`สวัสดีครับ ผมชื่อ\${voiceNameStr}ครับ \`;
      const previewText = \`\${greeting}ระบบเว็บไซต์นี้สร้างขึ้นโดยคุณทูน อิศราวัฒน์ ขอบคุณที่สร้างเว็บไซต์ดีๆให้ใช้ ชอบกันไหมเอ่ย\`;
      
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
`;

const replacePreviewRegex = /const handlePreviewVoice = async \(\) => \{[\s\S]*?finally \{\s*setPreviewLoading\(false\);\s*\}\s*\};/;
code = code.replace(replacePreviewRegex, previewVoiceCode.trim());

fs.writeFileSync('components/VoiceStudio.tsx', code);
console.log('Fixed handlePreviewVoice');
