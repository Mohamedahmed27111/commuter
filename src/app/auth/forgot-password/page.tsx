'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Mock: simulate API
      await new Promise((r) => setTimeout(r, 800));
      // Real: await forgotPassword(email);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-xl space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <span className="text-primary font-black text-sm">C</span>
          </div>
          <span className="text-primary font-bold text-lg tracking-wide">commuter</span>
        </div>

        {sent ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-secondary-lt flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-primary">Check your inbox</h2>
            <p className="text-text-muted text-sm">
              If <span className="font-medium text-primary">{email}</span> is registered, you&apos;ll receive a password reset link shortly.
            </p>
            <Link href="/auth/signin" className="block w-full text-center bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary mt-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold text-primary">Forgot your password?</h2>
              <p className="text-text-muted text-sm mt-1">Enter your email and we&apos;ll send you a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="fp-email" className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@commuter.eg"
                  disabled={loading}
                  aria-invalid={!!error}
                  className={[
                    'w-full px-3 py-2.5 border rounded-lg text-primary text-sm bg-white focus:outline-none focus:ring-2 transition-shadow placeholder:text-text-muted/60',
                    error ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-secondary',
                  ].join(' ')}
                />
                {error && <p className="mt-1 text-xs text-danger">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Sending…
                  </>
                ) : 'Send reset link'}
              </button>
            </form>
            <p className="text-center text-sm text-text-muted">
              Remembered it?{' '}
              <Link href="/auth/signin" className="text-secondary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
