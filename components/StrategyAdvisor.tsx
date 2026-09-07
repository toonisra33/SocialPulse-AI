import React, { useState } from 'react';
import { generateStrategy } from '../services/geminiService';
import { Platform, StrategyPlan } from '../types';
import { Lightbulb, Rocket, Calendar, CheckCircle, Loader2, TrendingUp, Info } from 'lucide-react';

const StrategyAdvisor: React.FC = () => {
    const [niche, setNiche] = useState('');
    const [platform, setPlatform] = useState<Platform>(Platform.FACEBOOK);
    const [plan, setPlan] = useState<StrategyPlan | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!niche) return;
        setLoading(true);
        try {
            const result = await generateStrategy(niche, platform);
            setPlan(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-fit">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Rocket className="text-blue-600" size={24} />
                        Strategy Advisor
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Get an AI-powered content roadmap for your brand.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Niche/Business</label>
                        <input 
                            type="text" 
                            value={niche} 
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="e.g. Minimalist Interior Design"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Platform</label>
                        <select 
                            value={platform} 
                            onChange={(e) => setPlatform(e.target.value as Platform)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading || !niche}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Lightbulb size={20} />}
                        Build Strategy
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {loading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
                        <p>Drafting your content roadmap...</p>
                    </div>
                )}

                {plan && !loading && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white shadow-lg">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                                <TrendingUp size={20} /> Strategic Goals
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {plan.goals.map((goal, i) => (
                                    <div key={i} className="bg-white/10 p-3 rounded-lg flex items-start gap-3 border border-white/5">
                                        <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" />
                                        <span className="text-sm font-medium">{goal}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                                <Calendar size={20} className="text-blue-600" />
                                <h3 className="font-bold text-gray-800">7-Day Content Calendar</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {plan.weekPlan.map((day, idx) => (
                                    <div key={idx} className="p-5 hover:bg-blue-50/30 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs uppercase tracking-widest">{day.day}</span>
                                                <h4 className="font-bold text-gray-900">{day.topic}</h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded uppercase">{day.format}</span>
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start gap-2">
                                            <Info size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                                            <p className="text-xs text-yellow-800 font-medium">Tip: {day.engagementTip}</p>
                                        </div>
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

export default StrategyAdvisor;