const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

// 1. Add module level variable
if (!code.includes('let preGenerationStarted = false;')) {
    code = code.replace(
        'interface VoiceStudioProps {',
        'let preGenerationStarted = false;\n\ninterface VoiceStudioProps {'
    );
}

// 2. Add the background generation logic inside the component
const useEffectRegex = /const VoiceStudio: React.FC<VoiceStudioProps> = \(\{ user, onError \}\) => \{/;
const cachingLogic = `
  // Helper to save base64 to localStorage
  const saveCachedPreview = async (voiceId: string, url: string) => {
    try {
      if (url.startsWith('data:')) {
        localStorage.setItem(\`voice_preview_\${voiceId}\`, url);
      } else if (url.startsWith('blob:')) {
        const blob = await fetch(url).then(r => r.blob());
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          try {
            localStorage.setItem(\`voice_preview_\${voiceId}\`, reader.result as string);
          } catch (e) {
            console.warn("Storage quota exceeded", e);
          }
        };
      }
    } catch (e) {
      console.warn("Error caching preview", e);
    }
  };

  // Background Pre-generation
  React.useEffect(() => {
    if (preGenerationStarted) return;
    preGenerationStarted = true;

    const preGenerate = async () => {
      const voices = Object.values(VoiceName);
      for (const v of voices) {
        if (!localStorage.getItem(\`voice_preview_\${v}\`)) {
          try {
            const isFemale = VoiceDetails[v as VoiceName]?.gender === 'Female';
            const name = VoiceDetails[v as VoiceName]?.name || v;
            const greeting = isFemale ? \`สวัสดีค่ะ ฉันชื่อ\${name}ค่ะ \` : \`สวัสดีครับ ผมชื่อ\${name}ครับ \`;
            const text = \`\${greeting}ระบบเว็บไซต์นี้สร้างขึ้นโดยคุณทูน อิศราวัฒน์ ขอบคุณที่สร้างเว็บไซต์ดีๆให้ใช้ ชอบกันไหมเอ่ย\`;
            
            const url = await generateTextToSpeech(text, v as VoiceName, VoiceTone.FRIENDLY);
            await saveCachedPreview(v, url);
            
            // Wait to avoid rate limits
            await new Promise(res => setTimeout(res, 2500));
          } catch (e) {
            console.warn("Failed to pre-generate voice", v, e);
          }
        }
      }
    };
    
    preGenerate();
  }, []);
`;

if (!code.includes('preGenerate = async () =>')) {
    code = code.replace(
        'const VoiceStudio: React.FC<VoiceStudioProps> = ({ user, onError }) => {',
        `const VoiceStudio: React.FC<VoiceStudioProps> = ({ user, onError }) => {\n${cachingLogic}`
    );
}

// 3. Update handlePreviewVoice
const previewVoiceCode = `
  const handlePreviewVoice = async () => {
    setPreviewLoading(true);
    try {
      const cachedData = localStorage.getItem(\`voice_preview_\${selectedVoice}\`);
      if (cachedData) {
        const audio = new Audio(cachedData);
        audio.play();
        setPreviewLoading(false);
        return;
      }

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
        await saveCachedPreview(selectedVoice, url);
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
console.log('Updated VoiceStudio.tsx successfully');
