import React, { useState } from 'react';
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
  }) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password, userType }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Registration failed');
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');

      onAuthSuccess({
        token: loginData.token,
        name: loginData.user.name,
        phone: loginData.user.phone,
        email: loginData.user.email,
        role: loginData.user.role,
        userType: loginData.user.userType,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-sm">
            Close
          </button>
        </div>

        <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 text-xs py-2 rounded-lg font-semibold ${mode === 'login' ? 'bg-white text-slate-900' : 'text-slate-500'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 text-xs py-2 rounded-lg font-semibold ${mode === 'register' ? 'bg-white text-slate-900' : 'text-slate-500'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (+91...)" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={userType} onChange={(e) => setUserType(e.target.value as UserType)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="resource">Resource</option>
              </select>
            </>
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="w-full border rounded-lg px-3 py-2 text-sm" />

          {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</div>}

          <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create & Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
