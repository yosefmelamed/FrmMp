'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Star, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/auth/api';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await authApi.forgotPassword(email); setSent(true); }
    catch (err: any) { setError(err.message ?? 'Request failed'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Check your email</h1>
        <p className="text-zinc-500 text-sm">If an account exists for <strong>{email}</strong>, we sent a password reset link. It expires in 1 hour.</p>
        <Link href="/login" className="inline-block mt-6 text-sm text-blue-600 hover:underline">Back to sign in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white fill-white" strokeWidth={1} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-center text-zinc-900 mb-1">Forgot password?</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">We&apos;ll send you a reset link</p>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
