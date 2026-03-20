'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/auth/api';

function VerifyEmailContent() {
  const params  = useSearchParams();
  const token   = params.get('token');
  const [status,  setStatus]  = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }
    authApi.verifyEmail(token)
      .then(res => { setStatus('success'); setMessage(res.message); })
      .catch(err => { setStatus('error');   setMessage(err.message ?? 'Verification failed.'); });
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-zinc-900">Verifying your email…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Email verified!</h1>
            <p className="text-zinc-500 text-sm mb-6">{message}</p>
            <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Sign In
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Verification failed</h1>
            <p className="text-zinc-500 text-sm mb-6">{message}</p>
            <Link href="/register" className="text-blue-600 hover:underline text-sm">Try registering again</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-112px)] flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}