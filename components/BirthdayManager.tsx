import React, { useState } from 'react';
import { generateBirthdayWish } from '../services/geminiService';
import { Gift, Send, Loader2, Copy, Check } from 'lucide-react';

const BirthdayManager: React.FC = () => {
  const [friendName, setFriendName] = useState('');
  const [relationship, setRelationship] = useState('Close Friend');
  const [style, setStyle] = useState('Funny');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!friendName) return;
    setLoading(true);
    setCopied(false);
    try {
      const result = await generateBirthdayWish(friendName, relationship, style);
      setMessage(result);
    } catch (error) {
      setMessage("Error generating wish.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="text-pink-500" size={24} />
            Birthday Wish Generator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
            Let AI craft the perfect birthday message for your friends and family.
        </p>
      </div>

      <div className="space-y-4 animate-fade-in flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Friend's Name</label>
          <input
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="John Doe"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-shadow"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select 
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-pink-500 transition-shadow"
                >
                    <option>Best Friend</option>
                    <option>Acquaintance</option>
                    <option>Coworker</option>
                    <option>Family Member</option>
                    <option>Partner</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vibe</label>
                <select 
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-pink-500 transition-shadow"
                >
                    <option>Funny</option>
                    <option>Heartfelt</option>
                    <option>Short & Sweet</option>
                    <option>Professional</option>
                    <option>Sarcastic</option>
                </select>
            </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !friendName}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Gift size={20} />}
          Generate Wish
        </button>

        {message && (
          <div className="mt-6 animate-fade-in">
             <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Your Message</label>
                <button 
                    onClick={handleCopy}
                    className="text-xs flex items-center gap-1 text-pink-600 font-medium hover:text-pink-700 transition-colors"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
             </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 border border-pink-100 bg-pink-50/50 rounded-xl text-gray-700 text-lg leading-relaxed h-32 focus:bg-white transition-colors outline-none resize-none"
            />
            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=&quote=${encodeURIComponent(message)}`, '_blank')}
                    className="flex-1 py-2.5 bg-[#1877F2] text-white font-semibold rounded-lg hover:bg-[#166fe5] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <Send size={18} /> Open Facebook
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthdayManager;