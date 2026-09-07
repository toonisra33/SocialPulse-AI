import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Shield, Sparkles, Loader2, Key, Server, CheckCircle2 } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionModalProps {
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onSubscribe }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [step, setStep] = useState<'SELECT_PLAN' | 'PROCESSING_PAYMENT' | 'PROVISIONING' | 'SUCCESS'>('SELECT_PLAN');
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [currentService, setCurrentService] = useState('');

  const services = [
    { name: 'Gemini (Google AI)', label: 'Text & Logic API' },
    { name: 'ElevenLabs', label: 'Premium Voice AI' },
    { name: 'Luma Dream Machine', label: 'High-Quality Video' },
    { name: 'Runway Gen-3', label: 'Cinematic Video' },
    { name: 'Omni Flash', label: 'Fast Video Gen' },
    { name: 'Seedance 2.5', label: 'Realistic Video' }
  ];

  const handleProcess = () => {
      setStep('PROCESSING_PAYMENT');
      
      // Simulate Payment Processing
      setTimeout(() => {
          setStep('PROVISIONING');
      }, 2000);
  };

  useEffect(() => {
      if (step === 'PROVISIONING') {
          let currentStep = 0;
          
          const interval = setInterval(() => {
              if (currentStep < services.length) {
                  setCurrentService(services[currentStep].name);
                  setProvisionProgress(Math.floor(((currentStep + 1) / services.length) * 100));
                  currentStep++;
              } else {
                  setProvisionProgress(100);
                  clearInterval(interval);
                  setTimeout(() => {
                      setStep('SUCCESS');
                  }, 1000);
              }
          }, 1500); // 1.5 seconds per service
          
          return () => clearInterval(interval);
      }
  }, [step]);

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl p-2 shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Benefits */}
        <div className="lg:w-2/5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-0"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 text-blue-400 font-bold tracking-wider text-xs uppercase">
                    <Zap size={14} /> Pro Member
                </div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">Unlock All AI Services</h2>
                <p className="text-slate-300 text-sm mb-8">
                    จ่ายครั้งเดียวจบ ระบบสมัครและเชื่อมต่อ API ของทุกบริการระดับโลกให้อัตโนมัติ (Luma, Runway, Omni, Seedance, ElevenLabs)
                </p>
                <div className="space-y-4">
                    {[
                        "รวมค่าบริการ AI ทุกเจ้าไว้ในบิลเดียว",
                        "ระบบสมัครสมาชิกแต่ละเจ้าให้อัตโนมัติ",
                        "ดึง API Key และเชื่อมต่อระบบทันที",
                        "ไม่ต้องผูกบัตรเครดิตซ้ำซ้อน",
                        "ไม่จำกัดการสร้างภาพและวิดีโอ"
                    ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={14} className="text-green-400" />
                            </div>
                            <span className="text-sm font-medium">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-8 relative z-10 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <Server className="text-blue-400 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Automated Provisioning</p>
                        <p className="text-xs text-slate-300 mt-1">Our system securely creates instances and manages all your API keys across providers.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Dynamic Content based on Step */}
        <div className="lg:w-3/5 p-8 bg-white flex flex-col">
            
            {step === 'SELECT_PLAN' && (
                <>
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
                        <p className="text-gray-500 text-sm mt-1">All-in-one AI API access. Start creating immediately.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* Monthly Plan */}
                        <div 
                            onClick={() => setSelectedPlan('monthly')}
                            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all relative ${
                                selectedPlan === 'monthly' 
                                ? 'border-blue-600 bg-blue-50/50 shadow-lg ring-1 ring-blue-600' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-900">Monthly</span>
                                {selectedPlan === 'monthly' && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><Check size={12} className="text-white"/></div>}
                            </div>
                            <div className="flex items-end gap-1 mb-2">
                                <span className="text-3xl font-bold text-gray-900">฿3,990</span>
                                <span className="text-sm text-gray-500 mb-1">/mo</span>
                            </div>
                            <p className="text-xs text-gray-500">Billed monthly</p>
                        </div>

                        {/* Yearly Plan */}
                        <div 
                            onClick={() => setSelectedPlan('yearly')}
                            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all relative ${
                                selectedPlan === 'yearly' 
                                ? 'border-blue-600 bg-blue-50/50 shadow-lg ring-1 ring-blue-600' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                                BEST VALUE
                            </div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-gray-900">Yearly</span>
                                {selectedPlan === 'yearly' && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><Check size={12} className="text-white"/></div>}
                            </div>
                            <div className="flex items-end gap-1 mb-2">
                                <span className="text-3xl font-bold text-gray-900">฿39,900</span>
                                <span className="text-sm text-gray-500 mb-1">/yr</span>
                            </div>
                            <p className="text-xs text-gray-500">฿3,325/mo (Save ~15%)</p>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-6 px-2 border-b border-gray-100 pb-4">
                            <span>Total due today</span>
                            <span className="font-bold text-lg text-gray-900">฿{selectedPlan === 'monthly' ? '3,990' : '39,900'}</span>
                        </div>
                        <button 
                            onClick={handleProcess}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} className="text-yellow-300 fill-yellow-300" />
                            ชำระเงินและตั้งค่า API อัตโนมัติ
                        </button>
                    </div>
                </>
            )}

            {step === 'PROCESSING_PAYMENT' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <Loader2 size={48} className="text-blue-600 animate-spin" />
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">กำลังประมวลผลการชำระเงิน...</h3>
                        <p className="text-gray-500 mt-2">กรุณารอสักครู่ ระบบกำลังยืนยันยอดเงินของคุณ</p>
                    </div>
                </div>
            )}

            {step === 'PROVISIONING' && (
                <div className="flex flex-col justify-center h-full space-y-8 max-w-md mx-auto w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key size={28} className="text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">กำลังตั้งค่า API อัตโนมัติ</h3>
                        <p className="text-gray-500 mt-2 text-sm">ระบบกำลังลงทะเบียนและดึง API Key จากผู้ให้บริการ...</p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-700">Overall Progress</span>
                            <span className="text-sm font-black text-blue-600">{provisionProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                            <div className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${provisionProgress}%` }}></div>
                        </div>

                        <div className="space-y-4">
                            {services.map((svc, idx) => {
                                const isDone = provisionProgress >= Math.floor(((idx + 1) / services.length) * 100);
                                const isCurrent = currentService === svc.name;
                                const isPending = !isDone && !isCurrent;
                                
                                return (
                                    <div key={idx} className={`flex items-center justify-between text-sm transition-all ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                                        <div className="flex items-center gap-3">
                                            {isDone ? (
                                                <CheckCircle2 size={18} className="text-green-500" />
                                            ) : isCurrent ? (
                                                <Loader2 size={18} className="text-blue-500 animate-spin" />
                                            ) : (
                                                <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300"></div>
                                            )}
                                            <span className={`font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>{svc.name}</span>
                                        </div>
                                        {isDone && <span className="text-[10px] font-black uppercase text-green-600 bg-green-100 px-2 py-1 rounded-md">Connected</span>}
                                        {isCurrent && <span className="text-[10px] font-bold uppercase text-blue-500">Generating Key...</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {step === 'SUCCESS' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Check size={48} className="text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">พร้อมใช้งานทันที!</h3>
                        <p className="text-gray-500">ระบบตั้งค่า API ของ Luma, Runway, Omni, Seedance, ElevenLabs และ Gemini เรียบร้อยแล้ว</p>
                    </div>
                    
                    <button 
                        onClick={() => onSubscribe(selectedPlan)}
                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all"
                    >
                        เริ่มต้นสร้างคอนเทนต์
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
