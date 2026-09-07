const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

// Remove preGenerationStarted
code = code.replace(/let preGenerationStarted = false;\s*/g, '');

// Replace saveCachedPreview and useEffect
const cachingRegex = /\s*\/\/ Helper to save base64.*?preGenerate\(\);\s*\}, \[\]\);\s*/s;
code = code.replace(cachingRegex, '\n\n');

// Replace handlePreviewVoice
const previewVoiceCode = `
  const handlePreviewVoice = async () => {
    setPreviewLoading(true);
    try {
      const isCustom = customVoices.some(v => v.id === selectedVoice);
      
      if (!isCustom) {
        // System voices use pre-generated files from public directory
        const audio = new Audio(\`/previews/\${selectedVoice}.wav\`);
        await audio.play();
        setPreviewLoading(false);
        return;
      }

      // Custom voices still generate on-the-fly via API
      const voiceNameStr = customVoices.find(v => v.id === selectedVoice)?.name;
      const previewText = \`สวัสดีครับ ระบบเว็บไซต์นี้สร้างขึ้นโดยคุณทูน อิศราวัฒน์ ขอบคุณที่สร้างเว็บไซต์ดีๆให้ใช้ ชอบกันไหมเอ่ย\`;
      
      const url = await generateCustomVoiceTTS(previewText, selectedVoice);
      
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
console.log('Fixed VoiceStudio.tsx successfully');
