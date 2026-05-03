'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import AgeGateInput from '@/components/auth/AgeGateInput';
import { setToken } from '@/lib/auth';

// Password strength helper
function passwordStrength(pw: string): { level: 0|1|2|3|4; label: string } {
  if (!pw) return { level: 0, label: '' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['','Weak','Fair','Strong','Very strong'];
  return { level: score as 0|1|2|3|4, label: labels[score] };
}
const STRENGTH_COLORS = ['','bg-danger','bg-warning','bg-success','bg-success'];
const STRENGTH_TEXT   = ['','text-danger','text-warning','text-success','text-success'];

type Gender = 'male' | 'female' | '';

interface FormState {
  name: string; email: string; password: string; confirmPassword: string;
  gender: Gender; dateOfBirth: string;
}
type FormErrors = Partial<Record<keyof FormState, string>>;

export default function UserSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', confirmPassword: '', gender: '', dateOfBirth: '',
  });
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [loading, setLoading]       = useState(false);

  const pw = passwordStrength(form.password);

  function f(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 3)           e.name = 'Full name must be at least 3 characters';
    else if (!/^[A-Za-z\u00C0-\u024F\s'-]+$/.test(form.name.trim()))            e.name = 'Name must contain letters only';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))            e.email = 'Enter a valid email address';
    if (form.password.length < 8)                                   e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)                     e.confirmPassword = 'Passwords do not match';
    if (!form.gender)                                               e.gender = 'Please select your gender';
    if (!form.dateOfBirth)                                          e.dateOfBirth = 'Date of birth is required';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      // Mock: simulate API
      await new Promise((r) => setTimeout(r, 1000));
      const name = form.name.trim().split(' ')[0];
      // Store a fake token
      const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const header = enc({ alg: 'HS256', typ: 'JWT' });
      const body = enc({ role: 'user', name: form.name.trim(), exp: Math.floor(Date.now() / 1000) + 86400 });
      setToken(`${header}.${body}.mock_signature`);
      toast.success(`Welcome to Commuter, ${name}! 🎉`);
      await new Promise((r) => setTimeout(r, 500));
      router.push('/user/map');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (err?: string) => [
    'w-full px-3 py-2.5 border rounded-lg text-primary text-sm bg-white focus:outline-none focus:ring-2 transition-shadow placeholder:text-text-muted/60',
    err ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-secondary',
  ].join(' ');

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4 py-12">
      <Toaster position="top-right" />

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
          <span className="text-primary font-black text-sm">C</span>
        </div>
        <span className="text-white font-bold text-lg tracking-wide">commuter</span>
      </div>

      <div className="bg-white rounded-2xl p-8 sm:p-10 w-full max-w-[460px] shadow-xl space-y-5">
        <h1 className="text-[22px] font-bold text-primary">Create your account</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
            <input className={inputCls(errors.name)} value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="Sara Khaled" autoComplete="name" />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
            <input type="email" className={inputCls(errors.email)} value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} autoComplete="new-password" className={inputCls(errors.password) + ' pr-10'} value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary focus:outline-none" aria-label={showPw ? 'Hide' : 'Show'}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {form.password && (
              <div className="mt-1.5 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${pw.level >= i ? STRENGTH_COLORS[pw.level] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-[11px] font-medium ${STRENGTH_TEXT[pw.level]}`}>{pw.label}</p>
              </div>
            )}
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Confirm password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" className={inputCls(errors.confirmPassword) + ' pr-10'} value={form.confirmPassword} onChange={(e) => f('confirmPassword', e.target.value)} placeholder="Repeat password" />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary focus:outline-none" aria-label={showConfirm ? 'Hide' : 'Show'}>
                {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-danger">{errors.confirmPassword}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Gender</label>
            <div className="flex gap-3" role="radiogroup" aria-label="Gender">
              {(['male','female'] as const).map((g) => (
                <label
                  key={g}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-full border cursor-pointer text-sm font-medium transition-colors',
                    form.gender === g
                      ? 'bg-secondary border-secondary text-primary'
                      : 'border-[#C8E8E4] text-text-muted hover:border-secondary hover:text-primary',
                  ].join(' ')}
                >
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => f('gender', g)} className="sr-only" />
                  {g === 'male' ? '♂' : '♀'} {g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}
            </div>
            {errors.gender && <p className="mt-1 text-xs text-danger">{errors.gender}</p>}
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Date of birth</label>
            <AgeGateInput value={form.dateOfBirth} onChange={(v) => f('dateOfBirth', v)} error={errors.dateOfBirth} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.dateOfBirth}
            className="w-full bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Creating account…
              </>
            ) : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-secondary font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
