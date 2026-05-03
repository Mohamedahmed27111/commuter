'use client';

import { useState, useCallback } from 'react';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import StepIndicator from '@/components/auth/StepIndicator';
import AgeGateInput from '@/components/auth/AgeGateInput';
import DocumentUploadStep, { DocField } from '@/components/auth/DocumentUploadStep';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Step1 {
  name: string; email: string; phone: string; nationalId: string;
  dateOfBirth: string; address: string; password: string; confirmPassword: string;
}
interface Step2 {
  carBrand: string; carModel: string; carYear: string; carColor: string;
  licensePlate: string; drivingLicenseNumber: string;
}
type DocFiles = Record<string, File | null>;

// ─── Constants ────────────────────────────────────────────────────────────────
const CAR_BRANDS = ['Toyota','Hyundai','Kia','Nissan','Skoda','Other'];
const CAR_COLORS = ['White','Black','Silver','Red','Blue','Other'];
const CAR_YEARS  = Array.from({ length: 21 }, (_, i) => 2025 - i);

const DOC_FIELDS: DocField[] = [
  { key: 'profilePhoto',   label: 'Profile photo',                  accept: '.jpg,.jpeg,.png,image/*', maxMb: 3 },
  { key: 'nationalIdFront',label: 'National ID — front side',       accept: '.jpg,.jpeg,.png,.pdf',    maxMb: 5 },
  { key: 'nationalIdBack', label: 'National ID — back side',        accept: '.jpg,.jpeg,.png,.pdf',    maxMb: 5 },
  { key: 'drivingLicense', label: 'Driving license',                accept: '.jpg,.jpeg,.png,.pdf',    maxMb: 5 },
  { key: 'carLicense',     label: 'Car license',                    accept: '.jpg,.jpeg,.png,.pdf',    maxMb: 5 },
  { key: 'criminalRecord', label: 'Criminal Record Certificate',    accept: '.jpg,.jpeg,.png,.pdf',    maxMb: 5,
    note: 'Must be issued within the last 3 months' },
];

const EMPTY_DOCS: DocFiles = Object.fromEntries(DOC_FIELDS.map((f) => [f.key, null]));

// ─── Password strength ────────────────────────────────────────────────────────
function passwordStrength(pw: string): { level: 0|1|2|3|4; label: string } {
  if (!pw) return { level: 0, label: '' };
  let score = 0;
  if (pw.length >= 8)                   score++;
  if (/[A-Z]/.test(pw))                 score++;
  if (/[0-9]/.test(pw))                 score++;
  if (/[^A-Za-z0-9]/.test(pw))          score++;
  const labels = ['','Weak','Fair','Strong','Very strong'];
  return { level: score as 0|1|2|3|4, label: labels[score] };
}

