
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ContentGenerator from './components/ContentGenerator';
import GraphicCreator from './components/GraphicCreator';
import BirthdayManager from './components/BirthdayManager';
import TargetAudienceFinder from './components/TargetAudienceFinder';
import StrategyAdvisor from './components/StrategyAdvisor';
import AuthModal from './components/AuthModal';
import SubscriptionModal from './components/SubscriptionModal';
import VideoAIGenerator from './components/VideoAIGenerator';
import VoiceStudio from './components/VoiceStudio';
import { User, Subscription, Platform, SocialAccount, PublishedPost } from './types';
import { 
  LayoutDashboard, PenTool, Gift, Settings, Menu, X, Globe, 
  LogOut, Target, UserCog, Upload, Trash2, Rocket, Palette, Film, Mic,
  Link2, Link2Off, Key, AlertCircle, UserCircle, ExternalLink, ShieldCheck, Share2, RefreshCw, Zap, CheckCircle2, Sparkles
} from 'lucide-react';

enum Tab {
  DASHBOARD = 'dashboard',
  CREATE = 'create',
  VIDEO = 'video',
  VOICE = 'voice',
  GRAPHIC = 'graphic',
  STRATEGY = 'strategy',
  TARGET = 'target',
  BIRTHDAY = 'birthday',
  SETTINGS = 'settings'
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [authError, setAuthError] = useState<boolean>(false);
  
  const [masterAvatar1, setMasterAvatar1] = useState<string | null>(null);
  const [masterAvatar2, setMasterAvatar2] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>({
    id: 'dev-user-01',
    name: 'วิธีคิดทัศนคติ/คนสำเร็จ',
    email: 'success@socialpulse.ai',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
    provider: 'google',
    socialAccounts: [
      { platform: Platform.FACEBOOK, username: 'SuccessMindset.Thai', isConnected: true, followers: 12500 },
      { platform: Platform.INSTAGRAM, username: 'success_mindset_ai', isConnected: true, followers: 8400 },
      { platform: Platform.TIKTOK, username: 'success_tok', isConnected: false },
    ]
  });

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // ฟังก์ชันแก้ปัญหา Key ทันที
  const handleFixConnection = async () => {
    if (window.aistudio) {
      // เรียกหน้าต่างเลือก Key ของ AI Studio
      await window.aistudio.openSelectKey();
      setAuthError(false);
      // โหลดหน้าใหม่เพื่อให้ API Client รับค่า Key ใหม่
      window.location.reload();
    }
  };

  const handleGlobalError = (e: any) => {
    // ดักจับ Error 404/403 จาก Service
    if (e.message === "ERROR_AUTH_PERMISSION_DENIED" || 
        e.message.includes("404") || 
        e.message.includes("403") || 
        e.message.includes("not found")) {
      setAuthError(true);
    }
  };

  const handlePublish = (post: PublishedPost) => {
    setPublishedPosts(prev => [post, ...prev]);
    setActiveTab(Tab.DASHBOARD);
  };

  const toggleSocialConnection = async (platform: Platform) => {
    if (!user) return;
    
    // Find if already connected to disconnect
    const existingAcc = user.socialAccounts.find(acc => acc.platform === platform);
    if (existingAcc?.isConnected) {
      const updatedAccounts = user.socialAccounts.map(acc => {
        if (acc.platform === platform) {
          return { ...acc, isConnected: false, username: '' };
        }
        return acc;
      });
      setUser({ ...user, socialAccounts: updatedAccounts });
      return;
    }

    try {
      const provider = platform.toLowerCase();
      const response = await fetch(`/api/auth/${provider}/url`);
      if (!response.ok) throw new Error(`Failed to get auth URL for ${platform}`);
      let url = '';
      try {
        const data = await response.json();
        url = data.url;
      } catch (e) {
        throw new Error(`Server returned invalid response. Please try again.`);
      }
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
        return;
      }

      // We'll listen for the message from the popup
      const handleMessage = (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('0.0.0.0')) {
          return;
        }
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.provider === provider) {
          const updatedAccounts = user.socialAccounts.map(acc => {
            if (acc.platform === platform) {
              return { ...acc, isConnected: true, username: `${provider}_user_${Date.now().toString().slice(-4)}` };
            }
            return acc;
          });
          // If the platform wasn't in the list
          if (!user.socialAccounts.some(acc => acc.platform === platform)) {
            updatedAccounts.push({
              platform,
              username: `${provider}_user_${Date.now().toString().slice(-4)}`,
              isConnected: true,
              followers: 0
            });
          }
          setUser(prev => prev ? { ...prev, socialAccounts: updatedAccounts } : prev);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const handleLogin = (loggedInUser: User) => setUser(loggedInUser);
  const handleLogout = () => { setUser(null); setSubscription(null); };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const f = e.target.files?.[0];
    if (f) {
        const r = new FileReader();
        r.onload = (ev) => {
            const data = ev.target?.result as string;
            if (slot === 1) setMasterAvatar1(data); else setMasterAvatar2(data);
        };
        r.readAsDataURL(f);
    }
  };

