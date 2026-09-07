import React, { useState } from 'react';
import { analyzeTargetAudience } from '../services/geminiService';
import { Platform, TargetAudienceResult } from '../types';
import { Target, Search, Users, MapPin, DollarSign, Heart, Briefcase, Brain, Layers, MousePointer2, Loader2, Megaphone } from 'lucide-react';

const TargetAudienceFinder: React.FC = () => {
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState<Platform>(Platform.FACEBOOK);
  const [result, setResult] = useState<TargetAudienceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!product) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeTargetAudience(product, platform);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      {/* Input Panel */}
      <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="text-red-600" size={24} />
            Target Finder
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Identify your perfect audience with deep demographics & interests for Ads.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product / Service</label>
            <textarea
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Organic anti-aging serum for women over 40..."
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Platform</label>
            <div className="flex flex-wrap gap-2">
              {[Platform.FACEBOOK, Platform.TIKTOK, Platform.INSTAGRAM].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                    platform === p
                      ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !product}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
            Find Target Audience
          </button>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mb-4 text-red-500" size={48} />
                <p>Analyzing demographics...</p>
                <p className="text-xs">Checking interest groups on {platform}...</p>
            </div>
        )}

        {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <Users size={48} className="mb-4 opacity-20" />
                <p>Enter your product to uncover your ideal customer.</p>
            </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-6">
            
            {/* 1. Persona Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-slate-800 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><Users size={20}/> Customer Persona</h3>
                    <span className="bg-white/10 text-white text-xs px-2 py-1 rounded">{result.persona?.name}</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-500">Age & Gender</p>
                            <p className="font-semibold text-gray-800">{result.persona?.ageRange}, {result.persona?.gender}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg text-green-600"><MapPin size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-semibold text-gray-800">{result.persona?.location}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600"><Briefcase size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-500">Occupation</p>
                            <p className="font-semibold text-gray-800">{result.persona?.occupation}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><DollarSign size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-500">Income Level</p>
                            <p className="font-semibold text-gray-800">{result.persona?.incomeLevel}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-50 p-2 rounded-lg text-pink-600"><Heart size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <p className="font-semibold text-gray-800">{result.persona?.relationshipStatus}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Ads Manager Data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-blue-600 p-4">
                    <h3 className="text-white font-bold flex items-center gap-2"><MousePointer2 size={20}/> Ad Targeting Parameters</h3>
                    <p className="text-blue-100 text-xs mt-1">Use these exact keywords in your Ad Set settings.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-2">Interests (Detailed Targeting)</p>
                        <div className="flex flex-wrap gap-2">
                            {result.adTargeting?.interests?.map((int, i) => (
                                <span key={i} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                                    {int}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                             <p className="text-sm font-bold text-gray-700 mb-2">Behaviors</p>
                             <ul className="list-disc list-inside text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {result.adTargeting?.behaviors?.map((b, i) => <li key={i}>{b}</li>)}
                             </ul>
                        </div>
                         <div>
                             <p className="text-sm font-bold text-gray-700 mb-2">LAL Source Suggestion</p>
                             <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                                {result.adTargeting?.lookalikeSource}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* 3. Psychographics */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Brain size={18} className="text-orange-500"/> Pain Points</h3>
                    <ul className="space-y-2">
                        {result.psychographics?.painPoints?.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-red-500 mt-1">•</span> {point}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Star size={18} className="text-yellow-500"/> Secret Desires</h3>
                    <ul className="space-y-2">
                        {result.psychographics?.desires?.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-green-500 mt-1">•</span> {point}
                            </li>
                        ))}
                    </ul>
                </div>
             </div>

            {/* 4. Content Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Megaphone size={20} className="text-purple-600"/> Content Strategy</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {result.contentStrategy?.map((item, idx) => (
                        <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                    item.stage === 'Awareness' ? 'bg-blue-100 text-blue-700' :
                                    item.stage === 'Consideration' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {item.stage}
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Hook: "{item.hook}"</h4>
                            <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TargetAudienceFinder;

// Mock Icon component for build safety if not imported
const Star = ({size, className}: {size: number, className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);