'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { setToken } from '@/lib/auth';

// Mock credentials for development (remove when backend is ready)
const MOCK_DRIVER = { email: 'ahmed@commuter.eg', password: 'driver123', role: 'driver' as const, name: 'Ahmed Hassan' };
const MOCK_USER   = { email: 'sara@commuter.eg',  password: 'user1234',  role: 'user' as const,  name: 'Sara Khaled' };

function mockSignIn(email: string, password: string) {
  if (email === MOCK_DRIVER.email && password === MOCK_DRIVER.password) return MOCK_DRIVER;
  if (email === MOCK_USER.email   && password === MOCK_USER.password)   return MOCK_USER;
  return null;
}

function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forDriver = searchParams.get('for') === 'driver';

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email address';
    if (!password)
      e.password = 'Password is required';
    else if (password.length < 8)
      e.password = 'Password must be at least 8 characters';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      // --- Mock auth (swap for real API when backend ready) ---
      await new Promise((r) => setTimeout(r, 900));
      const mock = mockSignIn(email, password);
      if (!mock) {
        setLoading(false);
        toast.error('Invalid email or password');
        setErrors({ password: 'Invalid email or password' });
        return;
      }
      // Store a fake token so the app can read the role
      const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const header = enc({ alg: 'HS256', typ: 'JWT' });
      const body = enc({ role: mock.role, name: mock.name, exp: Math.floor(Date.now() / 1000) + 86400 });
      setToken(`${header}.${body}.mock_signature`);
      toast.success(`Welcome back, ${mock.name}!`);
      await new Promise((r) => setTimeout(r, 400));
      router.push(mock.role === 'driver' ? '/driver/dashboard' : '/user/map');
      // --- End mock ---

      /* Real API (uncomment when backend ready):
      const data = await signIn({ email, password });
      setToken(data.token);
      toast.success(`Welcome back, ${data.name}!`);
      router.push(data.role === 'driver' ? '/driver/dashboard' : '/user/dashboard');
      */
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      toast.error(msg);
      setErrors({ password: msg });
    }
  }

  const heading = forDriver ? 'Driver sign in' : 'Sign in';

  return (
    <div className="min-h-screen bg-surface flex">
      <Toaster position="top-right" />

      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
            <span className="text-primary font-black text-base">C</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">commuter</span>
        </div>

        {/* Tagline */}
        <div className="space-y-4">
          <h1 className="text-white text-4xl font-black leading-tight">
            Drive smarter.<br />
            <span className="text-secondary">Earn better.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Join Egypt&apos;s leading ride-pooling platform. Connect with weekly cycle passengers and grow your income on your own schedule.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '12,000+', label: 'Active drivers' },
            { value: '10,000 EGP', label: 'Avg. monthly earn' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg px-4 py-3">
              <p className="text-secondary font-bold text-lg">{s.value}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs">© {new Date().getFullYear()} Commuter. Egypt Standard Time (UTC+2)</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <span className="text-primary font-black text-sm">C</span>
          </div>
          <span className="text-primary font-bold text-lg tracking-wide">commuter</span>
        </div>

        <div className="w-full max-w-[480px] space-y-6">
          {/* Heading */}
          <div>
            <h2 className="text-[28px] font-bold text-primary">{heading}</h2>
            <p className="text-text-muted text-sm mt-1">Enter your credentials to access your account</p>
          </div>

          {/* Demo box */}
          <div className="bg-secondary-lt border border-[#C8E8E4] rounded-lg px-4 py-3 text-sm space-y-0.5">
            <p className="font-semibold text-primary text-xs uppercase tracking-wide mb-1">Demo credentials</p>
            <p className="text-text-muted">Driver: <span className="font-mono text-primary">ahmed@commuter.eg</span> / <span className="font-mono text-primary">driver123</span></p>
            <p className="text-text-muted">Passenger: <span className="font-mono text-primary">sara@commuter.eg</span> / <span className="font-mono text-primary">user1234</span></p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@commuter.eg"
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={[
                    'w-full pl-10 pr-4 py-3 border rounded-lg text-primary placeholder:text-text-muted/60 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow',
                    errors.email ? 'border-danger focus:ring-danger' : 'border-gray-200',
                    loading ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-danger">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-primary">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-secondary hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={[
                    'w-full pl-10 pr-10 py-3 border rounded-lg text-primary placeholder:text-text-muted/60 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary transition-shadow',
                    errors.password ? 'border-danger focus:ring-danger' : 'border-gray-200',
                    loading ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-danger">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-secondary text-primary font-bold text-sm rounded-lg hover:bg-secondary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-sm text-text-muted text-center">
            Not registered?{' '}
            <Link href="/auth/signup/driver" className="text-secondary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded">
              Apply to become a driver
            </Link>{' '}
            or{' '}
            <Link href="/auth/signup/user" className="text-secondary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded">
              join as passenger
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPageWrapper() { return (<Suspense><SignInPage /></Suspense>); }
