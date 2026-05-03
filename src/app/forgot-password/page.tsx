'use client';

import { useState } from 'react';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('Enter a valid email address.');
      return;
    }
    setErr('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1E3D' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {!sent ? (
          <>
            <Link href="/" className="flex items-center gap-1.5 text-text-muted hover:text-primary text-sm mb-6 transition-colors w-fit">
              <ArrowLeft size={14} /> Back to home
            </Link>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-black text-sm">c</span>
              </div>
              <span className="text-primary font-bold text-lg">commuter</span>
            </div>

            <h1 className="text-2xl font-bold text-primary mt-5 mb-1">Forgot your password?</h1>
            <p className="text-sm text-text-muted mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={[
                      'w-full h-[52px] pl-10 pr-4 border rounded-lg text-sm text-primary bg-white',
                      'focus:outline-none transition-all placeholder:text-text-muted/60',
                      err
                        ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
                        : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
                    ].join(' ')}
                  />
                </div>
                {err && <p className="mt-1 text-xs text-danger">{err}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#00C2A8', color: '#0B1E3D' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send reset link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle size={56} className="text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">Check your inbox</h2>
            <p className="text-sm text-text-muted leading-relaxed mb-2">
              We sent a password reset link to:
            </p>
            <p className="font-semibold text-primary mb-6">{email}</p>
            <Link
              href="/"
              className="text-sm text-secondary hover:underline font-medium"
            >
              ← Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