const STRENGTH_COLORS = ['','bg-danger','bg-warning','bg-success','bg-success'];
const STRENGTH_TEXT   = ['','text-danger','text-warning','text-success','text-success'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DriverSignupPage() {
  const [step, setStep] = useState<1|2|3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Step 1 state
  const [s1, setS1] = useState<Step1>({
    name: '', email: '', phone: '', nationalId: '',
    dateOfBirth: '', address: '', password: '', confirmPassword: '',
  });
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [err1, setErr1]   = useState<Partial<Step1>>({});

  // Step 2 state
  const [s2, setS2] = useState<Step2>({
    carBrand: '', carModel: '', carYear: '', carColor: '',
    licensePlate: '', drivingLicenseNumber: '',
  });
  const [err2, setErr2] = useState<Partial<Step2>>({});

  // Step 3 state
  const [docs, setDocs] = useState<DocFiles>(EMPTY_DOCS);

  const allDocsUploaded = DOC_FIELDS.every((f) => docs[f.key] !== null);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep1() {
    const e: Partial<Step1> = {};
    if (!s1.name.trim() || s1.name.trim().length < 3)           e.name = 'Full name must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email))          e.email = 'Enter a valid email address';
    if (!/^01[0-2,5]{1}[0-9]{8}$/.test(s1.phone.replace(/[-\s]/g,''))) e.phone = 'Enter a valid Egyptian phone number (e.g. 01X-XXXX-XXXX)';
    if (!/^\d{14}$/.test(s1.nationalId))                        e.nationalId = 'National ID must be exactly 14 digits';
    if (!s1.dateOfBirth)                                         e.dateOfBirth = 'Date of birth is required';
    if (!s1.address.trim() || s1.address.trim().length < 10)    e.address = 'Address must be at least 10 characters';
    if (s1.password.length < 8)                                 e.password = 'Password must be at least 8 characters';
    if (s1.password !== s1.confirmPassword)                     e.confirmPassword = 'Passwords do not match';
    return e;
  }

  function validateStep2() {
    const e: Partial<Step2> = {};
    if (!s2.carBrand)                           e.carBrand = 'Select a car brand';
    if (!s2.carModel.trim())                    e.carModel = 'Car model is required';
    if (!s2.carYear)                            e.carYear = 'Select a car year';
    if (!s2.carColor)                           e.carColor = 'Select a car color';
    if (!s2.licensePlate.trim())                e.licensePlate = 'License plate is required';
    if (!s2.drivingLicenseNumber.trim())        e.drivingLicenseNumber = 'Driving license number is required';
    return e;
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleNext1(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErr1(errs); return; }
    setErr1({});
    setStep(2);
    window.scrollTo(0, 0);
  }

  function handleNext2(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErr2(errs); return; }
    setErr2({});
    setStep(3);
    window.scrollTo(0, 0);
  }

  const handleDocChange = useCallback((key: string, file: File | null) => {
    setDocs((prev) => ({ ...prev, [key]: file }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allDocsUploaded) return;
    setLoading(true);

    try {
      // Build FormData for multipart submission
      const fd = new FormData();
      Object.entries(s1).forEach(([k, v]) => fd.append(k, v));
      Object.entries(s2).forEach(([k, v]) => fd.append(k, v));
      DOC_FIELDS.forEach(({ key }) => { if (docs[key]) fd.append(key, docs[key] as File); });

      // Mock: simulate API delay
      await new Promise((r) => setTimeout(r, 1500));
      // Real: await signUpDriver(fd);

      setSubmittedEmail(s1.email);
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const pw = passwordStrength(s1.password);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-secondary-lt flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary">Application submitted!</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            We&apos;ve received your documents. Our team will review your application within 24–48 hours.
          </p>
          <p className="text-text-muted text-sm">
            You&apos;ll receive an email at{' '}
            <span className="font-medium text-primary">{submittedEmail}</span>{' '}
            once your account is approved.
          </p>
          <Link
            href="/auth/signin?for=driver"
            className="block w-full bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Field helpers ───────────────────────────────────────────────────────────
  const inputCls = (err?: string) => [
    'w-full px-3 py-2.5 border rounded-lg text-primary text-sm bg-white focus:outline-none focus:ring-2 transition-shadow placeholder:text-text-muted/60',
    err ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-secondary',
  ].join(' ');

  const selectCls = (err?: string) => [
    'w-full px-3 py-2.5 border rounded-lg text-primary text-sm bg-white focus:outline-none focus:ring-2 transition-shadow',
    err ? 'border-danger focus:ring-danger' : 'border-gray-200 focus:ring-secondary',
  ].join(' ');

  const fieldErr = (msg?: string) => msg ? <p className="mt-1 text-xs text-danger">{msg}</p> : null;

  return (
    <div className="min-h-screen bg-primary py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded w-fit">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <span className="text-primary font-black text-sm">C</span>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">commuter</span>
        </Link>

        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
          <h1 className="text-xl font-bold text-primary mb-1">Driver application</h1>
          <p className="text-text-muted text-sm mb-6">Complete all steps to apply as a Commuter driver</p>

          <StepIndicator currentStep={step} />

          <div className="mt-8">
            {/* ─── STEP 1 ─── */}
            {step === 1 && (
              <form onSubmit={handleNext1} noValidate className="space-y-4">
                <h2 className="font-semibold text-primary mb-3">Personal Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                    <input className={inputCls(err1.name)} value={s1.name} onChange={(e) => setS1({ ...s1, name: e.target.value })} placeholder="Ahmed Hassan" />
                    {fieldErr(err1.name)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
                    <input type="email" className={inputCls(err1.email)} value={s1.email} onChange={(e) => setS1({ ...s1, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
                    {fieldErr(err1.email)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Phone number</label>
                    <input type="tel" inputMode="numeric" className={inputCls(err1.phone)} value={s1.phone} onChange={(e) => setS1({ ...s1, phone: e.target.value })} placeholder="01X-XXXX-XXXX" />
                    {fieldErr(err1.phone)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">National ID</label>
                    <input inputMode="numeric" maxLength={14} className={inputCls(err1.nationalId)} value={s1.nationalId} onChange={(e) => setS1({ ...s1, nationalId: e.target.value.replace(/\D/g,'') })} placeholder="14 digits" />
                    {fieldErr(err1.nationalId)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Date of birth</label>
                  <AgeGateInput value={s1.dateOfBirth} onChange={(v) => setS1({ ...s1, dateOfBirth: v })} error={err1.dateOfBirth} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Home address</label>
                  <textarea rows={2} className={inputCls(err1.address) + ' resize-none'} value={s1.address} onChange={(e) => setS1({ ...s1, address: e.target.value })} placeholder="Street, District, City" />
                  {fieldErr(err1.address)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
                    <div className="relative">
                      <input type={show1 ? 'text' : 'password'} autoComplete="new-password" className={inputCls(err1.password) + ' pr-10'} value={s1.password} onChange={(e) => setS1({ ...s1, password: e.target.value })} placeholder="Min 8 characters" />
                      <button type="button" onClick={() => setShow1(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary focus:outline-none" aria-label={show1 ? 'Hide' : 'Show'}>
                        {show1 ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {s1.password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1">
                          {[1,2,3,4].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${pw.level >= i ? STRENGTH_COLORS[pw.level] : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <p className={`text-[11px] font-medium ${STRENGTH_TEXT[pw.level]}`}>{pw.label}</p>
                      </div>
                    )}
                    {fieldErr(err1.password)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Confirm password</label>
                    <div className="relative">
                      <input type={show2 ? 'text' : 'password'} autoComplete="new-password" className={inputCls(err1.confirmPassword) + ' pr-10'} value={s1.confirmPassword} onChange={(e) => setS1({ ...s1, confirmPassword: e.target.value })} placeholder="Repeat password" />
                      <button type="button" onClick={() => setShow2(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary focus:outline-none" aria-label={show2 ? 'Hide' : 'Show'}>
                        {show2 ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {fieldErr(err1.confirmPassword)}
                  </div>
                </div>

                <button type="submit" className="w-full bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary mt-2">
                  Continue to Car Info →
                </button>
                <p className="text-center text-sm text-text-muted">Already have an account?{' '}
                  <Link href="/auth/signin?for=driver" className="text-secondary hover:underline">Sign in</Link>
                </p>
              </form>
            )}

            {/* ─── STEP 2 ─── */}
            {step === 2 && (
              <form onSubmit={handleNext2} noValidate className="space-y-4">
                <h2 className="font-semibold text-primary mb-3">Car Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Car brand</label>
                    <select className={selectCls(err2.carBrand)} value={s2.carBrand} onChange={(e) => setS2({ ...s2, carBrand: e.target.value })}>
                      <option value="">Select brand</option>
                      {CAR_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    {fieldErr(err2.carBrand)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Car model</label>
                    <input className={inputCls(err2.carModel)} value={s2.carModel} onChange={(e) => setS2({ ...s2, carModel: e.target.value })} placeholder="e.g. Corolla" />
                    {fieldErr(err2.carModel)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Car year</label>
                    <select className={selectCls(err2.carYear)} value={s2.carYear} onChange={(e) => setS2({ ...s2, carYear: e.target.value })}>
                      <option value="">Select year</option>
                      {CAR_YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                    {fieldErr(err2.carYear)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Car color</label>
                    <select className={selectCls(err2.carColor)} value={s2.carColor} onChange={(e) => setS2({ ...s2, carColor: e.target.value })}>
                      <option value="">Select color</option>
                      {CAR_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {fieldErr(err2.carColor)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">License plate</label>
                    <input className={inputCls(err2.licensePlate)} value={s2.licensePlate} onChange={(e) => setS2({ ...s2, licensePlate: e.target.value })} placeholder="أ ب ج 1234" />
                    <p className="mt-0.5 text-[11px] text-text-muted">ℹ️ Latin or Arabic numerals both accepted</p>
                    {fieldErr(err2.licensePlate)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Driving license number</label>
                    <input className={inputCls(err2.drivingLicenseNumber)} value={s2.drivingLicenseNumber} onChange={(e) => setS2({ ...s2, drivingLicenseNumber: e.target.value })} placeholder="DL-XXXXXX" />
                    {fieldErr(err2.drivingLicenseNumber)}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => { setStep(1); window.scrollTo(0,0); }} className="flex-1 border border-primary/20 text-primary font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    ← Back
                  </button>
                  <button type="submit" className="flex-[2] bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    Continue to Documents →
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 3 ─── */}
            {step === 3 && (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <h2 className="font-semibold text-primary">Upload your documents</h2>
                  <p className="text-text-muted text-sm mt-1">All documents are required. Your account will be reviewed within 24–48 hours after submission.</p>
                </div>

                <DocumentUploadStep fields={DOC_FIELDS} files={docs} onChange={handleDocChange} />

                {/* Checklist */}
                <div className="bg-surface border border-primary/10 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Document checklist</p>
                  {DOC_FIELDS.map((f) => (
                    <div key={f.key} className="flex items-center gap-2 text-sm">
                      {docs[f.key] ? (
                        <svg className="w-4 h-4 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Uploaded">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Not uploaded">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/>
                        </svg>
                      )}
                      <span className={docs[f.key] ? 'text-primary' : 'text-text-muted'}>{f.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep(2); window.scrollTo(0,0); }} className="flex-1 border border-primary/20 text-primary font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={!allDocsUploaded || loading}
                    className="flex-[2] bg-secondary text-primary font-bold py-3 rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Submitting…
                      </>
                    ) : 'Submit application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
