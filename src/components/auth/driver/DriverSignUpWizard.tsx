'use client';

import { useState, useEffect } from 'react';
import StepIndicator from '@/components/auth/driver/StepIndicator';
import Step1Personal, { type Step1Data } from '@/components/auth/driver/steps/Step1Personal';
import Step2CarInfo, { type Step2Data } from '@/components/auth/driver/steps/Step2CarInfo';
import Step3Documents, { type Step3Data } from '@/components/auth/driver/steps/Step3Documents';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const SESSION_KEY = 'commuter_driver_signup';

interface WizardData {
  step1?: Partial<Step1Data>;
  step2?: Partial<Step2Data>;
}

function loadWizard(): WizardData {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveWizard(data: WizardData) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearWizard() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export default function DriverSignUpWizard() {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [highestStep, setHighestStep] = useState<number>(1);
  const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({});
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [success, setSuccess] = useState(false);

  // Restore from sessionStorage
  useEffect(() => {
    const saved = loadWizard();
    if (saved.step1) setStep1Data(saved.step1);
    if (saved.step2) setStep2Data(saved.step2);
  }, []);

  function handleStep1(data: Step1Data) {
    setStep1Data(data);
    saveWizard({ step1: data, step2: step2Data });
    setStep(2);
    setHighestStep((h) => Math.max(h, 2));
  }

  function handleStep2(data: Step2Data) {
    setStep2Data(data);
    saveWizard({ step1: step1Data, step2: data });
    setStep(3);
    setHighestStep((h) => Math.max(h, 3));
  }

  async function handleStep3(docs: Step3Data) {
    // In production: build FormData and POST to /api/auth/driver/sign-up
    const formData = new FormData();
    Object.entries(step1Data).forEach(([k, v]) => formData.append(k, String(v)));
    Object.entries(step2Data).forEach(([k, v]) => formData.append(k, String(v)));
    Object.entries(docs).forEach(([k, v]) => { if (v) formData.append(`documents[${k}]`, v); });

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setSubmittedEmail(step1Data.email ?? '');
    clearWizard();
    setSuccess(true);
  }

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: 'Personal information',
    2: 'Car information',
    3: 'Upload documents',
  };

  if (success) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-6">
        <div className="bg-white rounded-[20px] p-10 max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center mb-5">
            <CheckCircle size={64} className="text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">Application submitted!</h2>
          <p className="text-text-muted text-sm leading-relaxed mb-4">
            We&apos;ve received your info and documents. Our team will review your application within 24–48 hours.
          </p>
          <p className="text-sm text-primary mb-8">
            We&apos;ll email you at: <strong>{submittedEmail}</strong>
          </p>
          <Link
            href="/driver/sign-in"
            className="flex items-center justify-center w-full h-[52px] rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#00C2A8', color: '#fff' }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator
        currentStep={step}
        completedUpTo={highestStep - 1}
        onStepClick={(s) => { if (s < step) setStep(s); }}
      />

      <h2 className="text-2xl font-bold text-primary mb-1">{stepTitles[step]}</h2>
      <p className="text-sm text-text-muted mb-6">Step {step} of 3</p>

      {step === 1 && (
        <Step1Personal initial={step1Data} onNext={handleStep1} />
      )}
      {step === 2 && (
        <Step2CarInfo
          initial={step2Data}
          onNext={handleStep2}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Documents
          email={step1Data.email ?? ''}
          onBack={() => setStep(2)}
          onSubmit={handleStep3}
        />
      )}
    </div>
  );
}