  const showAuth = user === null;

  const SettingsPanel = () => (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src={user?.avatar} alt={user?.name} className="w-20 h-20 rounded-full border-4 border-white shadow-xl" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight">{user?.name}</h3>
            <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-[10px] flex items-center gap-1.5 text-blue-600 font-black bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <ShieldCheck size={12} /> GEMINI 3.1 STABILITY ACTIVE
              </span>
              {subscription ? (
                <span className="text-[10px] flex items-center gap-1.5 text-green-600 font-black bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                  <Zap size={12} /> ALL API PROVISIONED
                </span>
              ) : (
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="text-[10px] flex items-center gap-1.5 text-purple-600 font-black bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  <Zap size={12} /> Upgrade to Auto-API Plan
                </button>
              )}
              <button 
                onClick={handleFixConnection}
                className="text-[10px] flex items-center gap-1.5 text-orange-600 font-black bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
              >
                <RefreshCw size={12} /> Update API Key (Fix 404/403)
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="px-6 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest border border-transparent hover:border-red-100">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm"><Key size={28} /></div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">AI API Provisioning</h3>
                    <p className="text-sm text-gray-500 font-medium">จัดการ API ของบริการ AI ต่างๆ</p>
                </div>
            </div>
            
            {subscription ? (
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} /> พร้อมใช้งานทุกบริการ
                </div>
            ) : (
                <button onClick={() => setShowSubscriptionModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-200">
                    <Sparkles size={16} /> สมัครบริการ Auto-API
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                { id: 'luma', name: 'Luma Dream Machine', status: subscription ? 'active' : 'inactive' },
                { id: 'runway', name: 'Runway Gen-3', status: subscription ? 'active' : 'inactive' },
                { id: 'omni', name: 'Omni Flash', status: subscription ? 'active' : 'inactive' },
                { id: 'seedance', name: 'Seedance 2.5', status: subscription ? 'active' : 'inactive' },
                { id: 'elevenlabs', name: 'ElevenLabs Audio', status: subscription ? 'active' : 'inactive' },
                { id: 'gemini', name: 'Gemini (Text & Logic)', status: 'active' } // Gemini is always active in this environment
            ].map(api => (
                <div key={api.id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${api.status === 'active' ? 'border-green-100 bg-green-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900 mb-1">{api.name}</span>
                        {api.status === 'active' ? (
                            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wide flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Connected
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Missing Key
                            </span>
                        )}
                    </div>
                    {api.status === 'active' ? (
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-green-500 border border-green-100"><CheckCircle2 size={16} /></div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-300 border border-gray-200"><AlertCircle size={16} /></div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm"><Link2 size={28} /></div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Facebook & Social Connections</h3>
            <p className="text-sm text-gray-500 font-medium">จัดการการเชื่อมต่อแพลตฟอร์มโซเชียลมีเดีย</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(Platform).map(p => {
            const acc = user?.socialAccounts.find(a => a.platform === p);
            return (
              <div key={p} className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${acc?.isConnected ? 'border-blue-100 bg-blue-50/20' : 'border-gray-50 bg-gray-50/50 grayscale opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    p === Platform.FACEBOOK ? 'bg-[#1877F2]' : 
                    p === Platform.INSTAGRAM ? 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]' : 
                    p === Platform.TIKTOK ? 'bg-black' : 
                    p === Platform.TWITTER ? 'bg-slate-900' : 'bg-blue-700'
                  }`}>
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{p}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{acc?.isConnected ? acc.username : 'Disconnected'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleSocialConnection(p)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                    acc?.isConnected 
                    ? 'bg-white text-red-500 border border-red-100 hover:bg-red-50' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  }`}
                >
                  {acc?.isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD: return <Dashboard user={user} posts={publishedPosts} />;
      case Tab.CREATE: return <ContentGenerator user={user} masterAvatar1={masterAvatar1} masterAvatar2={masterAvatar2} onPublish={handlePublish} onError={handleGlobalError} />;
      case Tab.VIDEO: return <VideoAIGenerator user={user} onError={handleGlobalError} />;
      case Tab.VOICE: return <VoiceStudio user={user} onError={handleGlobalError} />;
      case Tab.GRAPHIC: return <GraphicCreator user={user} userName={user?.name} onPublish={handlePublish} onError={handleGlobalError} />;
      case Tab.STRATEGY: return <StrategyAdvisor />;
      case Tab.TARGET: return <TargetAudienceFinder />;
      case Tab.BIRTHDAY: return <BirthdayManager />;
      case Tab.SETTINGS: return <SettingsPanel />;
      default: return null;
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
      className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      <Icon size={22} className={activeTab === tab ? 'text-blue-200' : 'text-gray-400'} /> {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans scrollbar-hide">
      {showAuth && <AuthModal onLogin={handleLogin} />}
      
      {/* หน้าต่างแจ้งเตือนและแก้ไข Error 404/403 ทันที */}
      {showSubscriptionModal && (
        <SubscriptionModal onSubscribe={(plan) => {
          setSubscription({
            plan,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          });
          setShowSubscriptionModal(false);
        }} />
      )}
      {authError && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-orange-100 animate-slide-down">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 ring-8 ring-orange-50/50">
              <Key size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">API Connection Required</h3>
            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
              สิทธิ์การเข้าถึงโมเดล Gemini 3.1 Pro ถูกจำกัด (Error 404/403) 
              กรุณาเลือก API Key ที่ผูกกับ **Paid Project** เพื่อเปิดใช้งานฟีเจอร์ระดับสูง
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleFixConnection}
                className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw size={18} /> Select New Paid API Key
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest mt-4">Learn about Gemini Billing <ExternalLink size={10} className="inline ml-1" /></a>
            </div>
          </div>
        </div>
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-500 lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl lg:shadow-none'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-gray-100 flex items-center gap-3 text-blue-600">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Globe size={28} /></div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900">SocialPulse</h1>
          </div>
          <nav className="flex-1 p-6 space-y-3 overflow-y-auto scrollbar-hide">
            <NavItem tab={Tab.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem tab={Tab.CREATE} icon={PenTool} label="Content Studio" />
            <NavItem tab={Tab.VIDEO} icon={Film} label="Video AI" />
            <NavItem tab={Tab.VOICE} icon={Mic} label="Voice Studio" />
            <NavItem tab={Tab.GRAPHIC} icon={Palette} label="Graphic Design" />
            <NavItem tab={Tab.STRATEGY} icon={Rocket} label="Strategy Advisor" />
            <NavItem tab={Tab.TARGET} icon={Target} label="Target Finder" />
            <NavItem tab={Tab.BIRTHDAY} icon={Gift} label="Birthday AI" />
            <NavItem tab={Tab.SETTINGS} icon={Settings} label="Settings" />
          </nav>
          
          <div className="p-6">
            {subscription ? (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 text-white/10 rotate-12"><Zap size={80} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={16} className="text-yellow-300 fill-yellow-300" />
                            <h4 className="font-black text-sm">PRO ACTIVE</h4>
                        </div>
                        <p className="text-xs text-blue-100 mb-3 font-medium">All AI APIs Auto-Provisioned</p>
                        <button onClick={() => setActiveTab(Tab.SETTINGS)} className="text-[10px] bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold transition-colors w-full text-center">Manage</button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-[2rem] shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setShowSubscriptionModal(true)}>
                    <div className="relative z-10">
                        <h4 className="font-black text-gray-900 text-sm mb-1">Upgrade to PRO</h4>
                        <p className="text-[10px] text-gray-500 font-medium mb-3">Auto-provision all AI keys</p>
                        <button className="bg-blue-600 text-white text-[10px] px-3 py-2 rounded-xl font-black transition-colors w-full text-center group-hover:bg-blue-700 flex items-center justify-center gap-1.5">
                            <Sparkles size={12} /> Get API Access
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-gray-500 hover:bg-gray-100 p-2.5 rounded-xl transition-colors">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                <h2 className="text-xl font-black text-gray-900 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
            </div>
            {user && (
                <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all" onClick={() => setActiveTab(Tab.SETTINGS)}>
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-gray-900 leading-none mb-1">{user.name}</p>
                        <div className="flex items-center gap-1 justify-end">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">GEMINI 3.1 ACTIVE</p>
                        </div>
                    </div>
                    <img src={user.avatar} className="w-11 h-11 rounded-full border-2 border-white shadow-lg" />
                </div>
            )}
        </header>
        <div className={`flex-1 overflow-auto p-4 lg:p-10 relative ${showAuth ? 'blur-md pointer-events-none' : ''}`}>
          {renderContent()}
        </div>
      </main>
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
    </div>
  );
};

export default App;
