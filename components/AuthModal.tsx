
import React, { useEffect } from 'react';
import { Facebook, Chrome, Globe } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  
  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
    try {
      // In a real app we'd fetch the URL from the backend.
      // For Google, it's typically similar to Facebook. We'll use the facebook endpoint.
      const response = await fetch(`/api/auth/${provider}/url`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      let url = '';
      try {
        const data = await response.json();
        url = data.url;
      } catch (e) {
        throw new Error('Server returned invalid response.');
      }
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('0.0.0.0')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const provider = event.data.provider;
        const mockUser: User = {
            id: `user-${Date.now()}`,
            name: provider === 'facebook' ? 'Facebook User' : 'Google User',
            email: `user@${provider}.com`,
            avatar: `https://picsum.photos/200?random=${Date.now()}`,
            provider: provider,
            socialAccounts: []
        };
        onLogin(mockUser);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);


  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-100 rounded-full -ml-16 -mb-16 blur-2xl opacity-50"></div>

        <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
                <Globe className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SocialPulse</h1>
            <p className="text-gray-500 text-sm">
                AI-Powered Social Media Management Dashboard.<br/>
                Login to manage your content effectively.
            </p>
        </div>

        <div className="space-y-4 relative z-10">
            <button 
                onClick={() => handleSocialLogin('facebook')}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
                <Facebook size={20} fill="currentColor" />
                Continue with Facebook
            </button>
            
            <button 
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
                <Chrome size={20} className="text-red-500" />
                Continue with Google
            </button>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 relative z-10">
            By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
