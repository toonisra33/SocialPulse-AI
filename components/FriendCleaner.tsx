import React, { useState } from 'react';
import { GhostFollower } from '../types';
import { UserMinus, ShieldAlert, Zap, Loader2, Trash2, CheckCircle, Search, RefreshCw, AlertTriangle } from 'lucide-react';

const FriendCleaner: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [ghosts, setGhosts] = useState<GhostFollower[] | null>(null);
    const [clearedCount, setClearedCount] = useState(0);

    const handleScan = () => {
        setIsScanning(true);
        // Simulate scanning logic
        setTimeout(() => {
            const mockGhosts: GhostFollower[] = [
                { id: '1', name: 'James_99', lastActive: '2 years ago', reason: 'Inactive account', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=James' },
                { id: '2', name: 'BotUser_X', lastActive: 'Never', reason: 'Likely bot profile', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bot' },
                { id: '3', name: 'Ex_Colleague', lastActive: '1 year ago', reason: 'No engagement', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Colleague' },
                { id: '4', name: 'Ghost_Spirit', lastActive: '6 months ago', reason: 'Low relevance', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ghost' },
            ];
            setGhosts(mockGhosts);
            setIsScanning(false);
        }, 2000);
    };

    const removeGhost = (id: string) => {
        setGhosts(prev => prev ? prev.filter(g => g.id !== id) : null);
        setClearedCount(c => c + 1);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <UserMinus size={120} />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex p-3 bg-red-100 rounded-2xl text-red-600 mb-4">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Engagement Cleanup</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Boost your reach by identifying inactive followers and "Ghost" accounts that hurt your algorithm visibility.
                    </p>
                    
                    {!ghosts && !isScanning && (
                        <button 
                            onClick={handleScan}
                            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2 mx-auto"
                        >
                            <Search size={20} /> Start Account Audit
                        </button>
                    )}

                    {isScanning && (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-red-600" size={32} />
                            <p className="text-sm font-medium text-gray-600">Analyzing interaction history...</p>
                        </div>
                    )}
                </div>
            </div>

            {ghosts && ghosts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="text-orange-500" size={18} />
                                Identified Ghost Accounts ({ghosts.length})
                            </h3>
                            <p className="text-xs text-gray-500">Profiles with zero engagement in the last 6 months.</p>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <CheckCircle size={16} /> {clearedCount} Cleaned
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {ghosts.map(ghost => (
                            <div key={ghost.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={ghost.avatar} className="w-12 h-12 rounded-full border border-gray-100" />
                                    <div>
                                        <p className="font-bold text-gray-800">{ghost.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">{ghost.reason}</span>
                                            <span className="text-[10px] text-gray-400">Last seen: {ghost.lastActive}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeGhost(ghost.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Unfollow / Remove"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-center">
                        <button onClick={handleScan} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                            <RefreshCw size={14} /> Refresh Scan
                        </button>
                    </div>
                </div>
            )}

            {ghosts && ghosts.length === 0 && (
                <div className="text-center p-12 bg-green-50 rounded-2xl border border-green-100">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-900">Your Account is Clean!</h3>
                    <p className="text-green-700">No inactive ghost followers found. Your engagement health is optimal.</p>
                </div>
            )}
        </div>
    );
};

export default FriendCleaner;