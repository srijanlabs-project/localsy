import React, { useState } from 'react';
import { ShieldCheck, Phone, User, Check, X, Sparkles, HelpCircle } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: (userName: string, userPhone: string) => void;
  businessName?: string;
}

export default function OtpVerificationModal({
  isOpen,
  onClose,
  onVerifySuccess,
  businessName
}: OtpVerificationModalProps) {
  const [step, setStep] = useState<'captcha' | 'details' | 'otp' | 'success'>('captcha');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sliderVal, setSliderVal] = useState(0);
  const [isSliderVerified, setIsSliderVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedOtp] = useState('1212'); // Static test OTP as requested string
  const [sendingSms, setSendingSms] = useState(false);

  if (!isOpen) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSliderVal(val);
    if (val >= 100) {
      setIsSliderVerified(true);
      setErrorMsg('');
      setTimeout(() => {
        setStep('details');
      }, 600);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    // Indian phone regex pattern (approx 10 digits starting with 6,7,8,9 is typical)
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMsg('');
    setSendingSms(true);
    // Simulate API delay
    setTimeout(() => {
      setSendingSms(false);
      setStep('otp');
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOtp) {
      setErrorMsg('');
      setStep('success');
      setTimeout(() => {
        onVerifySuccess(name, `+91 ${phone}`);
        onClose();
      }, 1500);
    } else {
      setErrorMsg('Invalid static verification OTP! Try "1212".');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Header decoration */}
        <div className="bg-slate-950 px-6 py-5 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/15 p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Security Verification Gate</h3>
              <p className="text-[10px] text-slate-400 font-mono">Anti-Scraping Shield Active</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Subtitle context */}
          {businessName && (
            <div className="bg-indigo-50 text-indigo-950 p-3 rounded-xl border border-indigo-100/50">
              Unlock directory info for <strong className="text-indigo-600">{businessName}</strong>. 
              We strictly enforce OTP checks to block digital scraper bots.
            </div>
          )}

          {/* Stepper Wizard Indicator */}
          <div className="flex justify-between items-center px-4">
            {['Bot Check', 'Details', 'OTP code', 'Completed'].map((label, idx) => {
              const stages: typeof step[] = ['captcha', 'details', 'otp', 'success'];
              const currentIdx = stages.indexOf(step);
              let stateClass = 'bg-slate-100 text-slate-400';
              if (idx === currentIdx) {
                stateClass = 'bg-indigo-600 text-white font-bold ring-4 ring-indigo-50';
              } else if (idx < currentIdx) {
                stateClass = 'bg-emerald-500 text-white';
              }
              return (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-300 ${stateClass}`}>
                    {idx < currentIdx ? '✓' : idx + 1}
                  </div>
                  <span className="text-[9px] font-medium text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Core Content Switches */}
          {step === 'captcha' && (
            <div className="space-y-4 py-2 text-center">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Verify you are human</h4>
                <p className="text-slate-500 mx-auto max-w-xs text-[11px]">
                  Scrapers are locked from bulk downloading phone arrays. Drag the slider to the right to verify.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <div className="relative h-12 bg-slate-200/80 rounded-xl flex items-center justify-center overflow-hidden border border-slate-300 select-none">
                  {/* Slider background text */}
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 z-0 animate-pulse">
                    {isSliderVerified ? 'HUMAN VERIFIED' : 'Slide strictly right ➡️'}
                  </span>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderVal}
                    onChange={handleSliderChange}
                    disabled={isSliderVerified}
                    className="absolute inset-0 w-full h-full opacity-60 cursor-pointer accent-indigo-600 focus:outline-none"
                  />
                  
                  {/* Visual slider progress */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-indigo-500/20 transition-all pointer-events-none"
                    style={{ width: `${sliderVal}%` }}
                  ></div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  Completing this dynamic action allows you to bypass programmatic security hooks.
                </div>
              </div>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Indian Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9998887776"
                    className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">10-digit Indian service operator networks only.</span>
              </div>

              <button
                type="submit"
                disabled={sendingSms}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-mono font-bold py-3 rounded-xl shadow-md transition"
              >
                {sendingSms ? 'Transmitting OTP Packet...' : 'Generate Secure OTP SMS'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1.5">
                <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold">
                  📱 SIMULATED SMS HAS SENT
                </span>
                <p className="text-slate-500">
                  We issued a simulated OTP to <strong className="text-slate-800">+91 {phone}</strong>.
                </p>
                <div className="bg-slate-50 p-2 text-slate-600 font-mono border border-slate-100 rounded-xl">
                  Test OTP to input is: <strong className="text-emerald-600 text-sm">1212</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-center mb-1">Enter Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 1212"
                  className="w-32 mx-auto text-center p-3 font-mono font-bold text-lg bg-slate-50 border border-slate-300 rounded-xl block focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-3 rounded-xl transition"
                >
                  Verify Device
                </button>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 rounded-xl transition"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-slate-900 text-sm">Verification Complete!</h4>
                <p className="text-slate-500 text-[11px]">
                  Verified user session bound as <span className="text-indigo-600 font-semibold">{name}</span>.
                </p>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">✓ Safe view flags updated. Revealing details...</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
