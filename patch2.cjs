const fs = require('fs');
let code = fs.readFileSync('components/VideoAIGenerator.tsx', 'utf-8');

const durationUI = `
              {/* Duration Setting */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between mb-2">
                  <span>ความยาววิดีโอ (Duration)</span>
                  <span className="text-gray-600">{duration}</span>
                </label>
                <div className="flex gap-2">
                  {['5s', '10s', '15s', '30s'].map(d => (
                    <button 
                      key={d}
                      onClick={() => setDuration(d)}
                      className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all \${duration === d ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
`;

if (!code.includes('ความยาววิดีโอ (Duration)')) {
  // Replace the start of the Advanced Settings section
  code = code.replace(
    '<div className="space-y-4">',
    '<div className="space-y-4">\n' + durationUI
  );
}

fs.writeFileSync('components/VideoAIGenerator.tsx', code);
console.log('Patch 2 applied.');
