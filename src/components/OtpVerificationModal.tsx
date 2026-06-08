import React, { useState } from 'react';
import { ShieldCheck, Phone, User, Check, X, HelpCircle } from 'lucide-react';

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
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const normalizePhone = (value: string) => value.replace(/\D/g, '');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const phoneDigits = normalizePhone(phone);

    if (!trimmedName) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (phoneDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMsg('');
    setSendingOtp(true);
    try {
      const response = await fetch('/api/contact-unlock/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneDigits }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send OTP');
      }
      setChallengeToken(data.challengeToken || '');
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) {
      setErrorMsg('OTP session expired. Please request a new code.');
      return;
    }

    setErrorMsg('');
    setVerifyingOtp(true);
    try {
      const response = await fetch('/api/contact-unlock/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken,
          otp: otpInput.trim(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'OTP verification failed');
      }
      setStep('success');
      setTimeout(() => {
        onVerifySuccess(name.trim(), `+91 ${normalizePhone(phone)}`);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResend = async () => {
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg('');
    setSendingOtp(true);
    try {
      const response = await fetch('/api/contact-unlock/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneDigits }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to resend OTP');
      }
      setChallengeToken(data.challengeToken || '');
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 px-6 py-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/15 p-1.5 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Security Verification Gate</h3>
              <p className="font-mono text-[10px] text-slate-400">MSG91 OTP enabled</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6 text-xs text-slate-700">
          {businessName && (
            <div className="rounded-xl border border-indigo-100/50 bg-indigo-50 p-3 text-indigo-950">
              Unlock directory info for <strong className="text-indigo-600">{businessName}</strong>.
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(normalizePhone(e.target.value))}
                    placeholder="9998887776"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-slate-400">We will send a real OTP by SMS.</span>
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full rounded-xl bg-slate-900 py-3 font-mono font-bold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {sendingOtp ? 'Sending OTP...' : 'Generate Secure OTP SMS'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  OTP sent to +91 {normalizePhone(phone)}
                </span>
                <p className="text-slate-500">Enter the SMS code to unlock the contact details.</p>
              </div>

              <div>
                <label className="mb-1 block text-center font-bold text-slate-700">Enter Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 123456"
                  className="mx-auto block w-40 rounded-xl border border-slate-300 bg-slate-50 p-3 text-center font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 font-mono font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify Contact'}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={sendingOtp}
                  className="rounded-xl bg-slate-100 px-4 font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resend
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-3 py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Verification Complete!</h4>
                <p className="text-[11px] text-slate-500">
                  Verified user session bound as <span className="font-semibold text-indigo-600">{name}</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
