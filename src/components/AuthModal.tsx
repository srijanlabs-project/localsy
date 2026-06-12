import React, { useEffect, useState } from 'react';
import { Mail, Phone, ShieldCheck, KeyRound, User, X } from 'lucide-react';
import { UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (payload: {
    token: string;
    name: string;
    phone?: string;
    email: string;
    role: string;
    userType: UserType;
    sellerBusinessId?: string;
  }) => void;
}

type AuthTab = 'public' | 'platform' | 'register';
type Step = 'details' | 'otp';

const PUBLIC_USER_TYPES: Array<{ value: UserType; label: string }> = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'resource', label: 'Resource' },
];

function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, '');
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('public');
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [otp, setOtp] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');

  const resetFlow = (nextTab: AuthTab = tab) => {
    setTab(nextTab);
    setStep('details');
    setLoading(false);
    setError('');
    setChallengeToken('');
    setOtp('');
    setPassword('');
  };

  useEffect(() => {
    if (!isOpen) return;
    resetFlow(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTabChange = (nextTab: AuthTab) => {
    resetFlow(nextTab);
  };

  const finalizeAuth = (payload: { token: string; user: { name: string; phone?: string; email: string; role: string; userType: UserType; sellerBusinessId?: string } }) => {
    onAuthSuccess({
      token: payload.token,
      name: payload.user.name,
      phone: payload.user.phone,
      email: payload.user.email,
      role: payload.user.role,
      userType: payload.user.userType,
      sellerBusinessId: payload.user.sellerBusinessId,
    });
    onClose();
  };

  const requestPublicOtp = async () => {
    const mobile = normalizePhoneInput(phone);
    if (!mobile || mobile.length < 10) {
      throw new Error('Please enter a valid mobile number.');
    }

    const requestRes = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: mobile }),
    });
    const requestData = await requestRes.json().catch(() => null);
    if (!requestRes.ok) {
      throw new Error(requestData?.error || 'Failed to send OTP');
    }
    setChallengeToken(requestData.challengeToken || '');
    setStep('otp');
  };

  const requestPlatformOtp = async () => {
    const identifier = email.trim();
    if (!identifier || !password.trim()) {
      throw new Error('Username/email and password are required.');
    }

    const requestRes = await fetch('/api/auth/platform/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const requestData = await requestRes.json().catch(() => null);
    if (!requestRes.ok) {
      throw new Error(requestData?.error || 'Failed to send OTP');
    }
    setChallengeToken(requestData.challengeToken || '');
    setStep('otp');
  };

  const requestRegisterOtp = async () => {
    const requestRes = await fetch('/api/auth/register/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: normalizePhoneInput(phone),
        userType,
      }),
    });
    const requestData = await requestRes.json().catch(() => null);
    if (!requestRes.ok) {
      throw new Error(requestData?.error || 'Registration failed');
    }
    setChallengeToken(requestData.challengeToken || '');
    setStep('otp');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'public' && step === 'details') {
        await requestPublicOtp();
      } else if (tab === 'platform' && step === 'details') {
        await requestPlatformOtp();
      } else if (tab === 'register' && step === 'details') {
        await requestRegisterOtp();
      } else {
        const verifyEndpoint = tab === 'register' ? '/api/auth/register/verify-otp' : '/api/auth/verify-otp';
        const verifyRes = await fetch(verifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeToken,
            otp: otp.trim(),
          }),
        });
        const verifyData = await verifyRes.json().catch(() => null);
        if (!verifyRes.ok) throw new Error(verifyData?.error || 'OTP verification failed');
        finalizeAuth(verifyData);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (nextTab: AuthTab, label: string) => (
    <button
      type="button"
      onClick={() => handleTabChange(nextTab)}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        tab === nextTab ? 'bg-white text-slate-900' : 'text-slate-500'
      }`}
    >
      {label}
    </button>
  );

  const showOtpStep = step === 'otp';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 p-2 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {tab === 'platform' ? 'Platform Admin Access' : tab === 'register' ? 'Create Account' : 'Public Login'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {tab === 'platform'
                  ? 'Password first, then OTP'
                  : tab === 'register'
                    ? 'Create an account and verify mobile OTP'
                    : 'OTP-only sign in for buyers, sellers, and resources'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            {renderTabButton('public', 'Public Login')}
            {renderTabButton('platform', 'Platform')}
            {renderTabButton('register', 'Register')}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {tab === 'register' && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                  required
                  placeholder="Mobile number"
                  className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
                />
              </div>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm"
              >
                {PUBLIC_USER_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {tab === 'public' && step === 'details' && (
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                required
                placeholder="Mobile number"
                className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
              />
            </div>
          )}

          {tab === 'platform' && step === 'details' && (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Username / email"
                  className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
                />
              </div>
            </>
          )}

          {showOtpStep && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                OTP sent to {tab === 'platform' ? 'the platform admin mobile number' : `+91 ${phone}`}
              </div>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="Enter OTP"
                  className="w-full rounded-lg border border-slate-200 px-10 py-3 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError('');
                    if (tab === 'public') {
                      await requestPublicOtp();
                    } else if (tab === 'platform') {
                      await requestPlatformOtp();
                    } else {
                      await requestRegisterOtp();
                    }
                  } catch (err: any) {
                    setError(err?.message || 'Failed to resend OTP');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700"
              >
                Resend OTP
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : showOtpStep
                ? 'Verify OTP'
                : tab === 'platform'
                  ? 'Send OTP'
                  : tab === 'register'
                    ? 'Create Account & Send OTP'
                    : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
