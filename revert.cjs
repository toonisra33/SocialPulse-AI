const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

const previewVoiceCode = `
  const handlePreviewVoice = async () => {
    setPreviewLoading(true);
    try {
      const isCustom = customVoices.some(v => v.id === selectedVoice);
      const isFemale = VoiceDetails[selectedVoice as VoiceName]?.gender === 'Female';
      const voiceNameStr = isCustom ? customVoices.find(v => v.id === selectedVoice)?.name : VoiceDetails[selectedVoice as VoiceName]?.name || selectedVoice;
      
      const greeting = isFemale ? \`สวัสดีค่ะ ฉันชื่อ\${voiceNameStr}ค่ะ \` : \`สวัสดีครับ ผมชื่อ\${voiceNameStr}ครับ \`;
      const previewText = \`\${greeting}ระบบเว็บไซต์นี้สร้างขึ้นโดยคุณทูน อิศราวัฒน์ ขอบคุณที่สร้างเว็บไซต์ดีๆให้ใช้ ชอบกันไหมเอ่ย\`;
      
      let url = '';
      if (isCustom) {
         url = await generateCustomVoiceTTS(previewText, selectedVoice);
      } else {
         url = await generateTextToSpeech(previewText, selectedVoice as VoiceName, VoiceTone.FRIENDLY);
      }
      
      if (url) {
        const audio = new Audio(url);
        audio.play();
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "ไม่สามารถสร้างเสียงตัวอย่างได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPreviewLoading(false);
    }
  };
`;

const replacePreviewRegex = /const handlePreviewVoice = async \(\) => \{[\s\S]*?finally \{\s*setPreviewLoading\(false\);\s*\}\s*\};/;
code = code.replace(replacePreviewRegex, previewVoiceCode.trim());

fs.writeFileSync('components/VoiceStudio.tsx', code);
console.log('Reverted VoiceStudio.tsx');
