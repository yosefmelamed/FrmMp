'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Star, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/auth/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  const pwStrength = () => {
    const p = form.password;
    const checks = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)];
    return checks.filter(Boolean).length;
  };
  const strengthColor = ['bg-zinc-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authApi.register(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Check your email</h1>
          <p className="text-zinc-500 text-sm mb-6">
            We sent a verification link to <strong>{form.email}</strong>.<br />
            Click the link to activate your account.
          </p>
          <p className="text-xs text-zinc-400">
            Didn&apos;t get it?{' '}
            <button onClick={() => authApi.resendVerification(form.email).catch(() => {})}
              className="text-blue-600 hover:underline">Resend</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white fill-white" strokeWidth={1} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-center text-zinc-900 mb-1">Create an account</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">Join the Jewish Denver community</p>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">First name</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} required
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Moshe" autoComplete="given-name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Last name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} required
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cohen" autoComplete="family-name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com" autoComplete="email" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required
                  className="w-full px-3.5 py-2.5 pr-10 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength() ? strengthColor[pwStrength()] : 'bg-zinc-100'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">{strengthLabel[pwStrength()]}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
