'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import authApi, {
  extractToken, extractRole, extractName, extractId,
  type AuthApiResponse,
} from '@/lib/api/auth';
import { sendOtp, verifyOtp } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';
import { saveUserData } from '@/lib/auth/tokenStorage';
import driverApi from '@/lib/api/driver';
import Step1Info,    { type Step1Data }    from '@/components/auth/user/steps/Step1Info';
import Step2Address, { type Step2Data }    from '@/components/auth/user/steps/Step2Address';
import Step3CarDetails, { type Step3CarData } from '@/components/auth/driver/steps/Step3CarDetails';
import Step3Otp from '@/components/auth/user/steps/Step3Otp';

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Personal info', 'Address', 'Car details', 'Verify email'] as const;

function StepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center mb-8" role="list" aria-label="Sign-up progress">
      {STEPS.map((label, idx) => {
        const n      = (idx + 1) as 1 | 2 | 3 | 4;
        const done   = n < current;
        const active = n === current;

        return (
          <div key={n} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div
              className={[
                'flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-xs font-bold transition-all',
                done   ? 'bg-[#00C2A8] border-[#00C2A8] text-[#0B1E3D]'
                       : active
                       ? 'bg-white border-[#00C2A8] text-[#00C2A8] shadow-[0_0_0_3px_rgba(0,194,168,0.2)]'
                       : 'bg-white border-[#D1D5DB] text-[#9CA3AF]',
              ].join(' ')}
              aria-current={active ? 'step' : undefined}
            >
              {done ? (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                n
              )}
            </div>

            <span className={[
              'ml-1.5 text-xs whitespace-nowrap hidden sm:inline',
              active ? 'text-[#0B1E3D] font-semibold' : done ? 'text-[#00C2A8] font-medium' : 'text-[#9CA3AF]',
            ].join(' ')}>
              {label}
            </span>

            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 ${done ? 'bg-[#00C2A8]' : 'bg-[#E2E8F0]'}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function DriverSignUpWizard() {
  const router = useRouter();
  const { login } = useAuth();

  const [step,          setStep]          = useState<1 | 2 | 3 | 4>(1);
  const [step1Data,     setStep1Data]     = useState<Partial<Step1Data>>({});
  const [step2Data,     setStep2Data]     = useState<Partial<Step2Data>>({});
  const [step3Data,     setStep3Data]     = useState<Partial<Step3CarData>>({});
  const [loading,       setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError,      setOtpError]      = useState<string | null>(null);
  const [pendingAuth,   setPendingAuth]   = useState<AuthApiResponse | null>(null);

  useRedirectIfAuth();

  function handleStep1(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  function handleStep2(addrData: Step2Data) {
    setStep2Data(addrData);
    setStep(3);
  }

  async function handleStep3(carData: Step3CarData) {
    if (!step1Data.name) return;
    setStep3Data(carData);
    setLoading(true);
    try {
      const addrData = step2Data as Step2Data;
      const result = await authApi.register({
        role:                  'driver',
        name:                  step1Data.name!.trim(),
        email:                 step1Data.email!.trim(),
        phone_number:          step1Data.phone_number!,
        whatsapp_number:       step1Data.whatsapp_same_as_phone
                                 ? step1Data.phone_number!
                                 : step1Data.whatsapp_number!,
        province:              addrData.province.trim(),
        gender:                step1Data.gender ?? 'male',
        birthdate:             step1Data.birthdate ?? '',
        district:              addrData.district.trim(),
        sub_district:          addrData.sub_district.trim(),
        building:              addrData.building.trim(),
        street:                addrData.street.trim(),
        landmark:              addrData.landmark.trim(),
        password:              step1Data.password!,
        password_confirmation: step1Data.password_confirmation!,
      });
      setPendingAuth(result);
      await sendOtp(step1Data.email!.trim());
      setStep(4);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!step1Data.email || !pendingAuth) return;
    setLoading(true);
    setOtpError(null);
    try {
      await verifyOtp(step1Data.email.trim(), code);
      const token = extractToken(pendingAuth);
      if (token) {
        login({
          token,
          role: extractRole(pendingAuth) || 'driver',
          name: extractName(pendingAuth) || step1Data.name!.trim(),
          id:   extractId(pendingAuth),
        });
        if (typeof window !== 'undefined') localStorage.setItem('commuter_email', step1Data.email!.trim());
        const registeredUser = (pendingAuth as AuthApiResponse & { user?: Record<string, unknown> }).user ?? {};
        saveUserData({
          ...registeredUser,
          name:            step1Data.name!.trim(),
          email:           step1Data.email!.trim(),
          phone_number:    step1Data.phone_number ?? '',
          whatsapp_number: step1Data.whatsapp_same_as_phone ? step1Data.phone_number : (step1Data.whatsapp_number ?? ''),
          gender:          step1Data.gender ?? 'male',
          date_of_birth:   step1Data.birthdate ?? '',
          role:            'driver',
        });

        // Save car details immediately after login
        const carData = step3Data as Step3CarData;
        try {
          await driverApi.updateDriverProfile({
            national_id:    carData.national_id    || null,
            license_expiry: carData.license_expiry || null,
            car_type:       carData.car_type       || null,
            car_brand:      carData.car_brand      || null,
            car_model:      carData.car_model      || null,
            car_year:       carData.car_year ? Number(carData.car_year) : null,
            car_color:      carData.car_color      || null,
            license_plate:  carData.license_plate  || null,
            location_name:  carData.location_name  || null,
          });
        } catch {
          // Non-fatal — driver can update later from profile
        }

        toast.success(`Welcome to Commuter, ${step1Data.name!.trim()}! 🎉`);
        router.replace('/driver/onboarding');
      } else {
        router.replace('/driver/sign-in?registered=true');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!step1Data.email) return;
    setResendLoading(true);
    setOtpError(null);
    try {
      await sendOtp(step1Data.email.trim());
      toast.success('A new code has been sent to your email.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold text-[#0B1E3D] mb-1">Become a driver</h1>
      <p className="text-sm text-[#5A6A7A] mb-6">Join Commuter as a driver partner</p>

      <StepBar current={step} />

      {step === 1 && (
        <Step1Info initial={step1Data} onNext={handleStep1} />
      )}
      {step === 2 && (
        <Step2Address
          initial={step2Data}
          loading={false}
          onBack={() => setStep(1)}
          onSubmit={handleStep2}
        />
      )}
      {step === 3 && (
        <Step3CarDetails
          initial={step3Data}
          loading={loading}
          onBack={() => setStep(2)}
          onNext={handleStep3}
        />
      )}
      {step === 4 && (
        <Step3Otp
          email={step1Data.email ?? ''}
          loading={loading}
          resendLoading={resendLoading}
          error={otpError}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
        />
      )}

      <p className="mt-5 text-center text-sm text-[#5A6A7A]">
        Already have an account?{' '}
        <Link href="/driver/sign-in" className="text-[#00C2A8] font-medium hover:underline">
          Sign in →
        </Link>
      </p>
    </div>
  );
}
