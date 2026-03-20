'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Star, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/auth/api';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token  = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err.message ?? 'Reset failed');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Password reset!</h1>
        <p className="text-zinc-500 text-sm">Redirecting you to sign in…</p>
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
        <h1 className="text-2xl font-semibold text-center text-zinc-900 mb-1">Set new password</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">Must be at least 8 characters with 1 uppercase and 1 number</p>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">New password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-3.5 py-2.5 pr-10 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Resetting…' : 'Reset Password'}
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
