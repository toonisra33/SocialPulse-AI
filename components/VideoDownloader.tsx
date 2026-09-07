import React, { useState } from 'react';
import { Download, Link as LinkIcon, Film, Loader2, CheckCircle, Info } from 'lucide-react';

const VideoDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [videoData, setVideoData] = useState<{title: string, thumbnail: string, duration: string} | null>(null);

    const handleFetch = () => {
        if (!url) return;
        setIsFetching(true);
        // Simulate fetching metadata
        setTimeout(() => {
            setVideoData({
                title: "Incredible AI Art Showcase - Viral Reel",
                thumbnail: "https://picsum.photos/seed/social/800/450",
                duration: "00:45"
            });
            setIsFetching(false);
        }, 1500);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="inline-flex p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-4">
                    <Download size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Video Downloader</h2>
                <p className="text-gray-500 mb-6">Save high-quality videos from Facebook, TikTok, and Instagram for your archives.</p>
                
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste social video link here..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={handleFetch}
                        disabled={isFetching || !url}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isFetching ? <Loader2 className="animate-spin" /> : <Film size={18} />}
                        Fetch Video
                    </button>
                </div>
            </div>

            {videoData && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/2 relative group overflow-hidden rounded-xl">
                            <img src={videoData.thumbnail} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                {videoData.duration}
                            </div>
                        </div>
                        <div className="md:w-1/2 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{videoData.title}</h3>
                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-4">
                                    <CheckCircle size={16} /> Link Validated
                                </div>
                            </div>
                            <button className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                                <Download size={20} /> Download HD (MP4)
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-50 flex items-start gap-3">
                        <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Always respect copyright and usage rights when downloading content. This tool is intended for personal archiving and fair use only.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoDownloader;