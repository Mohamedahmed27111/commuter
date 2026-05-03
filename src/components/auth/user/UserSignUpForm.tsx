'use client';

import { useState, useCallback } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import PasswordInput from '@/components/shared/PasswordInput';
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter';
import AgeGateInput from '@/components/shared/AgeGateInput';
import { saveSession } from '@/lib/auth';
import type { AuthResponse } from '@/types/auth';

const NAME_RE  = /^[^\d]{3,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeMockJwt(payload: object): string {
  const enc = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}.mock_signature`;
}

function mockUserSignUp(name: string): AuthResponse {
  return {
    token: makeMockJwt({ role: 'user', name, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }),
    role: 'user',
    userId: `usr-${Date.now()}`,
    name,
    isVerified: false,
    isApproved: true,
  };
}

export default function UserSignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '' as 'male' | 'female' | '',
    dateOfBirth: '',
    gender_pref: 'mixed' as 'mixed' | 'same',
    walk_minutes: 0 as 0 | 5 | 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleDob = useCallback((v: string) => setForm((f) => ({ ...f, dateOfBirth: v })), []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!NAME_RE.test(form.name.trim())) e.name = 'Enter your full name (at least 3 letters, no numbers).';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.';
    if (!form.gender) e.gender = 'Please select your gender.';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const result = mockUserSignUp(form.name.trim());
    saveSession(result);
    toast.success(`Welcome to Commuter, ${form.name.trim()}! 🎉`);
    setLoading(false);
    router.push('/user/dashboard');
  }

  const inputClass = (err?: string) => [
    'w-full h-[52px] border rounded-lg text-sm text-primary bg-white px-4',
    'focus:outline-none transition-all placeholder:text-text-muted/60',
    err
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
      : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
  ].join(' ');

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[28px] font-bold text-primary mb-1">Create your account</h1>
      <p className="text-sm text-text-muted mb-6">Join Commuter as a passenger</p>

      {/* Full name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
        <input value={form.name} onChange={set('name')} placeholder="Your full name" className={inputClass(errors.name)} />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
            className={[inputClass(errors.email), 'pl-10'].join(' ')}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
      </div>

      {/* Password */}
      <div className="mb-4">
        <PasswordInput
          label="Password"
          value={form.password}
          onChange={set('password')}
          placeholder="Min. 8 characters"
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={form.password} />
      </div>

      {/* Confirm password */}
      <div className="mb-4">
        <PasswordInput
          label="Confirm password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          placeholder="Repeat password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      {/* Gender */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-primary mb-1.5">Gender</label>
        <div className="flex gap-2">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm((f) => ({ ...f, gender: g }))}
              className="px-6 py-2 rounded-full text-sm border-[1.5px] transition-all capitalize"
              style={form.gender === g
                ? { background: '#00C2A8', borderColor: '#00C2A8', color: '#0B1E3D', fontWeight: 600 }
                : { borderColor: '#D1D5DB', color: '#5A6A7A' }
              }
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
        {errors.gender && <p className="mt-1 text-xs text-danger">{errors.gender}</p>}
      </div>

      {/* Date of birth */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-primary mb-1.5">Date of birth</label>
        <AgeGateInput onChange={handleDob} error={errors.dateOfBirth} />
      </div>

      {/* Commute preferences */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Your commute preferences</div>

        {/* Gender preference */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1.5">Gender preference</label>
          <div className="flex gap-2">
            {([['mixed', 'Mixed'], ['same', 'Same gender']] as const).map(([val, label]) => (
              <button key={val} type="button"
                onClick={() => setForm((f) => ({ ...f, gender_pref: val }))}
                className="px-5 py-2 rounded-full text-sm border-[1.5px] transition-all"
                style={form.gender_pref === val
                  ? { background: '#00C2A8', borderColor: '#00C2A8', color: '#0B1E3D', fontWeight: 600 }
                  : { borderColor: '#D1D5DB', color: '#5A6A7A' }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Walk to pickup */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-primary mb-1.5">Walk to pickup</label>
          <div className="flex flex-col gap-2">
            {([
              [0, '🚗 No walk', 'Door pickup · Standard'],
              [5, '🚶 5 min', '~400 m · Save 8%'],
              [10, '🚶 10 min', '~800 m · Save 15%'],
            ] as const).map(([val, title, sub]) => (
              <button key={val} type="button"
                onClick={() => setForm((f) => ({ ...f, walk_minutes: val }))}
                className="flex items-center gap-3 p-3 rounded-lg border-[1.5px] text-left transition-all"
                style={form.walk_minutes === val
                  ? { borderColor: '#00C2A8', background: '#EFF7F6' }
                  : { borderColor: '#E2E8F0', background: '#fff' }}
              >
                <span className="text-base">{title.split(' ')[0]}</span>
                <div>
                  <div className="text-sm font-medium text-primary">{title.slice(title.indexOf(' ') + 1)}</div>
                  <div className="text-xs text-text-muted">{sub}</div>
                </div>
                {form.walk_minutes === val && <span className="ml-auto text-secondary text-sm">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-text-muted mt-2">
          ℹ These preferences apply to all your future requests. You can change them anytime in your profile settings.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: '#00C2A8', color: '#0B1E3D' }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Create account
      </button>

      <p className="mt-5 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-secondary font-medium hover:underline">
          Sign in →
        </Link>
      </p>
    </form>
  );
}
