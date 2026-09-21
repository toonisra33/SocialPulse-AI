const fs = require('fs');
let code = fs.readFileSync('components/VideoAIGenerator.tsx', 'utf-8');

// 1. Add state for duration
if (!code.includes('const [duration, setDuration] = useState')) {
  code = code.replace(
    "const [motionLevel, setMotionLevel] = useState('5');",
    "const [motionLevel, setMotionLevel] = useState('5');\n  const [duration, setDuration] = useState('5s');"
  );
}

// 2. Add duration UI dropdown
const durationUI = `
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                ความยาววิดีโอ (วินาที)
              </label>
              <select 
                value={duration} 
                onChange={e => setDuration(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500"
              >
                <option value="5s">5 วินาที</option>
                <option value="10s">10 วินาที</option>
                <option value="15s">15 วินาที</option>
                <option value="30s">30 วินาที (Max)</option>
              </select>
            </div>
`;

if (!code.includes('ความยาววิดีโอ (วินาที)')) {
  code = code.replace(
    /<div>\s*<label className="text-\[10px\] font-black text-gray-400 uppercase tracking-widest mb-2 block">\s*Aspect Ratio\s*<\/label>[\s\S]*?<\/div>/,
    "$&" + durationUI
  );
}

// 3. Update the handleGenerate call to include duration
if (code.includes('await generateAIVideo(finalPrompt, provider, uploadedImage);')) {
  code = code.replace(
    'await generateAIVideo(finalPrompt, provider, uploadedImage);',
    'await generateAIVideo(`${finalPrompt} --duration ${duration}`, provider, uploadedImage);'
  );
} else if (code.includes('await generateAIVideo(prompt, provider, uploadedImage);')) {
    code = code.replace(
    'await generateAIVideo(prompt, provider, uploadedImage);',
    'await generateAIVideo(`${prompt} --duration ${duration}`, provider, uploadedImage);'
  );
}

fs.writeFileSync('components/VideoAIGenerator.tsx', code);
console.log('Video duration patched successfully.');
