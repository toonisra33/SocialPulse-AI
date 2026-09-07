
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { MetricData, User, Platform, PublishedPost } from '../types';
import { Users, Heart, MessageCircle, Share2, TrendingUp, Activity, CheckCircle2, AlertCircle, Calendar, ExternalLink, Globe } from 'lucide-react';

const data: MetricData[] = [
  { name: 'Mon', likes: 400, shares: 240, comments: 240, reach: 2400 },
  { name: 'Tue', likes: 300, shares: 139, comments: 221, reach: 1398 },
  { name: 'Wed', likes: 200, shares: 980, comments: 229, reach: 9800 },
  { name: 'Thu', likes: 278, shares: 390, comments: 200, reach: 3908 },
  { name: 'Fri', likes: 189, shares: 480, comments: 218, reach: 4800 },
  { name: 'Sat', likes: 239, shares: 380, comments: 250, reach: 3800 },
  { name: 'Sun', likes: 349, shares: 430, comments: 210, reach: 4300 },
];

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; trend: string }> = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
        <TrendingUp size={12} trend={trend} /> {trend}
      </p>
    </div>
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<{ user?: User | null, posts?: PublishedPost[] }> = ({ user, posts = [] }) => {
  const connectedCount = user?.socialAccounts.filter(a => a.isConnected).length || 0;

  return (
    <div className="space-y-6 overflow-x-hidden pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reach" value="128.4K" icon={<Users size={20} />} color="bg-blue-500" trend="+12% this week" />
        <StatCard title="Engagement" value="15.2K" icon={<Heart size={20} />} color="bg-pink-500" trend="+5.4% this week" />
        <StatCard title="Comments" value="3,842" icon={<MessageCircle size={20} />} color="bg-purple-500" trend="+2.1% this week" />
        <StatCard title="Shares" value="1,204" icon={<Share2 size={20} />} color="bg-orange-500" trend="+18% this week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                Growth Analytics
              </h3>
              <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">Live Syncing</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                  <Area type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                 <Calendar size={18} className="text-indigo-500" />
                 Recently Published
               </h3>
               {posts.length > 0 && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{posts.length} Posts Total</span>}
             </div>
             <div className="space-y-4">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border-2 border-white shrink-0">
                                {post.content.imageData ? (
                                    <img src={post.content.imageData} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-blue-400"><Globe size={24}/></div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 leading-none mb-2">{post.content.headline}</h4>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest text-white ${
                                        post.platform === Platform.FACEBOOK ? 'bg-[#1877F2]' : 
                                        post.platform === Platform.INSTAGRAM ? 'bg-gradient-to-r from-[#f09433] to-[#bc1888]' : 'bg-black'
                                    }`}>{post.platform}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">{new Date(post.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Status: Live</p>
                                <p className="text-[9px] text-gray-400 font-bold mt-1">Pending Interaction Sync</p>
                            </div>
                            <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <Share2 size={48} className="text-gray-200 mb-4" />
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">No Recent Posts</h4>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Generate and publish content to see your history here.</p>
                    </div>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <Globe size={18} className="text-green-500" />
                Connection Health
            </h3>
            <div className="space-y-4">
              {user?.socialAccounts.map(acc => (
                <div key={acc.platform} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${acc.isConnected ? 'bg-green-50/20 border-green-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                      acc.platform === Platform.FACEBOOK ? 'bg-blue-600' : 
                      acc.platform === Platform.INSTAGRAM ? 'bg-pink-600' : 'bg-black'
                    }`}>
                      {acc.platform.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">{acc.platform}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{acc.isConnected ? 'Operational' : 'Disconnected'}</p>
                    </div>
                  </div>
                  {acc.isConnected ? (
                    <div className="flex flex-col items-end">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <span className="text-[8px] font-black text-green-600 mt-1 uppercase tracking-tighter">{acc.followers?.toLocaleString()} Followers</span>
                    </div>
                  ) : (
                    <AlertCircle size={18} className="text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
              <div className="relative z-10">
                  <h4 className="text-lg font-black mb-3">AI Growth Advisor (Gemini 3.1)</h4>
                  <p className="text-xs text-blue-100 font-medium leading-relaxed mb-6">
                      ระบบวิเคราะห์โดย Gemini 3.1 พบว่าช่วงเวลา 18:00 - 20:00 น. คือช่วงที่ผู้ติดตามของคุณมีส่วนร่วมสูงสุดใน Facebook 
                  </p>
                  <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-2xl transition-all active:scale-95">
                      Explore Strategies
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
