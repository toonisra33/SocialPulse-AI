const fs = require('fs');
let code = fs.readFileSync('components/VideoAIGenerator.tsx', 'utf-8');

const targetRegex = /\{\/\* Styles \*\/\}.*?\{\/\* Character Face Lock & Settings \*\/\}/s;

const replacement = `{/* Styles & Genres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="text-purple-500" size={20} /> รูปแบบภาพ (Visual Style)
              </h3>
              <div className="relative">
                <select
                  value={selectedStyle}
                  onChange={e => setSelectedStyle(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all appearance-none cursor-pointer"
                >
                  {VISUAL_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Film className="text-blue-500" size={20} /> แนวภาพยนตร์ (Genre)
              </h3>
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={e => setSelectedGenre(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Character Face Lock & Settings */}`;

code = code.replace(targetRegex, replacement);
fs.writeFileSync('components/VideoAIGenerator.tsx', code);
console.log('UI updated to use dropdowns.');
